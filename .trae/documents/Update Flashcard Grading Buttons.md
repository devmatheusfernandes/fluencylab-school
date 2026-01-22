I will update the `FlashcardExercise` component to include the full range of grading options defined in your SRS system (`types/plan.ts`). This will give users more precise control over their review feedback.

### **Plan: Implement Full SRS Grading Options**

1.  **Update `FlashcardExercise.tsx`**
    *   **Expand Interface:** Update `FlashcardExerciseProps` to accept grades `1 | 3 | 4 | 5` in the `onResult` callback.
    *   **Add Buttons:** Replace the current 2-button layout (Hard/Easy) with a 4-button layout:
        *   **Again (Fail)** -> Grade `1` (Color: Rose/Red)
        *   **Hard** -> Grade `3` (Color: Amber/Orange)
        *   **Good** -> Grade `4` (Color: Blue/Indigo)
        *   **Easy** -> Grade `5` (Color: Emerald/Green)
    *   **Style Update:** Arrange buttons in a responsive grid or flex row to fit comfortably on the screen.

2.  **Verify `PracticeSession.tsx`**
    *   The existing logic `handleComplete(grade >= 3, grade)` already supports this change correctly (grades 3, 4, 5 will be marked as "Correct", grade 1 as "Incorrect"), so no changes are needed here, but I will verify the integration after the update.

This change ensures that when a user finds a card "Hard" (Grade 3), it is recorded as a **success** (interval increases slightly) rather than a **failure** (interval reset), which matches the standard behavior of SRS algorithms like Anki.
