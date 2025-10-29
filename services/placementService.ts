// services/placementService.ts

import { PlacementTest, PlacementTestResult } from '@/types/testing/placement';

export class PlacementService {
  /**
   * Process placement tests data for client consumption
   * @param tests - Array of raw placement tests
   * @returns Array of processed placement test results
   */
  processPlacementTests(tests: PlacementTest[]): PlacementTestResult[] {
    // Handle empty array case
    if (!tests || tests.length === 0) {
      return [];
    }
    
    return tests.map(test => ({
      date: test.date,
      completed: test.completed,
      totalScore: test.totalScore,
      abilitiesCompleted: test.abilitiesCompleted,
      id: test.id,
      createdAt: test.createdAt instanceof Date ? test.createdAt.getTime() / 1000 : test.createdAt
    }));
  }
}

export const placementService = new PlacementService();