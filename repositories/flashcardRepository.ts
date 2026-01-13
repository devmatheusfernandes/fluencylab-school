import { adminDb } from '@/lib/firebase/admin';
import { Flashcard } from '@/types/srs';
import { Timestamp, FieldPath } from 'firebase-admin/firestore';

export class FlashcardRepository {
  private getUserFlashcardsCollection(userId: string) {
    return adminDb.collection('users').doc(userId).collection('flashcards');
  }

  private mapDocToFlashcard(doc: FirebaseFirestore.DocumentSnapshot): Flashcard {
    const data = doc.data();
    if (!data) throw new Error("Document data is undefined");

    return {
      id: doc.id,
      ...data,
      front: data.front,
      back: data.back,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      lastReviewedAt: data.lastReviewedAt instanceof Timestamp ? data.lastReviewedAt.toDate() : data.lastReviewedAt,
      srsData: data.srsData ? {
        ...data.srsData,
        dueDate: data.srsData.dueDate instanceof Timestamp ? data.srsData.dueDate.toDate() : data.srsData.dueDate
      } : undefined
    } as unknown as Flashcard;
  }

  async getDueCards(userId: string, limit: number = 20): Promise<Flashcard[]> {
    const now = new Date();
    const collection = this.getUserFlashcardsCollection(userId);
    
    // 1. Due cards
    const dueQuery = await collection
      .where('srsData.dueDate', '<=', now)
      .limit(limit)
      .get();

    const dueCards = dueQuery.docs.map(doc => this.mapDocToFlashcard(doc));

    // 2. New cards (Simple fallback: fetch recent cards without srsData)
    // Note: This is simplified. In prod, use a 'status' field.
    if (dueCards.length < limit) {
       // Ideally fetch more, but keeping it simple for now to avoid complex compound queries
    }

    return dueCards;
  }

  async getAllCards(userId: string): Promise<Flashcard[]> {
    const snapshot = await this.getUserFlashcardsCollection(userId).get();
    return snapshot.docs.map(doc => this.mapDocToFlashcard(doc));
  }

  async updateCard(userId: string, card: Flashcard): Promise<void> {
    const { id, ...data } = card;
    // Use set with merge to allow upserting (creating if not exists)
    // This is crucial for Deck cards which are virtual until practiced
    await this.getUserFlashcardsCollection(userId).doc(id).set({
      ...data,
      updatedAt: new Date()
    }, { merge: true });
  }

  async getCardsByIds(userId: string, ids: string[]): Promise<Flashcard[]> {
    if (ids.length === 0) return [];
    
    // Firestore 'in' query is limited to 30 items. 
    // For now, we'll fetch in batches or use getAll if list is too long?
    // Actually, simpler approach for now: fetch all if many, or fetch individually.
    // Let's implement a batch fetch for robustness.
    
    const chunks = [];
    for (let i = 0; i < ids.length; i += 30) {
      chunks.push(ids.slice(i, i + 30));
    }

    const results: Flashcard[] = [];
    const collection = this.getUserFlashcardsCollection(userId);

    for (const chunk of chunks) {
      const snapshot = await collection.where(FieldPath.documentId(), 'in', chunk).get();
      results.push(...snapshot.docs.map(doc => this.mapDocToFlashcard(doc)));
    }

    return results;
  }

  async getUserProgressSummary(userId: string): Promise<Record<string, { repetition: number, interval: number, lastReviewedAt?: Date | string }>> {
    const snapshot = await this.getUserFlashcardsCollection(userId)
      .select('srsData', 'lastReviewedAt') // Projection: fetch srsData and lastReviewedAt
      .get();
    
    const progressMap: Record<string, { repetition: number, interval: number, lastReviewedAt?: Date | string }> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.srsData) {
        progressMap[doc.id] = {
          repetition: data.srsData.repetition,
          interval: data.srsData.interval,
          lastReviewedAt: data.lastReviewedAt instanceof Timestamp ? data.lastReviewedAt.toDate() : data.lastReviewedAt,
        };
      }
    });

    return progressMap;
  }

  async createCard(userId: string, card: Omit<Flashcard, 'id'>): Promise<string> {
    const docRef = await this.getUserFlashcardsCollection(userId).add({
      ...card,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }
}

export const flashcardRepository = new FlashcardRepository();
