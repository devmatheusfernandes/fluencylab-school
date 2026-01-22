"use server";

import { adminDb as db } from "@/lib/firebase/admin";
import { Plan, SRSData, PracticeResult } from "@/types/plan";
import { DailyPracticeSession, PracticeItem, PracticeSessionState } from "@/types/practice";
import { LearningItem, LearningStructure, Lesson } from "@/types/lesson";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { getModeForDay, generatePayload, generateQuizItems } from "@/lib/practice-logic";
import { FieldValue, FieldPath } from "firebase-admin/firestore";

// Helper to ensure data is serializable (converts Timestamps to Dates)
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;
  
  // Handle Firestore Timestamp
  if (typeof data.toDate === 'function') {
    return data.toDate();
  }
  
  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  
  // Handle Objects
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeFirestoreData(data[key]);
    }
    return result;
  }
  
  return data;
}

// Helper to safely parse dates
function parseLessonDate(date: any): Date | null {
    if (!date) return null;
    try {
        if (typeof date === 'string') return parseISO(date);
        if (typeof date.toDate === 'function') return date.toDate();
        return new Date(date);
    } catch (e) {
        return null;
    }
}

// Helper: SM-2 Algorithm Implementation
function calculateNextSRS(currentSRS: SRSData | undefined, grade: number): SRSData {
    // Defaults for new item
    let interval = 0;
    let repetition = 0;
    let easeFactor = 2.5;

    if (currentSRS) {
        interval = currentSRS.interval || 0;
        repetition = currentSRS.repetition || 0;
        easeFactor = currentSRS.easeFactor || 2.5;
    }

    if (grade >= 3) {
        // Correct response
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetition += 1;
    } else {
        // Incorrect response: Reset interval
        repetition = 0;
        interval = 1;
    }

    // Update Ease Factor
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3; // Minimum threshold

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);

    return {
        interval,
        repetition,
        easeFactor,
        dueDate: dueDate
    };
}

function getPracticeCycle(plan: Plan) {
    const today = startOfDay(new Date());
    
    if (!plan.lessons || !Array.isArray(plan.lessons)) {
        return { currentDay: 1, activeLesson: undefined, isClassDay: false };
    }

    // Type casting to handle the map projection correctly
    const validLessons = plan.lessons
        .map(l => ({ ...l, parsedDate: parseLessonDate(l.scheduledDate) }))
        .filter(l => l.parsedDate !== null) as (typeof plan.lessons[0] & { parsedDate: Date })[];
    
    // Sort descending (newest first)
    validLessons.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

    // Check for class today
    const classToday = validLessons.find(l => differenceInCalendarDays(today, l.parsedDate) === 0);
    if (classToday) {
        return { currentDay: 0, activeLesson: classToday, isClassDay: true };
    }

    // Find most recent past class
    const lastClass = validLessons.find(l => differenceInCalendarDays(today, l.parsedDate) > 0);

    if (lastClass) {
        const diff = differenceInCalendarDays(today, lastClass.parsedDate);
        
        // Cycle runs for 6 days after class (Days 1-6)
        // We use completedPracticeDays to track progress. 
        // If undefined, we default to 0 (resetting to Day 1) to allow delayed students to start from the beginning.
        const completed = lastClass.completedPracticeDays || 0;
        const nextSequenceDay = completed + 1;

        // Rule: Can practice if within calendar limit (Catch Up)
        // Cannot practice future days (No getting ahead)
        if (nextSequenceDay <= 6 && nextSequenceDay <= diff) {
            return { currentDay: nextSequenceDay, activeLesson: lastClass, isClassDay: false };
        }
    }

    // Default if no active cycle (e.g. gap between cycles or cycle completed/up-to-date)
    return { currentDay: 7, activeLesson: undefined, isClassDay: false };
}

/**
 * Retrieves the daily practice session for a student based on their plan.
 */
