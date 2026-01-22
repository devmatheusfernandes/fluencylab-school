I will refactor the practice system to implement the 6-Day Learning Cycle (Scaffolding) as requested.

### 1. Type Definitions
I will create `types/practice.ts` to define the new structures:
- `PracticeMode`: Enum for the 6 days + review mode.
- `PracticeItem`: A discriminated union or interface with optional fields for `flashcard`, `gapFill`, `unscramble`, etc., controlled by `renderMode`.
- `DailyPracticeSession`: The return type containing `sessionMode`, `dayIndex`, and the list of items.

### 2. Backend Logic (Refactor `getDailyPractice`)
I will modify `actions/srs-actions.ts` (or `actions/daily-practice.ts` if you prefer a new file, but refactoring the existing unused one is cleaner):
- **Active Lesson Detection**: Find the lesson scheduled for the current week.
- **Day Calculation**: Calculate `dayIndex` (1-6) based on `differenceInCalendarDays(scheduledDate, today)`.
- **Mode Selection**: Map `dayIndex` to the specific `PracticeMode` (e.g., Day 2 = `gap_fill_listening`).
- **Data Fetching**: The current `Plan` object only has IDs. I will fetch the full `LearningItem` and `LearningStructure` documents from Firestore to get text, audio, and sentence data.
- **Smart Context Window**:
  - For Listening modes, I will search `lesson.transcriptSegments`.
  - If a segment is too short (< 3s or just a few words), I will merge it with adjacent segments to provide better context.
  - Fallback to `flashcard_visual` if no audio context is found.
- **Mixed State Handling**:
  - **New Items**: Follow the calculated `sessionMode`.
  - **Review Items**: Force `renderMode: 'review_standard'` regardless of the day.

### 3. Grading Utilities
I will create `lib/grading.ts` (or `utils/grading.ts`) to implement:
- `calculateWritingGrade`: Uses Levenshtein distance for text comparison (Day 2).
- `calculateOrderingGrade`: Evaluates move efficiency for unscramble tasks (Day 3).

### 4. Verification
- I will verify the logic by creating a test script or mocking a plan with a scheduled date to ensure the correct mode and items are returned.
