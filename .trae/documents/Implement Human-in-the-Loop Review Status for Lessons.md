I will implement the "Human-in-the-Loop" review process by adding a `reviewing` status to the lesson workflow.

Here is the plan:

1. **Update** **`types/lesson.ts`**:

   * Add `'reviewing'` to the `Lesson['status']` union type: `status: "draft" | "analyzing" | "processing_items" | "reviewing" | "ready" | "error";`.

2. **Update** **`actions/lesson-processing.ts`**:

   1. Verify the logic that sets the status
   2. Modify `processLessonBatch` to set the status to `'reviewing'` instead of `'ready'` when the queues are empty (`vocabQueue.length === 0 && structQueue.length === 0`).

3. **Update** **`actions/lesson-updating.ts`**:

   * Create a new server action `approveLesson(lessonId: string)` that updates the lesson status to `'ready'`.

4. **Update** **`components/lessons/LessonOperations.tsx`**:

   * Update `getStatusColor` to handle the `'reviewing'` status (e.g., orange/yellow color).

   * Add a new section or button group for the review process.

   * Implement an "Approve Lesson" button that calls `approveLesson`. This button will only be visible/enabled when the status is `'reviewing'`.

5. **Update** **`app/[locale]/hub/material-manager/lessons/page.tsx`**:

   * Update the status badge logic to include a color/label for `'reviewing'` (e.g., `bg-yellow-100 text-yellow-800`).

This ensures that after AI processing, the lesson pauses at "Reviewing" state, requiring manual approval before becoming "Ready", giving the user confidence in the content quality.
