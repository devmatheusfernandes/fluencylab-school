"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function updateLessonStep(lessonId: string, step: number) {
  try {
    await adminDb.collection("lessons").doc(lessonId).update({
      creationStep: step,
      "metadata.updatedAt": FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating lesson step:", error);
    return { success: false, error: String(error) };
  }
}
