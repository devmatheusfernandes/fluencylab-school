I will implement a "Copy on Learn, Filter on Practice" strategy to ensure items are marked as learned without breaking the daily lesson cycle.

**The Logic:**

1. **Definition of "Learned":** An item is considered learned when its SRS interval becomes **≥ 1 day**. This means the student has successfully recalled it, and it has "graduated" from the immediate learning phase.
2. **Review Frequency:** After an item is learned, the review schedule is managed automatically by the **SM-2 Algorithm** (already implemented). The interval starts at 1 day, then 6 days, and increases exponentially based on performance.
3. **Move vs. Copy:**

   * We will **COPY** the item to `learnedComponentsIds` when it is learned. This ensures the "Total Learned" statistic updates immediately.

   * We will **KEEP** the item in the `activeLesson` as well. This is critical because the 6-day lesson cycle (Vocabulary, Sentences, Quiz, etc.) relies on these items being present in the lesson. If we moved them out immediately, the subsequent days of the lesson cycle would be empty.
4. **Preventing Duplication:** To avoid reviewing the same item twice (once as "Lesson Content" and once as "Review"), we will update `getDailyPractice` to **ignore** items from the `learned` list if they are currently part of the Active Lesson.

**Implementation Steps:**

1. **Update** **`processPracticeResults`** **(`actions/srs-actions.ts`):**

   * Add logic to detect items/structures with `newSRS.interval >= 1`.

   * Append these items to `learnedComponentsIds` (ensuring no duplicates).
2. **Update** **`getDailyPractice`** **(`actions/srs-actions.ts`):**

   * Collect all IDs present in the current `activeLesson`.

   * When fetching "Review Items" from `learnedComponentsIds`, filter out any ID that exists in the `activeLesson`.

