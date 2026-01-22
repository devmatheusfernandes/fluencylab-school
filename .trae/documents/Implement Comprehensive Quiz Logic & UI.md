I will implement the comprehensive Quiz Logic and UI updates as requested, ensuring explanations are shown in the FeedbackSheet.

### 1. Type Definitions
- **`types/practice.ts`**: 
  - Update `PracticeItem` to include `explanation` and `sectionType` in the `quiz` object.
  - Update `DailyPracticeSession` to include `error?: string`.

### 2. Backend Logic
- **`lib/practice-logic.ts`**: 
  - Create `generateQuizItems` helper to map all `lesson.quiz` questions to `PracticeItem`s, linking SRS data where `relatedLearningItemId` matches.
- **`actions/srs-actions.ts`**: 
  - Update `getDailyPractice` to use `generateQuizItems` for `quiz_comprehensive` and `listening_choice` modes.
  - Return an error state if the quiz is missing in the lesson.

### 3. Frontend Components
- **`components/practice/FeedbackSheet.tsx`**: 
  - Add `explanation` prop and render it below the result/correct answer.
- **`components/practice/QuizExercise.tsx`** (New File): 
  - Create the UI component for multiple-choice questions.
- **`components/practice/PracticeSession.tsx`**: 
  - Update state to track and pass `explanation` to `FeedbackSheet`.
  - Render `QuizExercise` for quiz modes.
  - Display an error message if `getDailyPractice` returns an error.

### 4. Testing
- **`app/[locale]/test-quiz/page.tsx`**: 
  - Create a test page to verify the Quiz UI and logic with a sample or real plan ID.
