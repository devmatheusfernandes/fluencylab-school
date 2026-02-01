// repositories/placementRepository.ts

import { db } from "@/lib/firebase/config";
import { adminDb } from "@/lib/firebase/admin";
import { PlacementTest } from "@/types/testing/placement";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // Client-side imports

export class PlacementRepository {
  /**
   * Get all placement tests for a specific user
   * @param userId - The ID of the user
   * @returns Array of placement tests sorted by creation date (newest first)
   */
  async getPlacementTestsByUserId(userId: string): Promise<PlacementTest[]> {
    try {
      // Use admin SDK for server-side operations
      const placementRef = adminDb
        .collection("users")
        .doc(userId)
        .collection("Placement");
      const snapshot = await placementRef.orderBy("createdAt", "desc").get();

      // Handle case when user has no placement tests
      if (snapshot.empty) {
        return [];
      }

      const result = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          date: data.date || "",
          completed: data.completed || false,
          totalScore: data.totalScore || 0,
          abilitiesCompleted: data.abilitiesCompleted || {},
          abilitiesScore: data.abilitiesScore || {},
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        } as PlacementTest;
      });

      return result;
    } catch (error: any) {
      console.error("Error fetching placement tests:", error);
      // Return empty array when there's an error instead of throwing
      // This handles cases where the collection doesn't exist
      return [];
    }
  }

  /**
   * Subscribe to placement tests updates for a specific user
   * @param userId - The ID of the user
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToPlacementTests(
    userId: string,
    callback: (tests: PlacementTest[]) => void
  ) {
    try {
      // Use client SDK for browser subscriptions
      const placementRef = collection(db, "users", userId, "Placement");
      const q = query(placementRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Handle case when user has no placement tests
          if (snapshot.empty) {
            callback([]);
            return;
          }

          const tests = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              date: data.date || "",
              completed: data.completed || false,
              totalScore: data.totalScore || 0,
              abilitiesCompleted: data.abilitiesCompleted || {},
              abilitiesScore: data.abilitiesScore || {},
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(),
            } as PlacementTest;
          });
          callback(tests);
        },
        (error) => {
          console.error("Error subscribing to placement tests:", error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up placement tests subscription:", error);
      return () => {}; // Return noop unsubscribe function
    }
  }
}
