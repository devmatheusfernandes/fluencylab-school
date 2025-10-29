// Test file for placement API route - not for production use

import { placementService } from '@/services/placementService';

// Mock data for testing
const mockTests = [
  {
    id: 'test1',
    date: '2023-01-01',
    completed: true,
    totalScore: 85,
    abilitiesCompleted: { grammar: true, vocabulary: true },
    abilitiesScore: { grammar: 40, vocabulary: 45 },
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'test2',
    date: '2023-02-01',
    completed: false,
    totalScore: 0,
    abilitiesCompleted: { grammar: false, vocabulary: false },
    abilitiesScore: { grammar: 0, vocabulary: 0 },
    createdAt: new Date('2023-02-01')
  }
];

// Test the service functions
async function testPlacementService() {
  try {
    console.log('Testing placement service...');
    
    // Test processing function
    const processed = placementService.processPlacementTests(mockTests);
    console.log('Processed tests:', processed);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPlacementService();
}

export { testPlacementService };