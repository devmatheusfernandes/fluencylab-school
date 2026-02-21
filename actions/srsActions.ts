"use server";

import { adminDb as db } from "@/lib/firebase/admin";
import {
  Plan,
  SRSData,
  PracticeResult,
  PlanSRSState,
  SRSStatus,
} from "@/types/learning/plan";
import {
  DailyPracticeSession,
  PracticeItem,
  PracticeSessionState,
} from "@/types/learning/practice";
import {
  LearningItem,
  LearningStructure,
  Lesson,
} from "@/types/learning/lesson";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import {
  getModeForDay,
  generatePayload,
  generateQuizItems,
} from "@/lib/learning/practiceLogic";
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import { User } from "@/types/users/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateNextReview } from "@/lib/learning/srsAlgorithm";

function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Firestore Timestamp
  if (typeof data.toDate === "function") {
    return data.toDate();
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  // Handle Objects
  if (typeof data === "object" && !(data instanceof Date)) {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeFirestoreData(data[key]);
    }
    return result;
  }

  return data;
}

function parseLessonDate(date: any): Date | null {
  if (!date) return null;
  try {
    if (typeof date === "string") return parseISO(date);
    if (typeof date.toDate === "function") return date.toDate();
    return new Date(date);
  } catch (e) {
    return null;
  }
}

function getSRSStatus(interval: number): SRSStatus {
  if (interval < 7) return "learning";
  if (interval < 30) return "learned";
  return "mastered";
}

function getDueItemsFromSrsMap(
  srsMap: Record<string, PlanSRSState>,
  today: Date,
  excludeIds: Set<string>,
) {
  const start = startOfDay(today).getTime();

  return Object.entries(srsMap)
    .filter(([id, state]) => {
      if (excludeIds.has(id)) return false;
      const due = parseLessonDate(state.dueDate)?.getTime() ?? 0;
      return due <= start;
    })
    .map(([id, state]) => ({
      id,
      type: state.type,
      srsData: {
        interval: state.interval,
        repetition: state.repetition,
        easeFactor: state.easeFactor,
        dueDate: state.dueDate,
      } as SRSData,
    }));
}

function getPracticeCycle(plan: Plan) {
  const today = startOfDay(new Date());

  if (!plan.lessons || !Array.isArray(plan.lessons)) {
    return { currentDay: 1, activeLesson: undefined, isClassDay: false };
  }

  // Type casting to handle the map projection correctly
  const validLessons = plan.lessons
    .map((l) => ({ ...l, parsedDate: parseLessonDate(l.scheduledDate) }))
    .filter((l) => l.parsedDate !== null) as ((typeof plan.lessons)[0] & {
    parsedDate: Date;
  })[];

  // Sort descending (newest first)
  validLessons.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  // Check for class today
  const classToday = validLessons.find(
    (l) => differenceInCalendarDays(today, l.parsedDate) === 0,
  );
  if (classToday) {
    return { currentDay: 0, activeLesson: classToday, isClassDay: true };
  }

  // Find most recent past class that is NOT fully completed
  const lastClass = validLessons.find(
    (l) =>
      differenceInCalendarDays(today, l.parsedDate) > 0 &&
      (l.completedPracticeDays || 0) < 6,
  );

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
      return {
        currentDay: nextSequenceDay,
        activeLesson: lastClass,
        isClassDay: false,
      };
    }
  }

  // Default if no active cycle (e.g. gap between cycles or cycle completed/up-to-date)
  return { currentDay: 7, activeLesson: undefined, isClassDay: false };
}

/**
 * Retrieves the daily practice session for a student based on their plan.
 */
