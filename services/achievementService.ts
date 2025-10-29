// services/achievementService.ts

import { AchievementRepository } from "@/repositories/achievementRepository";
import { StudentAchievement } from "@/types/users/achievements";

/**
 * Service to handle achievements data operations
 */
export class AchievementService {
  private achievementRepository: AchievementRepository;

  constructor() {
    this.achievementRepository = new AchievementRepository();
  }

  /**
   * Get a student's achievements
   * @param studentId - The student's ID
   * @returns Array of student achievements
   */
  async getStudentAchievements(studentId: string): Promise<StudentAchievement[]> {
    try {
      return await this.achievementRepository.getStudentAchievements(studentId);
    } catch (error) {
      console.error("Error fetching student achievements:", error);
      throw new Error("Failed to fetch achievements.");
    }
  }

  /**
   * Update a student's achievements
   * @param studentId - The student's ID
   * @param achievements - Array of achievements to update
   */
  async updateStudentAchievements(
    studentId: string,
    achievements: StudentAchievement[]
  ): Promise<void> {
    try {
      await this.achievementRepository.updateStudentAchievements(studentId, achievements);
    } catch (error) {
      console.error("Error updating student achievements:", error);
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
      await this.achievementRepository.addStudentAchievement(studentId, achievement);
    } catch (error) {
      console.error("Error adding student achievement:", error);
      throw new Error("Failed to add achievement.");
    }
  }
}

export const achievementService = new AchievementService();
