I will implement the new "Listening Choice" flow as requested, transforming it from a simple quiz into an interactive two-phase listening exercise.

### Plan

1.  **Update Type Definitions** (`types/practice.ts`)
    *   Add a new `interactiveListening` property to the `PracticeItem` interface.
    *   This will hold the `audioUrl`, `transcriptSegments`, and a list of `learningItems` needed for the exercise.

2.  **Update Backend Logic** (`actions/srs-actions.ts`)
    *   Modify `getDailyPractice` to handle `listening_choice` differently.
    *   Instead of generating multiple quiz items, it will now fetch the active Lesson's details (audio, transcript, and related learning items).
    *   It will return a **single** `PracticeItem` containing all this data, enabling the "continuous flow" experience.

3.  **Create New Component** (`components/practice/ListeningChoiceExercise.tsx`)
    *   **Phase 1 (Full Listen)**: Plays the complete audio once. The user must finish listening to proceed.
    *   **Phase 2 (Interactive)**:
        *   Plays audio segment by segment.
        *   Displays the transcript text.
        *   **Gap Logic**: Analyzes each segment's text to find matching `LearningItems`. If found, replaces the word with a gap.
        *   **Interaction**: Shows 3 options (correct word + 2 distractors from other items).
        *   **Progression**: User answers -> Feedback -> Next segment.

4.  **Integrate into Session** (`components/practice/PracticeSession.tsx`)
    *   Update the render logic to use `ListeningChoiceExercise` when the mode is `listening_choice` and the new data structure is present.
    *   Handle the completion of the entire exercise (calculating a grade based on correct answers).

### Verification
*   I will verify that the new type definitions compile.
*   I will ensure the backend logic correctly fetches and bundles the lesson data.
*   The new component will be integrated seamlessly into the existing practice session flow.
