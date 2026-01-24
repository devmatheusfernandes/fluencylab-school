"use server";

import { adminDb } from "@/lib/firebase/admin";
import { StudentProfile } from "@/types/students/studentProfile";
import { revalidatePath } from "next/cache";

export async function createStudentProfile(data: StudentProfile) {
  try {
    // 1. Save to users/{userId}/studentProfile/main
    const profileRef = adminDb
      .collection("users")
      .doc(data.userId)
      .collection("studentProfile")
      .doc("main");

    const profileData = {
      ...data,
      updatedAt: new Date(),
      createdAt: data.createdAt || new Date(),
    };

    await profileRef.set(profileData, { merge: true });

    // 2. Update User doc for shared fields (Phone, Address)
    // We use dot notation for nested fields like address.city
    const userUpdateData: any = {};
    if (data.phoneNumber) userUpdateData.phoneNumber = data.phoneNumber;
    
    // Check if address fields are present to update
    if (data.city || data.state) {
        // We need to be careful not to overwrite the whole address object if it exists
        // But dot notation "address.city" works for updates in Firestore
        if (data.city) userUpdateData["address.city"] = data.city;
        if (data.state) userUpdateData["address.state"] = data.state;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await adminDb.collection("users").doc(data.userId).update(userUpdateData);
    }

    revalidatePath("/hub/manager");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating student profile:", error);
    return { success: false, error: error.message };
  }
}
