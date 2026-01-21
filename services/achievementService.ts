// services/achievementService.ts

import { AchievementRepository } from "@/repositories/achievementRepository";
import { classRepository } from "@/repositories";
import { StudentAchievement } from "@/types/users/achievements";
import { ClassStatus } from "@/types/classes/class";
import { achievementDefinitions } from "@/config/achievementDefinitions";

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

  /**
   * Evaluate achievements based on student activity and sync to storage
   * Returns the up-to-date achievements list
   */
  async evaluateAndSyncStudentAchievements(studentId: string): Promise<StudentAchievement[]> {
    try {
      const existing = await this.achievementRepository.getStudentAchievements(studentId);

      const classes = await classRepository.findAllClassesByStudentId(studentId);
      const completedClassesCount = classes.filter(
        (c) => c.status === ClassStatus.COMPLETED || !!c.completedAt
      ).length;


      const stats = {
        completedClassesCount
      };

      const byId = new Map(existing.map((a) => [a.achievementId, a]));

      const updatedList: StudentAchievement[] = achievementDefinitions.map((def) => {
        const current = byId.get(def.id) || { achievementId: def.id, unlocked: false };
        const shouldUnlock = !!def.criteria(stats);

        const result: StudentAchievement = {
          achievementId: def.id,
          unlocked: shouldUnlock || current.unlocked,
          unlockedAt:
            shouldUnlock && !current.unlocked
              ? Date.now()
              : current.unlockedAt,
          progress: current.progress,
          progressMax: current.progressMax,
          language: current.language,
        };

        if (def.id === "primeira_aula_concluida") {
          result.progress = completedClassesCount;
          result.progressMax = 1;
        }
        if (def.id === "cinco_aulas_concluidas") {
          result.progress = completedClassesCount;
          result.progressMax = 5;
        }
        if (def.id === "dez_aulas_concluidas") {
          result.progress = completedClassesCount;
          result.progressMax = 10;
        }

        return result;
      });

      await this.achievementRepository.updateStudentAchievements(studentId, updatedList);
      return updatedList;
    } catch (error) {
      console.error("Error evaluating/syncing achievements:", error);
      throw new Error("Failed to evaluate achievements.");
    }
  }
}

export const achievementService = new AchievementService();
