I will implement the backend logic for the SRS feature, incorporating your specific requirements for `learnedComponentsIds` and lesson scheduling.

### 1. New File: `actions/srs-actions.ts`

-   **`getDailyPractice(planId: string)`**
    -   **Active Lesson Detection:**
        -   It will iterate through `plan.lessons` and select the lesson(s) relevant for the current week based on `scheduledDate` (using `date-fns` to compare with the current week).
    -   **Item Collection:**
        1.  **New Items:** From the Active Lesson's `learningItemsIds` and `learningStructureIds`.
        2.  **Active Review Items:** From `reviewLearnedComponentsIds` where `dueDate <= today`.
        3.  **Mastered Review Items:** From `learnedComponentsIds` where `dueDate <= today`. (Implementing your request to include this list in checks).
    -   **Output:** A unified list of practice items.

-   **`processPracticeResults(planId: string, results: PracticeResult[])`**
    -   **Logic:**
        1.  Fetch the `Plan`.
        2.  For each result, locate the item (in Lesson, `reviewLearnedComponentsIds`, or `learnedComponentsIds`).
        3.  **Update SRS:** Calculate new data using `calculateNextReview`.
        4.  **State Transitions:**
            -   **From Lesson to Learned:**
                -   If an item in a Lesson is marked as "learned" (e.g., `interval >= 1` day or specific grade criteria):
                -   Move it to `learnedComponentsIds`.
                -   **Constraint:** Ensure the initial `dueDate` in `learnedComponentsIds` is set to a more distant future (e.g., +7 or +14 days) to reflect it's "learned", unless the algorithm already provides a sufficient interval.
            -   **Existing Reviews:**
                -   Update `srsData` in place for items already in `learnedComponentsIds` or `reviewLearnedComponentsIds`.
        5.  Save changes to Firestore.

### 2. Update Types
-   Ensure `types/srs.ts` has the necessary `PracticeResult` definition.

### 3. Validation
-   I will verify that items correctly migrate from the Lesson to `learnedComponentsIds` with the appropriate future date.
-   I will verify that the "Active Lesson" is correctly identified based on the `scheduledDate`.