export async function getDailyPractice(
  planId: string,
  dayOverride?: number,
  lessonId?: string,
): Promise<DailyPracticeSession> {
  try {
    // console.log(`[getDailyPractice] Starting for plan ${planId}`);
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
        const reviewDate =
          typeof lastReviewedAt === "string"
            ? parseISO(lastReviewedAt)
            : (lastReviewedAt as any).toDate
              ? (lastReviewedAt as any).toDate()
              : new Date(lastReviewedAt as any);
        return startOfDay(reviewDate).getTime() === today.getTime();
      } catch (e) {
        return false;
      }
    };

    const itemsToPractice: PracticeItem[] = [];

    // 1. Determine Cycle & Mode
    let { currentDay, activeLesson, isClassDay } = getPracticeCycle(plan);

    if (lessonId) {
      // Force specific lesson for replay
      const foundLesson = plan.lessons?.find((l) => l.id === lessonId);
      if (foundLesson) {
        const parsedLesson = {
          ...foundLesson,
          parsedDate: parseLessonDate(foundLesson.scheduledDate) || new Date(),
        };
        activeLesson = parsedLesson as typeof foundLesson & {
          parsedDate: Date;
        };
        isClassDay = false; // Always practice mode for history replay
      }
    }

    if (dayOverride !== undefined) {
      currentDay = dayOverride;
      isClassDay = false;
    }
    // console.log(`[getDailyPractice] Cycle: Day ${currentDay}, ClassDay: ${isClassDay}, ActiveLesson: ${activeLesson?.id}`);

    if (isClassDay) {
      // console.log("[getDailyPractice] It is class day, returning empty session.");
      return { mode: "review_standard", dayIndex: 0, items: [] };
    }

    const mode = getModeForDay(currentDay);

    // QUIZ MODE LOGIC (Day 5 & 6)
    if (mode === "quiz_comprehensive" || mode === "listening_choice") {
      if (activeLesson) {
        const lessonDoc = await db
          .collection("lessons")
          .doc(activeLesson.id)
          .get();
        if (lessonDoc.exists) {
          const fullLessonContext = {
            id: lessonDoc.id,
            ...lessonDoc.data(),
          } as Lesson;

          // Determine effective mode: If Listening Choice but no audio, fallback to Quiz Comprehensive
          let effectiveMode = mode;
          if (mode === "listening_choice" && !fullLessonContext.audioUrl) {
            console.warn(
              "[getDailyPractice] Day 6 Listening Choice: No audio URL found. Falling back to Quiz Comprehensive.",
            );
            effectiveMode = "quiz_comprehensive";
          }

          if (effectiveMode === "listening_choice") {
            // Fetch all learning items for this lesson
            const itemIds =
              activeLesson.learningItemsIds?.map((i) => i.id) || [];
            const learningItems: LearningItem[] = [];

            if (itemIds.length > 0) {
              const chunks = [];
              for (let i = 0; i < itemIds.length; i += 10) {
                chunks.push(itemIds.slice(i, i + 10));
              }

              for (const chunk of chunks) {
                const snap = await db
                  .collection("learningItems")
                  .where(FieldPath.documentId(), "in", chunk)
                  .get();
                snap.docs.forEach((doc) => {
                  learningItems.push({
                    id: doc.id,
                    ...doc.data(),
                  } as LearningItem);
                });
              }
            }

            const practiceItem: PracticeItem = {
              id: fullLessonContext.id,
              type: "item",
              renderMode: "listening_choice",
              mainText: fullLessonContext.title,
              interactiveListening: {
                audioUrl: fullLessonContext.audioUrl || "",
                transcriptSegments: fullLessonContext.transcriptSegments || [],
                learningItems: learningItems,
              },
            };

            return {
              mode: effectiveMode,
              dayIndex: currentDay,
              items: serializeFirestoreData([practiceItem]),
            };
          }

          if (!fullLessonContext.quiz) {
            return {
              mode: effectiveMode,
              dayIndex: currentDay,
              items: [],
              error: "No quiz available for this lesson.",
            };
          }

          const srsMap = new Map<string, SRSData>();
          if (plan.srsMap) {
            Object.entries(plan.srsMap).forEach(([id, state]) => {
              srsMap.set(id, {
                interval: state.interval,
                repetition: state.repetition,
                easeFactor: state.easeFactor,
                dueDate: state.dueDate,
              });
            });
          }

          const quizItems = generateQuizItems(
            fullLessonContext,
            effectiveMode,
            srsMap,
          );

          // console.log(`[getDailyPractice] Generated ${quizItems.length} quiz items`);

          return {
            mode: effectiveMode,
            dayIndex: currentDay,
            items: serializeFirestoreData(quizItems),
          };
        }
      }
      return {
        mode,
        dayIndex: currentDay,
        items: [],
        error: "Lesson content not found.",
      };
    }

    const fetchAndGenerate = async (
      itemIds: {
        id: string;
      }[],
      collectionName: string,
      lessonContext: Lesson,
      practiceMode: any,
      ignoreReviewCheck: boolean = false,
    ) => {
      if (itemIds.length === 0) return;

      const validIds = itemIds.map((i) => i.id);
      const srsMap = new Map<
        string,
        { id: string; srsData?: SRSData; lastReviewedAt?: Date | string }
      >(
        itemIds.map((i) => {
          const fromPlan = plan.srsMap?.[i.id];
          return [
            i.id,
            {
              id: i.id,
              srsData: fromPlan
                ? {
                    interval: fromPlan.interval,
                    repetition: fromPlan.repetition,
                    easeFactor: fromPlan.easeFactor,
                    dueDate: fromPlan.dueDate,
                  }
                : undefined,
              lastReviewedAt: fromPlan?.lastReviewedAt,
            },
          ];
        }),
      );

      const chunks = [];
      for (let i = 0; i < validIds.length; i += 10) {
        chunks.push(validIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        if (chunk.length === 0) continue;
        const snap = await db
          .collection(collectionName)
          .where(FieldPath.documentId(), "in", chunk)
          .get();

        snap.docs.forEach((doc) => {
          try {
            const dbData = { id: doc.id, ...doc.data() } as
              | LearningItem
              | LearningStructure;
            const payload = generatePayload(
              dbData,
              practiceMode,
              lessonContext,
            );

            // Merge SRS Data from Plan
            if (srsMap.has(doc.id)) {
              const planItem = srsMap.get(doc.id);

              // Skip if already reviewed today (prevent farming), unless ignoring check (Active Lesson Catch Up)
              if (
                planItem &&
                isReviewedToday(planItem.lastReviewedAt) &&
                !ignoreReviewCheck
              ) {
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
      const lessonDoc = await db
        .collection("lessons")
        .doc(activeLesson.id)
        .get();
      if (lessonDoc.exists) {
        fullLessonContext = { id: lessonDoc.id, ...lessonDoc.data() } as Lesson;
      }

      if (fullLessonContext) {
        // Pass true to ignoreReviewCheck for active lesson items to allow catch-up multiple sessions per day
        await fetchAndGenerate(
          activeLesson.learningItemsIds || [],
          "learningItems",
          fullLessonContext,
          mode,
          true,
        );

        // Only include structures if the mode is appropriate (Unscramble, Gap Fill, Quiz)
        // We exclude them from Flashcard modes (Day 1 & 4) to avoid the "Structure Practice" placeholder card.
        const structureModes = [
          "sentence_unscramble",
          "gap_fill_listening",
          "quiz_comprehensive",
          "listening_choice",
        ];

        if (structureModes.includes(mode)) {
          await fetchAndGenerate(
            activeLesson.learningStructureIds || [],
            "learningStructures",
            fullLessonContext,
            mode,
            true,
          );
        }
      }
    }

    const activeLessonItemIds = new Set<string>();
    if (activeLesson) {
      activeLesson.learningItemsIds?.forEach((i) =>
        activeLessonItemIds.add(i.id),
      );
      activeLesson.learningStructureIds?.forEach((i) =>
        activeLessonItemIds.add(i.id),
      );
    }

    const dueItems = plan.srsMap
      ? getDueItemsFromSrsMap(plan.srsMap, today, activeLessonItemIds)
      : [];

    if (dueItems.length > 0) {
      const dummyContext = { id: "review", title: "Review" } as Lesson;

      const items = dueItems.filter((d) => d.type === "item");
      const structures = dueItems.filter((d) => d.type === "structure");

      if (items.length > 0) {
        await fetchAndGenerate(
          items,
          "learningItems",
          dummyContext,
          "review_standard",
        );
      }
      if (structures.length > 0) {
        await fetchAndGenerate(
          structures,
          "learningStructures",
          dummyContext,
          "review_standard",
        );
      }
    }

    return {
      mode,
      dayIndex: currentDay,
      items: serializeFirestoreData(itemsToPractice),
    };
  } catch (error) {
    console.error("Error generating daily practice:", error);
    return { mode: "review_standard", dayIndex: 1, items: [] };
  }
}

/**
 * Saves the current session progress to allow resuming later.
 */
export async function saveSessionProgress(
  planId: string,
  state: PracticeSessionState,
) {
  try {
    const sessionRef = db
      .collection("plans")
      .doc(planId)
      .collection("practice_sessions")
      .doc("current");
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
export async function getSessionProgress(
  planId: string,
): Promise<PracticeSessionState | null> {
  try {
    const sessionRef = db
      .collection("plans")
      .doc(planId)
      .collection("practice_sessions")
      .doc("current");
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
    const sessionRef = db
      .collection("plans")
      .doc(planId)
      .collection("practice_sessions")
      .doc("current");
    await sessionRef.delete();
  } catch (error) {
    console.error("Error clearing session progress:", error);
  }
}

/**
 * Processes the results of a practice session (SRS updates).
 */
export async function processPracticeResults(
  planId: string,
  results: PracticeResult[],
  isReplay: boolean = false,
  sessionStreak: number = 0,
) {
  try {
    // If it's a replay session, we don't update SRS, progress, or gamification.
    // We just acknowledge the completion.
    if (isReplay) {
      return { success: true };
    }

    const planRef = db.collection("plans").doc(planId);

    await db.runTransaction(async (t) => {
      const planDoc = await t.get(planRef);
      if (!planDoc.exists) throw new Error("Plan not found");

      const planData = planDoc.data() as Plan;
      if (!planData.studentId) throw new Error("Student ID not found in plan");

      const userRef = db.collection("users").doc(planData.studentId);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const userData = userDoc.data() as User;
      const updates: any = {
        "metadata.updatedAt": FieldValue.serverTimestamp(),
      };

      // --- GAMIFICATION UPDATE ---
      const correctCount = results.filter((r) => r.grade >= 3).length;
      const xpGained = correctCount * 10 + sessionStreak * 2;

      // Initialize gamification if missing
      const currentGamification = userData.gamification || {
        currentXP: 0,
        level: 1,
        streak: { current: 0, best: 0, lastStudyDate: null },
        studyHeatmap: {},
      };

      let newCurrentStreak = currentGamification.streak.current;
      const lastStudyDate = currentGamification.streak.lastStudyDate
        ? (currentGamification.streak.lastStudyDate as any).toDate
          ? (currentGamification.streak.lastStudyDate as any).toDate()
          : new Date(currentGamification.streak.lastStudyDate as any)
        : null;

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

      // Check daily streak logic
      if (lastStudyDate) {
        const lastDateStr = lastStudyDate.toISOString().split("T")[0];
        const diffDays = differenceInCalendarDays(today, lastStudyDate);

        if (diffDays === 1) {
          // Consecutive day
          newCurrentStreak += 1;
        } else if (diffDays > 1) {
          // Broken streak (reset to 1)
          newCurrentStreak = 1;
        }
        // If diffDays === 0 (same day), keep streak as is
      } else {
        // First time
        newCurrentStreak = 1;
      }

      const newBestStreak = Math.max(
        newCurrentStreak,
        currentGamification.streak.best,
      );

      // Update Heatmap
      const newHeatmap = { ...currentGamification.studyHeatmap };
      newHeatmap[todayStr] = (newHeatmap[todayStr] || 0) + 1;

      // Update User Doc
      t.update(userRef, {
        "gamification.currentXP": FieldValue.increment(xpGained),
        "gamification.streak": {
          current: newCurrentStreak,
          best: newBestStreak,
          lastStudyDate: today,
        },
        "gamification.studyHeatmap": newHeatmap,
      });

      const resultsMap = new Map(results.map((r) => [r.itemId, r.grade]));
      const nextSrsMap: Record<string, PlanSRSState> = {
        ...(planData.srsMap || {}),
      };

      resultsMap.forEach((grade, itemId) => {
        const current = nextSrsMap[itemId];
        const currentData: SRSData | undefined = current
          ? {
              interval: current.interval,
              repetition: current.repetition,
              easeFactor: current.easeFactor,
              dueDate: current.dueDate,
            }
          : undefined;

        const next = calculateNextReview(grade as any, currentData);

        const type = results.find((r) => r.itemId === itemId)?.type || "item";

        nextSrsMap[itemId] = {
          ...next,
          type,
          lastReviewedAt: new Date(),
          status: getSRSStatus(next.interval),
        };
      });

      updates.srsMap = nextSrsMap;

      const lessonsSource = updates.lessons || planData.lessons;
      if (lessonsSource && Array.isArray(lessonsSource)) {
        const today = startOfDay(new Date());

        // We need to find the active lesson based on DATE (same logic as getPracticeCycle)
        const validLessons = lessonsSource
          .map((l: any) => ({
            ...l,
            parsedDate: parseLessonDate(l.scheduledDate),
          }))
          .filter((l: any) => l.parsedDate !== null);

        validLessons.sort(
          (a: any, b: any) => b.parsedDate.getTime() - a.parsedDate.getTime(),
        );

        const lastClass = validLessons.find(
          (l: any) => differenceInCalendarDays(today, l.parsedDate) > 0,
        );

        if (lastClass) {
          const lessonIndex = lessonsSource.findIndex(
            (l: any) => l.id === lastClass.id,
          );
          if (lessonIndex !== -1) {
            const currentCompleted =
              lessonsSource[lessonIndex].completedPracticeDays || 0;

            // Only advance if not finished (Max 6 days)
            if (currentCompleted < 6) {
              // Create a new array if we haven't already (if we are modifying planData.lessons directly)
              if (!updates.lessons) {
                updates.lessons = [...lessonsSource];
              }

              // Update the specific lesson
              updates.lessons[lessonIndex] = {
                ...updates.lessons[lessonIndex],
                completedPracticeDays: currentCompleted + 1,
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
    let totalLearned = 0;

    if (plan.srsMap) {
      Object.values(plan.srsMap).forEach((state) => {
        if (state.status === "learned" || state.status === "mastered") {
          totalLearned += 1;
        }

        const dueDate = parseLessonDate(state.dueDate);
        if (dueDate && startOfDay(dueDate) <= today) {
          dueToday += 1;
        }

        if (state.lastReviewedAt) {
          const reviewDate = parseLessonDate(state.lastReviewedAt);
          if (
            reviewDate &&
            startOfDay(reviewDate).getTime() === today.getTime()
          ) {
            reviewedToday += 1;
          }
        }
      });
    }

    // Calculate Current Day & Days Since Class for UI
    let currentDay = 1;
    let daysSinceClass = 0;
    let hasActiveLesson = false;

    if (plan.lessons && Array.isArray(plan.lessons)) {
      const validLessons = plan.lessons
        .map((l) => ({ ...l, parsedDate: parseLessonDate(l.scheduledDate) }))
        .filter((l) => l.parsedDate !== null) as ((typeof plan.lessons)[0] & {
        parsedDate: Date;
      })[];

      validLessons.sort(
        (a, b) => b.parsedDate.getTime() - a.parsedDate.getTime(),
      );

      // Find most recent past class that is NOT fully completed
      const lastClass = validLessons.find(
        (l) =>
          differenceInCalendarDays(today, l.parsedDate) > 0 &&
          (l.completedPracticeDays || 0) < 6,
      );

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
      hasActiveLesson,
    };
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return {
      reviewedToday: 0,
      dueToday: 0,
      totalLearned: 0,
      currentDay: 1,
      daysSinceClass: 0,
      hasActiveLesson: false,
    };
  }
}

/**
 * Retrieves the active plan ID for a student.
 */
export async function getActivePlanId(studentId: string) {
  try {
    const snapshot = await db
      .collection("plans")
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

/**
 * Retrieves the detailed list of learned items for the dashboard modal.
 */
export async function getLearnedItemsDetails(planId: string) {
  try {
    const planRef = db.collection("plans").doc(planId);
    const planDoc = await planRef.get();
    if (!planDoc.exists) throw new Error("Plan not found");

    const plan = planDoc.data() as Plan;
    const learnedItems: Array<{
      id: string;
      title: string;
      type: "item" | "structure";
      learnedAt: Date | string;
      srsData?: SRSData;
    }> = [];

    if (!plan.srsMap) return [];

    const learnedEntries = Object.entries(plan.srsMap).filter(
      ([, state]) => state.status === "learned" || state.status === "mastered",
    );

    if (learnedEntries.length === 0) return [];

    const itemIds = learnedEntries
      .filter(([, v]) => v.type === "item")
      .map(([k]) => k);
    const structIds = learnedEntries
      .filter(([, v]) => v.type === "structure")
      .map(([k]) => k);

    const fetchDetails = async (
      collectionName: string,
      type: "item" | "structure",
      ids: string[],
    ) => {
      const chunks = [];
      for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const snap = await db
          .collection(collectionName)
          .where(FieldPath.documentId(), "in", chunk)
          .get();

        snap.docs.forEach((doc) => {
          const data = doc.data();
          const state = plan.srsMap?.[doc.id];
          if (!state) return;

          let title = "Untitled";
          if (type === "item") {
            title =
              (data as LearningItem).mainText ||
              (data as any).title ||
              "Untitled";
          } else if (type === "structure") {
            const struct = data as LearningStructure;
            title =
              struct.sentences?.[0]?.words ||
              (struct as any).title ||
              `Structure (${struct.type || "Unknown"})`;
          }

          learnedItems.push({
            id: doc.id,
            title: title,
            type: type,
            learnedAt: state.lastReviewedAt || state.dueDate,
            srsData: {
              interval: state.interval,
              repetition: state.repetition,
              easeFactor: state.easeFactor,
              dueDate: state.dueDate,
            },
          });
        });
      }
    };

    await Promise.all([
      fetchDetails("learningItems", "item", itemIds),
      fetchDetails("learningStructures", "structure", structIds),
    ]);

    // Sort by learnedAt (most recent first)
    learnedItems.sort((a, b) => {
      const dateA = parseLessonDate(a.learnedAt)?.getTime() || 0;
      const dateB = parseLessonDate(b.learnedAt)?.getTime() || 0;
      return dateB - dateA;
    });

    return serializeFirestoreData(learnedItems);
  } catch (error) {
    console.error("Error fetching learned items details:", error);
    return [];
  }
}

/**
 * Retrieves the history of completed lessons for a student plan.
 */
export async function getStudentHistory(planId: string) {
  try {
    const planRef = db.collection("plans").doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      throw new Error("Plan not found");
    }

    const plan = planDoc.data() as Plan;

    if (!plan.lessons || !Array.isArray(plan.lessons)) {
      return [];
    }

    // Filter lessons that have at least some progress, or all past lessons?
    // Let's return lessons that have completedPracticeDays > 0, OR are chronologically in the past.
    // Actually, let's just return all lessons that have started (completedPracticeDays > 0)
    // AND sort them by order or date.

    const historyLessons = plan.lessons
      .filter((l) => (l.completedPracticeDays || 0) > 0)
      .map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        completedPracticeDays: l.completedPracticeDays || 0,
        scheduledDate: parseLessonDate(l.scheduledDate),
      }))
      .sort((a, b) => {
        // Sort by order descending (newest first)
        return b.order - a.order;
      });

    return serializeFirestoreData(historyLessons);
  } catch (error) {
    console.error("Error fetching student history:", error);
    return [];
  }
}

/**
 * Retrieves the full details of a student plan (all lessons).
 */
export async function getStudentPlanDetails(planId: string) {
  try {
    const planRef = db.collection("plans").doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      throw new Error("Plan not found");
    }

    const plan = planDoc.data() as Plan;

    // Return the plan with serialized dates
    return serializeFirestoreData(plan);
  } catch (error) {
    console.error("Error fetching plan details:", error);
    return null;
  }
}

/**
 * Retrieves archived or completed plans for a student.
 */
export async function getStudentArchivedPlans(studentId: string) {
  try {
    const plansRef = db.collection("plans");
    const snapshot = await plansRef
      .where("studentId", "==", studentId)
      .where("status", "in", ["completed", "archived"])
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return [];
    }

    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return serializeFirestoreData(plans);
  } catch (error) {
    console.error("Error fetching archived plans:", error);
    return [];
  }
}

/**
 * Purchase a replay session using XP.
 * Cost = 50 + (currentDay - sessionDay) * 10 XP.
 * If lessonId is provided (past lesson), Cost = 50 + (DaysSinceScheduled * 1) XP.
 */
export async function purchaseReplaySession(
  planId: string,
  replayDayIndex: number,
  currentDayIndex: number,
  lessonId?: string,
) {
  try {
    const planRef = db.collection("plans").doc(planId);

    await db.runTransaction(async (t) => {
      const planDoc = await t.get(planRef);
      if (!planDoc.exists) throw new Error("Plan not found");
      const planData = planDoc.data() as Plan;

      if (!planData.studentId) throw new Error("Student not found in plan");

      const userRef = db.collection("users").doc(planData.studentId);
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const userData = userDoc.data() as User;
      const currentXP = userData.gamification?.currentXP || 0;

      // Calculate Cost
      let cost = 0;

      if (lessonId) {
        // Replaying a past lesson
        const lesson = planData.lessons?.find((l) => l.id === lessonId);
        if (lesson && lesson.scheduledDate) {
          const scheduledDate = parseLessonDate(lesson.scheduledDate);
          if (scheduledDate) {
            const today = startOfDay(new Date());
            const daysSince = differenceInCalendarDays(today, scheduledDate);
            cost = 50 + Math.max(0, daysSince) * 1;
          } else {
            cost = 50; // Fallback
          }
        } else {
          cost = 50; // Fallback if no date found
        }
      } else {
        // Replaying current lesson cycle
        const daysDiff = Math.max(0, currentDayIndex - replayDayIndex);
        cost = 50 + daysDiff * 10;
      }

      if (currentXP < cost) {
        throw new Error(
          `Insufficient XP. You need ${cost} XP but have ${currentXP}.`,
        );
      }

      // Deduct XP
      const newXP = currentXP - cost;

      t.update(userRef, {
        "gamification.currentXP": newXP,
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error purchasing replay session:", error);
    throw new Error(error.message || "Failed to purchase replay session");
  }
}

/**
 * Fetches the full student profile including gamification data.
 * Checks session to ensure authorized access.
 */
export async function getStudentProfile(
  studentId: string,
): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  // Allow if user is the student, or has teacher/admin/manager role
  if (
    session.user.id !== studentId &&
    !["teacher", "admin", "manager"].includes(session.user.role as string)
  ) {
    console.error("Unauthorized access to student profile");
    return null;
  }

  try {
    const userDoc = await db.collection("users").doc(studentId).get();
    if (!userDoc.exists) return null;
    return serializeFirestoreData(userDoc.data()) as User;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}
