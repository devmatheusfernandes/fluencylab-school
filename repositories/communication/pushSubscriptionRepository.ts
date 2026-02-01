import { adminDb } from '@/lib/firebase/admin';

type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime: number | null;
  createdAt: Date;
};

export class PushSubscriptionRepository {
  private collection = adminDb.collection('push_subscriptions');

  async upsert(userId: string, subscription: StoredSubscription): Promise<void> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    const data = doc.exists ? doc.data()! : { subscriptions: [] as StoredSubscription[] };
    const subscriptions: StoredSubscription[] = data.subscriptions || [];

    const idx = subscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
    if (idx >= 0) {
      subscriptions[idx] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    await docRef.set({ subscriptions }, { merge: true });
  }

  async remove(userId: string, endpoint: string): Promise<void> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const data = doc.data()!;
    const subscriptions: StoredSubscription[] = data.subscriptions || [];
    const filtered = subscriptions.filter((s) => s.endpoint !== endpoint);
    await docRef.set({ subscriptions: filtered }, { merge: true });
  }

  async getForUsers(userIds: string[]): Promise<{ userId: string; subscriptions: StoredSubscription[] }[]> {
    if (userIds.length === 0) return [];
    const refs = userIds.map((id) => this.collection.doc(id));
    const snaps = await adminDb.getAll(...refs);
    return snaps.map((snap, i) => {
      const data = snap.exists ? snap.data()! : { subscriptions: [] };
      return { userId: userIds[i], subscriptions: (data.subscriptions || []) as StoredSubscription[] };
    });
  }
}

export type { StoredSubscription };
