
import { LearningItem, Lesson, LearningStructure } from '../types/lesson';
import { getModeForDay, generatePayload } from '../lib/practice-logic';

async function runTests() {
  console.log("Running Daily Practice Logic Tests...\n");

  // Test getModeForDay
  console.log("Testing getModeForDay:");
  const days = [
    { day: 1, expected: 'flashcard_visual' },
    { day: 2, expected: 'gap_fill_listening' },
    { day: 3, expected: 'sentence_unscramble' },
    { day: 4, expected: 'flashcard_recall' },
    { day: 5, expected: 'quiz_comprehensive' },
    { day: 6, expected: 'listening_choice' },
    { day: 7, expected: 'review_standard' }, // Default
    { day: 0, expected: 'review_standard' }
  ];

  let passed = 0;
  let failed = 0;

  days.forEach(d => {
    const res = getModeForDay(d.day);
    if (res === d.expected) {
      // console.log(`  ✅ Day ${d.day}: ${res}`);
      passed++;
    } else {
      console.error(`  ❌ Day ${d.day}: Expected ${d.expected}, Got ${res}`);
      failed++;
    }
  });
  console.log(`  Passed ${passed}/${days.length} checks.`);

  // Test generatePayload
  console.log("\nTesting generatePayload (Day 2 - Gap Fill with Smart Context):");
  
  const mockItem: LearningItem = {
    id: 'item-1',
    mainText: 'apple',
    meanings: [{ translation: 'maçã', definition: 'fruit', example: 'I eat an apple', exampleTranslation: 'Eu como uma maçã', context: 'food' }],
    slug: 'apple',
    language: 'en',
    level: 'A1',
    type: 'noun',
    metadata: { createdAt: new Date(), updatedAt: new Date() }
  };

  const mockLesson: Lesson = {
    id: 'lesson-1',
    title: 'Fruits',
    language: 'en',
    content: '',
    status: 'ready',
    relatedLearningItemIds: ['item-1'],
    relatedLearningStructureIds: [],
    learningItensQueue: [],
    learningStructuresQueue: [],
    metadata: { createdAt: new Date(), updatedAt: new Date() },
    audioUrl: 'http://audio.com/file.mp3',
    transcriptSegments: [
      { start: 0, end: 2, text: "Hello everyone." },
      { start: 2, end: 3, text: "I like to eat an apple.", learningItemIds: ['item-1'] }, // Short segment (1s)
      { start: 3, end: 5, text: "It is very healthy." }
    ]
  };

  const payload = generatePayload(mockItem, 'gap_fill_listening', mockLesson);
  
  if (payload.renderMode === 'gap_fill_listening' && payload.gapFill) {
      console.log("  ✅ Mode is correct");
      
      // Check Smart Context (Expansion)
      // The middle segment is 2->3 (1s). It should grab prev (0->2) and next (3->5).
      // New start should be 0, new end should be 5.
      if (payload.gapFill.audioSegment?.start === 0 && payload.gapFill.audioSegment?.end === 5) {
          console.log("  ✅ Smart Context: Expanded window correctly (0s to 5s)");
          passed++;
      } else {
          console.error(`  ❌ Smart Context Failed: Got ${payload.gapFill.audioSegment?.start}-${payload.gapFill.audioSegment?.end}, Expected 0-5`);
          failed++;
      }

      // Check Gap Creation
      if (payload.gapFill.sentenceWithGap.includes('___')) {
           console.log("  ✅ Gap created in text");
           passed++;
      } else {
           console.error("  ❌ Gap creation failed");
           failed++;
      }

  } else {
      console.error("  ❌ Wrong payload type or fallback triggered incorrectly");
      failed++;
  }

  // Test Unscramble
  console.log("\nTesting generatePayload (Day 3 - Unscramble):");
  const mockStructure: LearningStructure = {
      id: 'struct-1',
      language: 'en',
      level: 'A1',
      type: 's-v-o',
      sentences: [{
          words: 'I love apples',
          order: [
              { word: 'I', order: 0, role: 'subject' },
              { word: 'love', order: 1, role: 'verb' },
              { word: 'apples', order: 2, role: 'object' }
          ]
      }],
      metadata: { createdAt: new Date(), updatedAt: new Date() }
  };

  const payloadUnscramble = generatePayload(mockStructure, 'sentence_unscramble', mockLesson);
  
  if (payloadUnscramble.renderMode === 'sentence_unscramble' && payloadUnscramble.unscramble) {
      console.log("  ✅ Mode is correct");
      if (payloadUnscramble.unscramble.correctOrder.join(' ') === 'I love apples') {
          console.log("  ✅ Correct order preserved");
          passed++;
      } else {
          console.error("  ❌ Correct order mismatch");
          failed++;
      }
      if (payloadUnscramble.unscramble.scrambledWords.length === 3) {
           console.log("  ✅ Scrambled words present");
           passed++;
      }
  } else {
      console.error("  ❌ Wrong payload type for unscramble");
      failed++;
  }

  console.log(`\nFinal Result: ${failed === 0 ? 'ALL PASSED' : 'SOME FAILED'}`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => console.error(e));
