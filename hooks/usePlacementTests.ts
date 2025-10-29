// hooks/usePlacementTests.ts

import { useEffect, useState } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { PlacementTestResult } from '@/types/testing/placement';

export const usePlacementTests = () => {
  const { user } = useCurrentUser();
  const [tests, setTests] = useState<PlacementTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when user changes
    setTests([]);
    setIsLoading(true);
    setError(null);

    // If no user, set loading to false and return
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Fetch placement tests from API
    const fetchPlacementTests = async () => {
      try {
        const response = await fetch('/api/student/placement');
        if (!response.ok) {
          throw new Error('Failed to fetch placement tests');
        }
        const data = await response.json();
        // Ensure data is an array
        setTests(Array.isArray(data) ? data : []);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching placement tests:', err);
        // Even in case of error, we set tests to empty array to avoid breaking the UI
        setTests([]);
        setError('Failed to load placement tests');
        setIsLoading(false);
      }
    };

    fetchPlacementTests();
  }, [user]);

  return { tests, isLoading, error };
};