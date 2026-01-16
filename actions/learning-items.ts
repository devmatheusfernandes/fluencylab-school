'use server';

import { adminDb } from "@/lib/firebase/admin";
import { LearningItem } from "@/types/content";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export async function updateLearningItem(id: string, data: Partial<LearningItem>) {
  try {
    const itemRef = adminDb.collection('learningItems').doc(id);
    
    const updates: any = { ...data };
    
    // Remove metadata object if it exists to avoid conflict with dot notation update
    delete updates.metadata;
    
    // Ensure metadata exists or update it
    updates['metadata.updatedAt'] = FieldValue.serverTimestamp();

    // Clean up undefined values to avoid Firestore errors
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    await itemRef.update(updates);
    revalidatePath('/hub/admin/vocabulary');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating learning item:', error);
    return { success: false, error: error.message };
  }
}
