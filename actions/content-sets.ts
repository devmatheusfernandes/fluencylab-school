'use server';

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ContentSet } from '@/types/content';
import { revalidatePath } from 'next/cache';

export async function createContentSet(data: {
  title: string;
  description?: string;
  language: string;
  level: string;
  itemIds: string[];
}) {
  try {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newSetRef = adminDb.collection('contentSets').doc();
    
    const newSet: Omit<ContentSet, 'id'> = {
      title: data.title,
      description: data.description || '',
      slug,
      language: data.language,
      level: data.level as any,
      itemIds: data.itemIds,
      itemsCount: data.itemIds.length,
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    };

    await newSetRef.set(newSet);
    revalidatePath('/hub/admin/content-sets');
    
    return { success: true, id: newSetRef.id };
  } catch (error) {
    console.error('Error creating content set:', error);
    return { success: false, error };
  }
}

export async function updateContentSet(id: string, data: Partial<ContentSet>) {
  try {
    const setRef = adminDb.collection('contentSets').doc(id);
    
    // Se estiver atualizando itemIds, recalcular count
    const updates: any = { ...data };
    if (data.itemIds) {
      updates.itemsCount = data.itemIds.length;
    }
    updates['metadata.updatedAt'] = FieldValue.serverTimestamp();

    await setRef.update(updates);
    revalidatePath('/hub/admin/content-sets');

    return { success: true };
  } catch (error) {
    console.error('Error updating content set:', error);
    return { success: false, error };
  }
}

export async function deleteContentSet(id: string) {
  try {
    await adminDb.collection('contentSets').doc(id).delete();
    revalidatePath('/hub/admin/content-sets');
    return { success: true };
  } catch (error) {
    console.error('Error deleting content set:', error);
    return { success: false, error };
  }
}
