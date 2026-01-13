import { userRepository, flashcardRepository } from '@/repositories';
import { SRSData, Flashcard } from '@/types/srs';
import { User } from '@/types/users/users';

export class PracticeService {
  
  /**
   * Updates the user's gamification stats (XP, level, streak, heatmap)
   */
  async updateGamificationStats(
    userId: string, 
    stats: NonNullable<User['gamification']>
  ): Promise<void> {
    // We update the whole object for simplicity. 
    // In a high-concurrency environment, we might want atomic increments for XP.
    // But since this is a single user session, updating the object is fine.
    
    await userRepository.update(userId, {
      gamification: stats
    });
  }

  /**
   * Saves the result of a card review.
   */
  async saveCardReview(userId: string, cardId: string, srsData: SRSData): Promise<void> {
    // We only need to update the srsData and lastReviewedAt
    // But since the repository takes a full Flashcard object (or partial),
    // let's adjust the repository or just pass the ID and data.
    // The repository `updateCard` expects a Flashcard object with ID.
    
    // Construct a partial update object disguised as Flashcard for the repo
    // (Ideally we should improve the repo signature, but this works given the repo implementation)
    const updatePayload = {
      id: cardId,
      srsData,
      lastReviewedAt: new Date()
    } as Flashcard;

    await flashcardRepository.updateCard(userId, updatePayload);
  }

  /**
   * Fetches cards due for review or new cards.
   */
  async getSessionCards(userId: string): Promise<Flashcard[]> {
    return await flashcardRepository.getDueCards(userId);
  }

  /**
   * Fetches specific cards by ID to check their SRS progress.
   */
  async getCardsProgress(userId: string, cardIds: string[]): Promise<Flashcard[]> {
    return await flashcardRepository.getCardsByIds(userId, cardIds);
  }

  /**
   * Fetches a summary of all user's card progress (cardId -> repetition/interval)
   */
  async getUserProgressSummary(userId: string): Promise<Record<string, { repetition: number, interval: number, lastReviewedAt?: Date | string }>> {
    return await flashcardRepository.getUserProgressSummary(userId);
  }

  /**
   * Creates a new flashcard for the user.
   */
  async createCard(userId: string, front: string, back: string, category?: string): Promise<string> {
    return await flashcardRepository.createCard(userId, {
      front,
      back,
      category,
      // Initial state is undefined srsData, meaning "New"
    });
  }
}

export const practiceService = new PracticeService();
