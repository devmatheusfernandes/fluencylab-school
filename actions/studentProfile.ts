"use server";

import { adminDb } from "@/lib/firebase/admin";
import { StudentProfile } from "@/types/students/studentProfile";
import { revalidatePath } from "next/cache";

const COLLECTION_NAME = "student-profiles";

/**
 * Creates a new student profile.
 * Can be loose (no studentId) or associated.
 */
export async function createStudentProfile(data: Omit<StudentProfile, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = adminDb.collection(COLLECTION_NAME).doc();
    
    const profileData: StudentProfile = {
      ...data,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(profileData);

    revalidatePath("/hub/manager/student-profiles");
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating student profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates an existing student profile.
 */
export async function updateStudentProfile(id: string, data: Partial<StudentProfile>) {
  try {
    const docRef = adminDb.collection(COLLECTION_NAME).doc(id);
    
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });

    revalidatePath("/hub/manager/student-profiles");
    revalidatePath(`/hub/manager/student-profiles/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating student profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Associates a profile with a student user.
 */
export async function associateStudentProfile(profileId: string, studentId: string) {
  try {
    const docRef = adminDb.collection(COLLECTION_NAME).doc(profileId);
    
    await docRef.update({
      studentId: studentId,
      updatedAt: new Date(),
    });

    revalidatePath("/hub/manager/student-profiles");
    return { success: true };
  } catch (error: any) {
    console.error("Error associating student profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all student profiles.
 */
export async function getStudentProfiles() {
  try {
    const snapshot = await adminDb.collection(COLLECTION_NAME).orderBy("updatedAt", "desc").get();
    
    const profiles = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as StudentProfile;
    });

    return profiles;
  } catch (error: any) {
    console.error("Error fetching student profiles:", error);
    return [];
  }
}

/**
 * Fetches a single student profile by ID.
 */
export async function getStudentProfileById(id: string) {
  try {
    const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    
    if (!doc.exists) return null;

    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as StudentProfile;
  } catch (error: any) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}

/**
 * Deletes a student profile.
 */
export async function deleteStudentProfile(id: string) {
    try {
        await adminDb.collection(COLLECTION_NAME).doc(id).delete();
        revalidatePath("/hub/manager/student-profiles");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting student profile:", error);
        return { success: false, error: error.message };
    }
}
