
import { calculateWritingGrade, calculateOrderingGrade } from '../lib/grading';

function runTests() {
  console.log("Running Grading Tests...\n");

  // Test calculateWritingGrade
  console.log("Testing calculateWritingGrade:");
  
  const writingCases = [
    { input: "running", correct: "running", expected: 5, name: "Exact match" },
    { input: "Running ", correct: "running", expected: 5, name: "Case/Trim insensitive" },
    { input: "runing", correct: "running", expected: 4, name: "Small typo (Levenshtein)" }, // 1 error / 7 length = 0.14 <= 0.2
    { input: "run", correct: "running", expected: 2, name: "Large error" }, // 4 errors / 7 length = 0.57 <= 0.6 -> 2
    { input: "swim", correct: "running", expected: 1, name: "Complete wrong" }
  ];

  let passed = 0;
  let failed = 0;

  writingCases.forEach(test => {
    const result = calculateWritingGrade(test.input, test.correct);
    if (result === test.expected) {
      console.log(`  ✅ ${test.name}: Passed`);
      passed++;
    } else {
      console.error(`  ❌ ${test.name}: Failed (Expected ${test.expected}, Got ${result})`);
      failed++;
    }
  });

  console.log("\nTesting calculateOrderingGrade:");

  const orderingCases = [
    { moves: 5, min: 5, expected: 5, name: "Perfect moves" },
    { moves: 6, min: 5, expected: 4, name: "+1 move" },
    { moves: 8, min: 5, expected: 3, name: "+3 moves" },
    { moves: 12, min: 5, expected: 1, name: "> 2x moves" }, // 12 > 10
    { moves: 10, min: 5, expected: 2, name: "Exact 2x moves" } // 10 <= 10 -> 2
  ];

  orderingCases.forEach(test => {
    const result = calculateOrderingGrade(test.moves, test.min);
    if (result === test.expected) {
      console.log(`  ✅ ${test.name}: Passed`);
      passed++;
    } else {
      console.error(`  ❌ ${test.name}: Failed (Expected ${test.expected}, Got ${result})`);
      failed++;
    }
  });

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
