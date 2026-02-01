import { ReviewGrade, SRSData } from "@/types/financial/plan";

/**
 * Calculates the next review schedule using a simplified SM-2 algorithm.
 * 
 * @param currentData Current SRS data (or undefined if new)
 * @param grade The grade given by the user (0-5)
 * @returns Updated SRS data
 */
export function calculateNextReview(
  grade: ReviewGrade,
  currentData?: SRSData
): SRSData {
  // Defaults for new cards
  let interval = 0;
  let repetition = 0;
  let easeFactor = 2.5;

  if (currentData) {
    interval = currentData.interval;
    repetition = currentData.repetition;
    easeFactor = currentData.easeFactor;
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
    // Incorrect response
    repetition = 0;
    interval = 1;
  }

  // Update Ease Factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // q = grade
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  // Set to start of the day to normalize
  dueDate.setHours(0, 0, 0, 0);

  return {
    interval,
    repetition,
    easeFactor,
    dueDate,
  };
}
