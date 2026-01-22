I will implement the requested changes to associate `TranscriptSegments` and `Quiz` with `LearningItems` and `LearningStructures`.

### Plan

1. **Update Type Definitions**

   * **File:** `types/lesson.ts`

     * Add `learningItemIds` and `learningStructureIds` (string arrays) to the `TranscriptSegment` interface.

     * Add `relatedLearningItemId` and `relatedLearningStructureId` (strings) to the `QuizQuestion` interface.

2. **Update Lesson Processing Logic**

   * **File:** `actions/lesson-processing.ts`

   * All the Learningitens and Learningstructures generated before should be related after with the transcription and quiz, this way we garantee that the componentes (itens and structures) are all associated with trasncripts and quizes

     * **Implement** **`linkTranscriptToItems(lessonId)`**: A new function that scans the lesson's transcript segments and checks if any text matches the `mainText` of related `LearningItems` or the example sentences of `LearningStructures`. If a match is found, it saves the IDs in the segment.

     * **Update** **`processLessonBatch`**: Call `linkTranscriptToItems` automatically when the batch processing of vocabulary/structures is complete.

     * **Update** **`generateLessonTranscript`**: Call `linkTranscriptToItems` at the end of the generation process so that newly generated transcripts are immediately linked.

     * **Update** **`generateLessonQuiz`**:

       * Fetch the `LearningItems` and `LearningStructures` associated with the lesson.

       * Inject these items into the Gemini AI prompt as "Priority Context".

       * Instruct the AI to generate questions specifically about these items and to return the `relatedLearningItemId` or `relatedLearningStructureId` in the JSON response.

       * The quiz part related to the comprehension, context and  timestamps (associated with the transcriptions) shoudl also be generated focusing on the timestamps that have the leaningitems and learninstructure field

       * When I analyze again (to look for new learnigingitens or structures again, this all should happen too)

### User Interaction

* **No UI changes** are required for the student view at this moment, as the focus is on the data structure and generation logic. The new fields will be available for future features (e.g., clickable transcript words or quiz analytics).

* The `LessonQuizEditor` will preserve the new fields if present, even without explicit input fields for them.

