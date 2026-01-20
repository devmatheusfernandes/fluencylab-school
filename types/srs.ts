
export interface SRSData {
  interval: number; // Days until next review
  repetition: number; // Consecutive successful reviews
  easeFactor: number; // Difficulty multiplier (starts at 2.5)
  dueDate: Date | string; // Next review date
}

export interface Flashcard {
  id: string;
  front: string; // HTML or Text
  back: string; // HTML or Text
  srsData?: SRSData; // Optional, initializes if missing
  category?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastReviewedAt?: Date | string;
}

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5; 
// 0-2: Fail (Again)
// 3: Hard
// 4: Good
// 5: Easy

export interface PracticeResult {
  itemId: string;
  grade: ReviewGrade;
  type: 'item' | 'structure';
}
