'use server';

import { adminDb as db } from "@/lib/firebase/admin";
import { Transaction } from "firebase-admin/firestore";
import { Plan, PracticeResult, SRSData } from "@/types/plan";
import { calculateNextReview } from "@/lib/srs/algorithm";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfDay, addDays } from "date-fns";

/**
 * Retrieves the daily practice session for a given plan.
 * Combines new items from the active weekly lesson and review items from learned lists.
 */
export async function getDailyPractice(planId: string) {
  try {
    const planRef = db.collection("plans").doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      throw new Error("Plan not found");
    }

    const plan = planDoc.data() as Plan;
    const today = startOfDay(new Date());
    
    // 1. Identify Active Lessons (Scheduled for this week)
    const currentWeekStart = startOfWeek(today);
    const currentWeekEnd = endOfWeek(today);

    const activeLessons = plan.lessons.filter(lesson => {
      if (!lesson.scheduledDate) return false;
      
      const date = typeof lesson.scheduledDate === 'string' 
        ? parseISO(lesson.scheduledDate) 
        : (lesson.scheduledDate as any).toDate ? (lesson.scheduledDate as any).toDate() : new Date(lesson.scheduledDate as any);

      // Handle invalid dates
      if (isNaN(date.getTime())) return false;

      return isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd });
    });

    const newItems: any[] = [];
    
    activeLessons.forEach(lesson => {
      if (lesson.learningItemsIds) {
        newItems.push(...lesson.learningItemsIds.map(item => ({ ...item, type: 'item', source: 'lesson', lessonId: lesson.id })));
      }
      if (lesson.learningStructureIds) {
        newItems.push(...lesson.learningStructureIds.map(item => ({ ...item, type: 'structure', source: 'lesson', lessonId: lesson.id })));
      }
    });

    // 2. Review Items
    const reviewItems: any[] = [];

    const isDue = (item: { srsData?: SRSData }) => {
      if (!item.srsData || !item.srsData.dueDate) return false;
      
      const dueDate = typeof item.srsData.dueDate === 'string'
        ? parseISO(item.srsData.dueDate)
        : (item.srsData.dueDate as any).toDate ? (item.srsData.dueDate as any).toDate() : new Date(item.srsData.dueDate as any);
        
      return startOfDay(dueDate) <= today;
    };

    // Check active review queue
    if (plan.reviewLearnedComponentsIds) {
      reviewItems.push(...plan.reviewLearnedComponentsIds
        .filter(isDue)
        .map(item => ({ ...item, source: 'review_queue' }))
      );
    }

    // Check mastered/learned list (as requested)
    if (plan.learnedComponentsIds) {
      reviewItems.push(...plan.learnedComponentsIds
        .filter(isDue)
        .map(item => ({ ...item, source: 'learned_queue' }))
      );
    }

    return {
      newItems,
      reviewItems
    };

  } catch (error) {
    console.error("Error fetching daily practice:", error);
    throw error;
  }
}

/**
 * Processes the results of a practice session.
 * Updates SRS data and moves items between lists (Lesson -> Learned).
 */
export async function processPracticeResults(planId: string, results: PracticeResult[]) {
  try {
    const planRef = db.collection("plans").doc(planId);
    
    await db.runTransaction(async (transaction: Transaction) => {
      const planDoc = await transaction.get(planRef);
      if (!planDoc.exists) throw new Error("Plan not found");

      const plan = planDoc.data() as Plan;
      let modified = false;
      
      results.forEach(result => {
        const { itemId, grade } = result;
        let found = false;

        // 1. Search in Active Lessons (Learning Phase)
        for (const lesson of plan.lessons) {
           // Check learningItemsIds
           if (lesson.learningItemsIds) {
             const itemIndex = lesson.learningItemsIds.findIndex(i => i.id === itemId);
             if (itemIndex !== -1) {
               const item = lesson.learningItemsIds[itemIndex];
               const newSrs = calculateNextReview(grade, item.srsData);
               
               // Graduation Check: If interval >= 1 day, move to Learned
               if (newSrs.interval >= 1) {
                  // Remove from lesson
                  lesson.learningItemsIds.splice(itemIndex, 1);
                  
                  // Add to learnedComponentsIds
                  if (!plan.learnedComponentsIds) plan.learnedComponentsIds = [];
                  
                  // Ensure distant review date for learned items (min 7 days)
                  if (newSrs.interval < 7) {
                     newSrs.interval = 7;
                     const newDueDate = addDays(new Date(), 7);
                     newDueDate.setHours(0,0,0,0);
                     newSrs.dueDate = newDueDate;
                  }

                  plan.learnedComponentsIds.push({
                    ...item,
                    srsData: newSrs,
                    lastReviewedAt: new Date(),
                    updatedAt: new Date()
                  });
               } else {
                  // Update in place
                  lesson.learningItemsIds[itemIndex] = {
                    ...item,
                    srsData: newSrs,
                    lastReviewedAt: new Date(),
                    updatedAt: new Date()
                  };
               }
               found = true;
               modified = true;
               break; // Found, stop searching this item
             }
           }
           
           // Check learningStructureIds
           if (lesson.learningStructureIds) {
             const structIndex = lesson.learningStructureIds.findIndex(i => i.id === itemId);
             if (structIndex !== -1) {
               const item = lesson.learningStructureIds[structIndex];
               const newSrs = calculateNextReview(grade, item.srsData);
               
               if (newSrs.interval >= 1) {
                  lesson.learningStructureIds.splice(structIndex, 1);
                  if (!plan.learnedComponentsIds) plan.learnedComponentsIds = [];
                  
                  if (newSrs.interval < 7) {
                     newSrs.interval = 7;
                     const newDueDate = addDays(new Date(), 7);
                     newDueDate.setHours(0,0,0,0);
                     newSrs.dueDate = newDueDate;
                  }

                  plan.learnedComponentsIds.push({
                    ...item,
                    srsData: newSrs,
                    lastReviewedAt: new Date(),
                    updatedAt: new Date()
                  });
               } else {
                  lesson.learningStructureIds[structIndex] = {
                    ...item,
                    srsData: newSrs,
                    lastReviewedAt: new Date(),
                    updatedAt: new Date()
                  };
               }
               found = true;
               modified = true;
               break;
             }
           }
        }

        if (found) return;

        // 2. Search in reviewLearnedComponentsIds
        if (plan.reviewLearnedComponentsIds) {
           const index = plan.reviewLearnedComponentsIds.findIndex(i => i.id === itemId);
           if (index !== -1) {
              const item = plan.reviewLearnedComponentsIds[index];
              const newSrs = calculateNextReview(grade, item.srsData);
              plan.reviewLearnedComponentsIds[index] = {
                  ...item,
                  srsData: newSrs,
                  lastReviewedAt: new Date(),
                  updatedAt: new Date()
              };
              found = true;
              modified = true;
              return;
           }
        }

        // 3. Search in learnedComponentsIds
        if (plan.learnedComponentsIds) {
           const index = plan.learnedComponentsIds.findIndex(i => i.id === itemId);
           if (index !== -1) {
              const item = plan.learnedComponentsIds[index];
              const newSrs = calculateNextReview(grade, item.srsData);
              plan.learnedComponentsIds[index] = {
                  ...item,
                  srsData: newSrs,
                  lastReviewedAt: new Date(),
                  updatedAt: new Date()
              };
              found = true;
              modified = true;
              return;
           }
        }
      });

      if (modified) {
        transaction.set(planRef, plan);
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error processing practice results:", error);
    throw error;
  }
}
