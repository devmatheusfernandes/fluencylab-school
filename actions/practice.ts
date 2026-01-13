'use server';

import { practiceService } from '@/services/practiceService';
import { User } from '@/types/users/users';
import { Flashcard, SRSData } from '@/types/srs';
import { requireAuth } from '@/lib/auth';

export async function syncGamificationStats(stats: NonNullable<User['gamification']>) {
  try {
    const user = await requireAuth();
    await practiceService.updateGamificationStats(user.id, stats);
    return { success: true };
  } catch (error) {
    console.error("Failed to sync gamification stats:", error);
    return { success: false, error: "Failed to sync stats" };
  }
}

export async function saveCardReview(cardId: string, srsData: SRSData) {
  try {
    const user = await requireAuth();
    await practiceService.saveCardReview(user.id, cardId, srsData);
    return { success: true };
  } catch (error) {
    console.error("Failed to save card review:", error);
    return { success: false, error: "Failed to save review" };
  }
}

export async function getSessionCards(): Promise<{ success: boolean, cards?: Flashcard[], error?: string }> {
  try {
    const user = await requireAuth();
    const cards = await practiceService.getSessionCards(user.id);
    
    // Serializing dates for client
    const serializedCards = cards.map(card => ({
      ...card,
      createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt, 
      updatedAt: card.updatedAt instanceof Date ? card.updatedAt.toISOString() : card.updatedAt,
      lastReviewedAt: card.lastReviewedAt instanceof Date ? card.lastReviewedAt.toISOString() : card.lastReviewedAt,
      srsData: card.srsData ? {
        ...card.srsData,
        dueDate: card.srsData.dueDate instanceof Date ? card.srsData.dueDate.toISOString() : card.srsData.dueDate
      } : undefined
    }));
    
    // We need to return plain objects (serialized)
    return { success: true, cards: JSON.parse(JSON.stringify(serializedCards)) };
  } catch (error) {
    console.error("Failed to fetch session cards:", error);
    return { success: false, error: "Failed to fetch cards" };
  }
}

export async function getDeckProgress(cardIds: string[]): Promise<{ success: boolean, cards?: Flashcard[], error?: string }> {
  try {
    const user = await requireAuth();
    const cards = await practiceService.getCardsProgress(user.id, cardIds);
    
    // Serializing dates for client
    const serializedCards = cards.map(card => ({
      ...card,
      createdAt: card.createdAt instanceof Date ? card.createdAt.toISOString() : card.createdAt, 
      updatedAt: card.updatedAt instanceof Date ? card.updatedAt.toISOString() : card.updatedAt,
      lastReviewedAt: card.lastReviewedAt instanceof Date ? card.lastReviewedAt.toISOString() : card.lastReviewedAt,
      srsData: card.srsData ? {
        ...card.srsData,
        dueDate: card.srsData.dueDate instanceof Date ? card.srsData.dueDate.toISOString() : card.srsData.dueDate
      } : undefined
    }));
    
    return { success: true, cards: JSON.parse(JSON.stringify(serializedCards)) };
  } catch (error) {
    console.error("Failed to fetch deck progress:", error);
    return { success: false, error: "Failed to fetch deck progress" };
  }
}

export async function getUserLearningStats(): Promise<{ success: boolean, progressMap?: Record<string, { repetition: number, interval: number, lastReviewedAt?: Date | string }>, error?: string }> {
  try {
    const user = await requireAuth();
    const progressMap = await practiceService.getUserProgressSummary(user.id);
    
    // Serialize dates in progressMap
    const serializedMap: Record<string, { repetition: number, interval: number, lastReviewedAt?: string }> = {};
    Object.entries(progressMap).forEach(([key, value]) => {
      serializedMap[key] = {
        ...value,
        lastReviewedAt: value.lastReviewedAt instanceof Date ? value.lastReviewedAt.toISOString() : (value.lastReviewedAt as string)
      };
    });

    return { success: true, progressMap: serializedMap };
  } catch (error) {
    console.error("Failed to fetch learning stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