export async function getDailyPractice(planId: string): Promise<DailyPracticeSession> {
    try {
        console.log(`[getDailyPractice] Starting for plan ${planId}`);
        const planRef = db.collection("plans").doc(planId);
        const planDoc = await planRef.get();
        
        if (!planDoc.exists) {
            throw new Error("Plan not found");
        }

        const plan = planDoc.data() as Plan;
        const today = startOfDay(new Date());

        const isReviewedToday = (lastReviewedAt: any) => {
            if (!lastReviewedAt) return false;
            try {
                const reviewDate = typeof lastReviewedAt === 'string'
                    ? parseISO(lastReviewedAt)
                    : (lastReviewedAt as any).toDate ? (lastReviewedAt as any).toDate() : new Date(lastReviewedAt as any);
                return startOfDay(reviewDate).getTime() === today.getTime();
            } catch (e) {
                return false;
            }
        };
        
        const itemsToPractice: PracticeItem[] = [];

        // 1. Determine Cycle & Mode
        const { currentDay, activeLesson, isClassDay } = getPracticeCycle(plan);
        console.log(`[getDailyPractice] Cycle: Day ${currentDay}, ClassDay: ${isClassDay}, ActiveLesson: ${activeLesson?.id}`);

        if (isClassDay) {
             console.log("[getDailyPractice] It is class day, returning empty session.");
             return { mode: 'review_standard', dayIndex: 0, items: [] };
        }

        const mode = getModeForDay(currentDay);
        
        // QUIZ MODE LOGIC (Day 5 & 6)
        if (mode === 'quiz_comprehensive' || mode === 'listening_choice') {
            if (activeLesson) {
                const lessonDoc = await db.collection("lessons").doc(activeLesson.id).get();
                if (lessonDoc.exists) {
                    const fullLessonContext = { id: lessonDoc.id, ...lessonDoc.data() } as Lesson;
                    
                    if (mode === 'listening_choice') {
                        // Fetch all learning items for this lesson
                        const itemIds = activeLesson.learningItemsIds?.map(i => i.id) || [];
                        const learningItems: LearningItem[] = [];
                        
                        if (itemIds.length > 0) {
                            const chunks = [];
                            for (let i = 0; i < itemIds.length; i += 10) {
                                chunks.push(itemIds.slice(i, i + 10));
                            }
                            
                            for (const chunk of chunks) {
                                const snap = await db.collection('learningItems').where(FieldPath.documentId(), 'in', chunk).get();
                                snap.docs.forEach(doc => {
                                    learningItems.push({ id: doc.id, ...doc.data() } as LearningItem);
                                });
                            }
                        }

                        const practiceItem: PracticeItem = {
                            id: fullLessonContext.id,
                            type: 'item',
                            renderMode: 'listening_choice',
                            mainText: fullLessonContext.title,
                            interactiveListening: {
                                audioUrl: fullLessonContext.audioUrl || '',
                                transcriptSegments: fullLessonContext.transcriptSegments || [],
                                learningItems: learningItems
                            }
                        };

                        return {
                            mode,
                            dayIndex: currentDay,
                            items: serializeFirestoreData([practiceItem])
                        };
                    }

                    if (!fullLessonContext.quiz) {
                        return { mode, dayIndex: currentDay, items: [], error: "No quiz available for this lesson." };
                    }

                    // Build SRS Map from all possible sources in the plan to link progress
                    const srsMap = new Map<string, SRSData>();
                    
                    const addToMap = (list: any[]) => {
                        if (!list) return;
                        list.forEach(i => {
                            if (i.srsData) srsMap.set(i.id, i.srsData);
                        });
                    };

                    addToMap(activeLesson.learningItemsIds);
                    addToMap(activeLesson.learningStructureIds);
                    addToMap(plan.learnedComponentsIds);
                    addToMap(plan.reviewLearnedComponentsIds);

                    const quizItems = generateQuizItems(fullLessonContext, mode, srsMap);
                    
                    console.log(`[getDailyPractice] Generated ${quizItems.length} quiz items`);

                    return {
                        mode,
                        dayIndex: currentDay,
                        items: serializeFirestoreData(quizItems)
                    };
                }
            }
             return { mode, dayIndex: currentDay, items: [], error: "Lesson content not found." };
        }
        
        // STANDARD PRACTICE LOGIC (Day 1-4)
        // Helper to fetch and generate payload
        const fetchAndGenerate = async (
            itemIds: { id: string, srsData?: SRSData, lastReviewedAt?: Date | string }[], 
            collectionName: string, 
            lessonContext: Lesson,
            practiceMode: any,
            ignoreReviewCheck: boolean = false
        ) => {
            if (itemIds.length === 0) return;
            
            const validIds = itemIds.map(i => i.id);
            const srsMap = new Map(itemIds.map(i => [i.id, i]));

            const chunks = [];
            for (let i = 0; i < validIds.length; i += 10) {
                chunks.push(validIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                if (chunk.length === 0) continue;
                const snap = await db.collection(collectionName).where(FieldPath.documentId(), 'in', chunk).get();
                
                snap.docs.forEach(doc => {
                    try {
                        const dbData = { id: doc.id, ...doc.data() } as LearningItem | LearningStructure;
                        const payload = generatePayload(dbData, practiceMode, lessonContext);
                        
                        // Merge SRS Data from Plan
                        if (srsMap.has(doc.id)) {
                            const planItem = srsMap.get(doc.id);

                            // Skip if already reviewed today (prevent farming), unless ignoring check (Active Lesson Catch Up)
                            if (planItem && isReviewedToday(planItem.lastReviewedAt) && !ignoreReviewCheck) {
                                return;
                            }

                            if (planItem && planItem.srsData) {
                                payload.srsData = planItem.srsData;
                            }
                        }
                        
                        itemsToPractice.push(payload);
                    } catch (err) {
                        console.error(`Error generating payload for ${doc.id}:`, err);
                    }
                });
            }
        };

        // 2. Add Active Lesson Items
        if (activeLesson) {
            let fullLessonContext: Lesson | undefined;
            const lessonDoc = await db.collection("lessons").doc(activeLesson.id).get();
            if (lessonDoc.exists) {
                fullLessonContext = { id: lessonDoc.id, ...lessonDoc.data() } as Lesson;
            }

            if (fullLessonContext) {
                // Pass true to ignoreReviewCheck for active lesson items to allow catch-up multiple sessions per day
                await fetchAndGenerate(activeLesson.learningItemsIds || [], "learningItems", fullLessonContext, mode, true);
                await fetchAndGenerate(activeLesson.learningStructureIds || [], "learningStructures", fullLessonContext, mode, true);
            }
        }

        // 3. Add Review Items (Due Today)
        // Prevent duplication: Collect IDs currently in Active Lesson
        const activeLessonItemIds = new Set<string>();
        if (activeLesson) {
             activeLesson.learningItemsIds?.forEach(i => activeLessonItemIds.add(i.id));
             activeLesson.learningStructureIds?.forEach(i => activeLessonItemIds.add(i.id));
        }

        const dueItems: { id: string, srsData?: SRSData, type: 'item' | 'structure' }[] = [];
        
        const checkDue = (list: any[], type: 'item' | 'structure') => {
            if (!list) return;
            list.forEach(item => {
                // Skip if item is currently in the active lesson (avoid double practice)
                if (activeLessonItemIds.has(item.id)) return;

                if (item.srsData && item.srsData.dueDate) {
                    const dueDate = parseLessonDate(item.srsData.dueDate);
                    if (dueDate && startOfDay(dueDate) <= today) {
                        dueItems.push({ ...item, type });
                    }
                }
            });
        };

        checkDue(plan.learnedComponentsIds, 'item'); // Assuming learnedComponentsIds stores mixed or we check type logic
        // Note: Ideally learnedComponentsIds should store type, or we infer it. 
        // For simplicity, let's assume we try to fetch from both or we know the IDs.
        // Actually, existing code implies `learningItems` and `learningStructures`. 
        // Let's check `reviewLearnedComponentsIds` too.
        checkDue(plan.reviewLearnedComponentsIds, 'item');

        // Fetch Due Items
        // Since we don't know for sure if it's item or structure just by ID in `learnedComponentsIds` (unless structure is explicit),
        // we might need a robust way. Assuming for now they are mostly items or we check both collections if needed.
        // Or better: The plan should store the type.
        // If we can't determine, we might skip or try one.
        // Let's assume for this implementation we treat them as Items for review standard.
        
        if (dueItems.length > 0) {
            // We need a dummy lesson context for review items if they don't belong to active lesson
            // Or we fetch their original lesson? Too expensive.
            // We'll pass a minimal context.
            const dummyContext = { id: 'review', title: 'Review' } as Lesson;
            
            await fetchAndGenerate(dueItems, "learningItems", dummyContext, 'review_standard');
            // If structures are in the same list, we might miss them if we only query learningItems.
            // In a real app, `learnedComponentsIds` should probably store { id, type: 'item' | 'structure' }.
        }

        console.log(`[getDailyPractice] Returning ${itemsToPractice.length} items`);

        return {
            mode,
            dayIndex: currentDay,
            items: serializeFirestoreData(itemsToPractice)
        };

    } catch (error) {
        console.error("Error generating daily practice:", error);
        return { mode: 'review_standard', dayIndex: 1, items: [] };
    }
}


/**
 * Saves the current session progress to allow resuming later.
 */
export async function saveSessionProgress(planId: string, state: PracticeSessionState) {
    try {
        const sessionRef = db.collection("plans").doc(planId).collection("practice_sessions").doc("current");
        // Convert any custom types to plain objects if necessary
        await sessionRef.set(state);
    } catch (error) {
        console.error("Error saving session progress:", error);
        throw error;
    }
}

/**
 * Retrieves the saved session progress.
 */
export async function getSessionProgress(planId: string): Promise<PracticeSessionState | null> {
    try {
        const sessionRef = db.collection("plans").doc(planId).collection("practice_sessions").doc("current");
        const doc = await sessionRef.get();
        if (doc.exists) {
            const data = doc.data();
            return serializeFirestoreData(data) as PracticeSessionState;
        }
        return null;
    } catch (error) {
        console.error("Error getting session progress:", error);
        return null;
    }
}

/**
 * Clears the saved session progress (e.g., after completion).
 */
export async function clearSessionProgress(planId: string) {
    try {
        const sessionRef = db.collection("plans").doc(planId).collection("practice_sessions").doc("current");
        await sessionRef.delete();
    } catch (error) {
        console.error("Error clearing session progress:", error);
    }
}

/**
 * Processes the results of a practice session (SRS updates).
 */
export async function processPracticeResults(planId: string, results: PracticeResult[]) {
    try {
        const planRef = db.collection("plans").doc(planId);
        
        await db.runTransaction(async (t) => {
            const planDoc = await t.get(planRef);
            if (!planDoc.exists) throw new Error("Plan not found");

            const planData = planDoc.data() as Plan;
            const updates: any = {
                "metadata.updatedAt": FieldValue.serverTimestamp()
            };

            // Map results for quick lookup
            const resultsMap = new Map(results.map(r => [r.itemId, r.grade]));
            const itemsToAddToLearned: any[] = []; // Track items that graduate to "Learned" status

            // 1. Update items in Active Lessons (learningItemsIds / learningStructureIds)
            if (planData.lessons && Array.isArray(planData.lessons)) {
                const updatedLessons = planData.lessons.map(lesson => {
                    let changed = false;

                    // Update Learning Items
                    const newItems = lesson.learningItemsIds?.map(item => {
                        if (resultsMap.has(item.id)) {
                            const grade = resultsMap.get(item.id)!;
                            const newSRS = calculateNextSRS(item.srsData, grade);
                            changed = true;
                            
                            const updatedItem = { ...item, srsData: newSRS, lastReviewedAt: new Date(), updatedAt: new Date() };

                            // Graduation Logic: If interval >= 1 (meaning successfully reviewed at least once), mark as learned
                            // We COPY it to the learned list so it counts for stats and future reviews, 
                            // but we keep it here so the lesson cycle continues.
                            if (newSRS.interval >= 1) {
                                itemsToAddToLearned.push(updatedItem);
                            }

                            return updatedItem;
                        }
                        return item;
                    });

                    // Update Learning Structures
                    const newStructures = lesson.learningStructureIds?.map(struct => {
                         if (resultsMap.has(struct.id)) {
                            const grade = resultsMap.get(struct.id)!;
                            const newSRS = calculateNextSRS(struct.srsData, grade);
                            changed = true;

                            const updatedStruct = { ...struct, srsData: newSRS, lastReviewedAt: new Date(), updatedAt: new Date() };

                            // Graduation Logic
                            if (newSRS.interval >= 1) {
                                itemsToAddToLearned.push(updatedStruct);
                            }

                            return updatedStruct;
                        }
                        return struct;
                    });

                    if (changed) {
                        return { 
                            ...lesson, 
                            learningItemsIds: newItems || lesson.learningItemsIds,
                            learningStructureIds: newStructures || lesson.learningStructureIds
                        };
                    }
                    return lesson;
                });
                
                updates.lessons = updatedLessons;
            }

            // 2. Update items in Review Queue (learnedComponentsIds / reviewLearnedComponentsIds)
            if (planData.learnedComponentsIds) {
                const updatedLearned = planData.learnedComponentsIds.map(comp => {
                    if (resultsMap.has(comp.id)) {
                        const grade = resultsMap.get(comp.id)!;
                        const newSRS = calculateNextSRS(comp.srsData, grade);
                        return { ...comp, srsData: newSRS, lastReviewedAt: new Date() };
                    }
                    return comp;
                });
                updates.learnedComponentsIds = updatedLearned;
            }

            if (planData.reviewLearnedComponentsIds) {
                const updatedReview = planData.reviewLearnedComponentsIds.map(comp => {
                    if (resultsMap.has(comp.id)) {
                        const grade = resultsMap.get(comp.id)!;
                        const newSRS = calculateNextSRS(comp.srsData, grade);
                        return { ...comp, srsData: newSRS, lastReviewedAt: new Date() };
                    }
                    return comp;
                });
                updates.reviewLearnedComponentsIds = updatedReview;
            }

            // 3. Add Graduated Items to Learned List
            if (itemsToAddToLearned.length > 0) {
                // Get the latest state of learned list (either from updates or original)
                const currentLearned = updates.learnedComponentsIds || planData.learnedComponentsIds || [];
                const currentReview = updates.reviewLearnedComponentsIds || planData.reviewLearnedComponentsIds || [];
                
                // Create a Set of existing IDs to prevent duplicates
                // Check both lists because an item might have moved to review list already
                const existingIds = new Set([
                    ...currentLearned.map((i: any) => i.id),
                    ...currentReview.map((i: any) => i.id)
                ]);

                // Filter out items that are already in the learned/review lists
                const uniqueNewItems = itemsToAddToLearned.filter(item => !existingIds.has(item.id));
                
                if (uniqueNewItems.length > 0) {
                    // Append new items to learnedComponentsIds
                    updates.learnedComponentsIds = [...currentLearned, ...uniqueNewItems];
                }
            }

            // 4. Update completedPracticeDays (Progress Tracking)
            // Increment completed days for the active lesson to advance the cycle
            const lessonsSource = updates.lessons || planData.lessons;
            if (lessonsSource && Array.isArray(lessonsSource)) {
                 const today = startOfDay(new Date());
                 
                 // We need to find the active lesson based on DATE (same logic as getPracticeCycle)
                 const validLessons = lessonsSource
                    .map((l: any) => ({ ...l, parsedDate: parseLessonDate(l.scheduledDate) }))
                    .filter((l: any) => l.parsedDate !== null);
                 
                 validLessons.sort((a: any, b: any) => b.parsedDate.getTime() - a.parsedDate.getTime());
                 
                 const lastClass = validLessons.find((l: any) => differenceInCalendarDays(today, l.parsedDate) > 0);
                 
                 if (lastClass) {
                     const lessonIndex = lessonsSource.findIndex((l: any) => l.id === lastClass.id);
                     if (lessonIndex !== -1) {
                         const currentCompleted = lessonsSource[lessonIndex].completedPracticeDays || 0;
                         
                         // Only advance if not finished (Max 6 days)
                         if (currentCompleted < 6) {
                             // Create a new array if we haven't already (if we are modifying planData.lessons directly)
                             if (!updates.lessons) {
                                 updates.lessons = [...lessonsSource];
                             }
                             
                             // Update the specific lesson
                             updates.lessons[lessonIndex] = {
                                 ...updates.lessons[lessonIndex],
                                 completedPracticeDays: currentCompleted + 1
                             };
                         }
                     }
                 }
            }

            t.update(planRef, updates);
        });

        // Clear the saved session
        await clearSessionProgress(planId);
        
        return { success: true };
    } catch (error) {
        console.error("Error processing results:", error);
        throw error;
    }
}

/**
 * Retrieves student learning stats for the dashboard.
 */
export async function getStudentLearningStats(planId: string) {
    try {
        const planRef = db.collection("plans").doc(planId);
        const planDoc = await planRef.get();
        if (!planDoc.exists) throw new Error("Plan not found");

        const plan = planDoc.data() as Plan;
        const today = startOfDay(new Date());

        let reviewedToday = 0;
        let dueToday = 0;
        let totalLearned = (plan.learnedComponentsIds?.length || 0) + (plan.reviewLearnedComponentsIds?.length || 0);

        // Calculate Due Today
        const isDue = (item: { srsData?: SRSData }) => {
            try {
                if (!item.srsData || !item.srsData.dueDate) return false;
                const dueDate = typeof item.srsData.dueDate === 'string'
                  ? parseISO(item.srsData.dueDate)
                  : (item.srsData.dueDate as any).toDate ? (item.srsData.dueDate as any).toDate() : new Date(item.srsData.dueDate as any);
                return startOfDay(dueDate) <= today;
            } catch (e) {
                return false;
            }
        };

        if (plan.reviewLearnedComponentsIds) {
            dueToday += plan.reviewLearnedComponentsIds.filter(isDue).length;
        }
        if (plan.learnedComponentsIds) {
            dueToday += plan.learnedComponentsIds.filter(isDue).length;
        }
        
        // Check items in active lessons
        if (plan.lessons && Array.isArray(plan.lessons)) {
            plan.lessons.forEach(lesson => {
                if (lesson.learningItemsIds) {
                    dueToday += lesson.learningItemsIds.filter(isDue).length;
                }
                if (lesson.learningStructureIds) {
                    dueToday += lesson.learningStructureIds.filter(isDue).length;
                }
            });
        }

        // Calculate Reviewed Today
        const isReviewedToday = (item: { lastReviewedAt?: any }) => {
            try {
                if (!item.lastReviewedAt) return false;
                const reviewDate = typeof item.lastReviewedAt === 'string'
                  ? parseISO(item.lastReviewedAt)
                  : (item.lastReviewedAt as any).toDate ? (item.lastReviewedAt as any).toDate() : new Date(item.lastReviewedAt as any);
                return startOfDay(reviewDate).getTime() === today.getTime();
            } catch (e) {
                return false;
            }
        };

        if (plan.learnedComponentsIds) {
            reviewedToday += plan.learnedComponentsIds.filter(isReviewedToday).length;
        }
        if (plan.reviewLearnedComponentsIds) {
            reviewedToday += plan.reviewLearnedComponentsIds.filter(isReviewedToday).length;
        }

        // Check items in active lessons
        if (plan.lessons && Array.isArray(plan.lessons)) {
            plan.lessons.forEach(lesson => {
                if (lesson.learningItemsIds) {
                    reviewedToday += lesson.learningItemsIds.filter(isReviewedToday).length;
                }
                if (lesson.learningStructureIds) {
                    reviewedToday += lesson.learningStructureIds.filter(isReviewedToday).length;
                }
            });
        }

        // Calculate Current Day & Days Since Class for UI
        let currentDay = 1;
        let daysSinceClass = 0;
        let hasActiveLesson = false;

        if (plan.lessons && Array.isArray(plan.lessons)) {
             const validLessons = plan.lessons
                .map(l => ({ ...l, parsedDate: parseLessonDate(l.scheduledDate) }))
                .filter(l => l.parsedDate !== null) as (typeof plan.lessons[0] & { parsedDate: Date })[];
            
             validLessons.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
             
             // Find most recent past class
             const lastClass = validLessons.find(l => differenceInCalendarDays(today, l.parsedDate) > 0);
             
             if (lastClass) {
                 daysSinceClass = differenceInCalendarDays(today, lastClass.parsedDate);
                 const completed = lastClass.completedPracticeDays || 0;
                 currentDay = completed + 1;
                 
                 // Active only if not fully completed (assuming 6 days cycle)
                 if (completed < 6) {
                     hasActiveLesson = true;
                 }
             }
        }

        return {
            reviewedToday,
            dueToday,
            totalLearned,
            currentDay,
            daysSinceClass,
            hasActiveLesson
        };

    } catch (error) {
        console.error("Error fetching student stats:", error);
        return { reviewedToday: 0, dueToday: 0, totalLearned: 0, currentDay: 1, daysSinceClass: 0, hasActiveLesson: false };
    }
}

/**
 * Retrieves the active plan ID for a student.
 */
export async function getActivePlanId(studentId: string) {
    try {
        const snapshot = await db.collection("plans")
            .where("studentId", "==", studentId)
            .where("status", "==", "active")
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        return snapshot.docs[0].id;
    } catch (error) {
        console.error("Error fetching active plan:", error);
        return null;
    }
}
