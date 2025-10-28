// types/testing/placement.ts

export interface PlacementTest {
  id: string;
  date: string;
  completed: boolean;
  totalScore: number;
  abilitiesCompleted: Record<string, boolean>;
  abilitiesScore: Record<string, number>;
  createdAt: Date;
}

export interface PlacementTestResult {
  date: string;
  completed: boolean;
  totalScore: number;
  abilitiesCompleted: Record<string, boolean>;
  id: string;
  createdAt: number;
}