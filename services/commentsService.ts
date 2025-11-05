import { commentsRepository, CommentRecord, ReplyRecord } from '@/repositories/commentsRepository';

export const commentsService = {
  async list(docId: string): Promise<Record<string, CommentRecord>> {
    return commentsRepository.listByDocId(docId);
  },

  async upsert(docId: string, id: string, text: string): Promise<CommentRecord> {
    const now = Date.now();
    const existing = await commentsRepository.get(docId, id);
    const payload: Partial<CommentRecord> = {
      text,
      createdAt: existing?.createdAt ?? now,
      updatedAt: existing ? now : undefined,
    };
    await commentsRepository.upsert(docId, id, payload);
    return (await commentsRepository.get(docId, id)) as CommentRecord;
  },

  async delete(docId: string, id: string): Promise<void> {
    await commentsRepository.delete(docId, id);
  },

  async addReply(docId: string, id: string, text: string): Promise<CommentRecord> {
    const now = Date.now();
    const existing = await commentsRepository.get(docId, id);
    const replies = existing?.replies || [];
    const reply: ReplyRecord = {
      id: `reply-${now}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      createdAt: now,
    };
    replies.push(reply);
    await commentsRepository.upsert(docId, id, {
      replies,
      updatedAt: now,
    });
    return (await commentsRepository.get(docId, id)) as CommentRecord;
  },
};