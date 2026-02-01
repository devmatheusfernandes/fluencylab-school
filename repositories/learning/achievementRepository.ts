// repositories/achievementRepository.ts

import { achievementDefinitions } from "@/config/achievementDefinitions";
import { adminDb } from "@/lib/firebase/admin";
import { StudentAchievement } from "@/types/users/achievements";
import admin from "firebase-admin";

const ACHIEVEMENTS_COLLECTION = "student_achievements";

export class AchievementRepository {
  /**
   * Get a student's achievements from Firestore
   * @param studentId - The student's ID
   * @returns Array of student achievements
   */
  async getStudentAchievements(
    studentId: string
  ): Promise<StudentAchievement[]> {
    try {
      const docRef = adminDb.collection(ACHIEVEMENTS_COLLECTION).doc(studentId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const data = docSnap.data();
        return data?.achievementsList || [];
      } else {
        // Initialize achievements for new students
        const initialAchievements: StudentAchievement[] =
          achievementDefinitions.map((def) => ({
            achievementId: def.id,
            unlocked: false,
          }));

        // Save the initial achievements to Firestore
        await docRef.set({ achievementsList: initialAchievements });

        return initialAchievements;
      }
    } catch (error) {
      console.error("Error fetching student achievements:", error);
      throw new Error("Failed to fetch achievements.");
    }
  }

  /**
   * Update a student's achievements in Firestore
   * @param studentId - The student's ID
   * @param achievements - Array of achievements to update
   */
  async updateStudentAchievements(
    studentId: string,
    achievements: StudentAchievement[]
  ): Promise<void> {
    try {
      const docRef = adminDb.collection(ACHIEVEMENTS_COLLECTION).doc(studentId);

      // Sanitize achievements data
      const sanitizedAchievements = achievements.map((achievement) => {
        const sanitized: any = {
          achievementId: achievement.achievementId,
          unlocked: achievement.unlocked,
        };

        if (
          achievement.unlockedAt !== undefined &&
          achievement.unlockedAt !== null
        ) {
          sanitized.unlockedAt = achievement.unlockedAt;
        }

        if (
          achievement.language !== undefined &&
          achievement.language !== null
        ) {
          sanitized.language = achievement.language;
        }

        if (achievement.progress !== undefined) {
          sanitized.progress = achievement.progress;
        }

        if (achievement.progressMax !== undefined) {
          sanitized.progressMax = achievement.progressMax;
        }

        return sanitized;
      });

      await docRef.set(
        { achievementsList: sanitizedAchievements },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating student achievements in Firestore:", error);
      throw new Error("Failed to update achievements.");
    }
  }

  /**
   * Add a new achievement for a student
   * @param studentId - The student's ID
   * @param achievement - The achievement to add
   */
  async addStudentAchievement(
    studentId: string,
    achievement: StudentAchievement
  ): Promise<void> {
    try {
      const docRef = adminDb.collection(ACHIEVEMENTS_COLLECTION).doc(studentId);

      // Sanitize achievement data
      const sanitizedAchievement: any = {
        achievementId: achievement.achievementId,
        unlocked: achievement.unlocked,
      };

      if (
        achievement.unlockedAt !== undefined &&
        achievement.unlockedAt !== null
      ) {
        sanitizedAchievement.unlockedAt = achievement.unlockedAt;
      }

      if (achievement.language !== undefined && achievement.language !== null) {
        sanitizedAchievement.language = achievement.language;
      }

      if (achievement.progress !== undefined) {
        sanitizedAchievement.progress = achievement.progress;
      }

      if (achievement.progressMax !== undefined) {
        sanitizedAchievement.progressMax = achievement.progressMax;
      }

      await docRef.update({
        achievementsList:
          admin.firestore.FieldValue.arrayUnion(sanitizedAchievement),
      });
    } catch (error) {
      console.error("Error adding student achievement:", error);
      throw new Error("Failed to add achievement.");
    }
  }
}
