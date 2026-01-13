import { adminDb } from '@/lib/firebase/admin';
import { Deck, CreateDeckInput, UpdateDeckInput } from '@/types/deck';
import { Timestamp } from 'firebase-admin/firestore';

export class DeckRepository {
  private getCollection() {
    return adminDb.collection('decks');
  }

  private mapDocToDeck(doc: FirebaseFirestore.DocumentSnapshot): Deck {
    const data = doc.data();
    if (!data) throw new Error("Document data is undefined");

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as Deck;
  }

  async create(userId: string, deckData: CreateDeckInput): Promise<string> {
    const now = new Date();
    const docRef = await this.getCollection().add({
      ...deckData,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  async update(deckId: string, updates: UpdateDeckInput): Promise<void> {
    await this.getCollection().doc(deckId).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  async delete(deckId: string): Promise<void> {
    await this.getCollection().doc(deckId).delete();
  }

  async findById(deckId: string): Promise<Deck | null> {
    const doc = await this.getCollection().doc(deckId).get();
    if (!doc.exists) return null;
    return this.mapDocToDeck(doc);
  }

  async findAll(): Promise<Deck[]> {
    const snapshot = await this.getCollection().orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map(doc => this.mapDocToDeck(doc));
  }

  async findByCreator(userId: string): Promise<Deck[]> {
    const snapshot = await this.getCollection()
      .where('createdBy', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();
    return snapshot.docs.map(doc => this.mapDocToDeck(doc));
  }
}

export const deckRepository = new DeckRepository();
