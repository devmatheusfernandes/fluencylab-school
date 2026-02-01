// Lazy-load Firebase Admin to avoid hard failure when env is missing in development.
// Falls back to an in-memory store if Firebase Admin cannot be initialized.

export type ReplyRecord = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
};

export type CommentRecord = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  replies?: ReplyRecord[];
};

const rootCollection = 'editorDocuments';

// Firestore document data does not store the 'id' field; it comes from the doc id.
// Use a type that omits 'id' to avoid duplicate properties when spreading.
export type FirestoreCommentRecord = Omit<CommentRecord, 'id'>;

export const commentsRepository = {
  // Internal: lazy admin firestore instance
  _adminDbCached: undefined as any | null | undefined,
  _getAdminDb: async function () {
    if (this._adminDbCached !== undefined) return this._adminDbCached;
    try {
      const mod = await import('@/lib/firebase/admin');
      this._adminDbCached = (mod as any).adminDb;
      return this._adminDbCached;
    } catch (e) {
      console.warn('[commentsRepository] Firebase Admin indisponível, usando store em memória.', e);
      this._adminDbCached = null;
      return null;
    }
  },

  // Internal: simple in-memory store for development fallback
  _mem: new Map<string, Map<string, FirestoreCommentRecord>>(),

  async listByDocId(docId: string): Promise<Record<string, CommentRecord>> {
    const adminDb = await this._getAdminDb();
    if (adminDb) {
      const snapshot = await adminDb
        .collection(rootCollection)
        .doc(docId)
        .collection('comments')
        .get();

      const result: Record<string, CommentRecord> = {};
      snapshot.forEach((doc: any) => {
        const data = doc.data() as FirestoreCommentRecord;
        result[doc.id] = { id: doc.id, ...data };
      });
      return result;
    }

    const bucket = this._mem.get(docId) || new Map<string, FirestoreCommentRecord>();
    this._mem.set(docId, bucket);
    const obj: Record<string, CommentRecord> = {};
    for (const [cid, data] of bucket.entries()) {
      obj[cid] = { id: cid, ...data };
    }
    return obj;
  },

  async get(docId: string, id: string): Promise<CommentRecord | null> {
    const adminDb = await this._getAdminDb();
    if (adminDb) {
      const ref = adminDb
        .collection(rootCollection)
        .doc(docId)
        .collection('comments')
        .doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = snap.data() as FirestoreCommentRecord;
      return { id, ...data };
    }

    const bucket = this._mem.get(docId);
    const data = bucket?.get(id);
    return data ? { id, ...data } : null;
  },

  async upsert(docId: string, id: string, data: Partial<FirestoreCommentRecord>): Promise<void> {
    const adminDb = await this._getAdminDb();
    if (adminDb) {
      // Firestore não aceita campos com valor undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      ) as Partial<FirestoreCommentRecord>;
      const ref = adminDb
        .collection(rootCollection)
        .doc(docId)
        .collection('comments')
        .doc(id);
      await ref.set(cleanData, { merge: true });
      return;
    }

    const bucket = this._mem.get(docId) || new Map<string, FirestoreCommentRecord>();
    const existing = bucket.get(id) || ({} as FirestoreCommentRecord);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ) as Partial<FirestoreCommentRecord>;
    const next = { ...existing, ...cleanData } as FirestoreCommentRecord;
    bucket.set(id, next);
    this._mem.set(docId, bucket);
  },

  async delete(docId: string, id: string): Promise<void> {
    const adminDb = await this._getAdminDb();
    if (adminDb) {
      const ref = adminDb
        .collection(rootCollection)
        .doc(docId)
        .collection('comments')
        .doc(id);
      await ref.delete();
      return;
    }

    const bucket = this._mem.get(docId);
    bucket?.delete(id);
  },
};