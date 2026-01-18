I will modify `actions/lesson-processing.ts` to ensure the lesson status is updated to `'reviewing'` immediately when the last batch of items is processed.

**Changes:**

*   In `processLessonBatch`, within the **Vocabulary Processing** block (`if (vocabQueue.length > 0)`):
    *   Check if `remainingItems.length === 0` AND `structQueue.length === 0`.
    *   If true, include `status: 'reviewing'` in the `batch.update` call.
*   In the **Structure Processing** block (`else`):
    *   Check if `remainingItems.length === 0` (Vocabulary is already empty to reach this block).
    *   If true, include `status: 'reviewing'` in the `batch.update` call.
*   Update the return value `completed` to be `true` if the total remaining items are 0, so the frontend receives the "Processamento finalizado!" message correctly.

This guarantees that the "reviewing" status is applied as soon as the queue becomes empty, without requiring an extra click.
