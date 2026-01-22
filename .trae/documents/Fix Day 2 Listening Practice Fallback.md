I will modify `lib/practice-logic.ts` to improve the `gap_fill_listening` generation logic.

Currently, the code only attempts to find a matching audio segment for a learning item by checking if the item's ID is explicitly listed in `transcriptSegments`. If this link is missing (which seems to be the case for the user), it falls back to a flashcard.

I will add a fallback mechanism that, if the ID lookup fails, searches for the item's text within the transcript segments using a case-insensitive regex match. This will ensure that if the word exists in the audio transcript, the listening exercise is correctly generated instead of reverting to a flashcard.

**Steps:**

1. Edit `lib/practice-logic.ts`.
2. In `generatePayload`, inside the `gap_fill_listening` case:

   * Change `const segmentIndex` to `let segmentIndex`.

   * Add a condition: if `segmentIndex` is `-1` (not found) and the item is a `LearningItem`, search the `transcriptSegments` for the `mainText` of the item.
3. This change will apply to Day 2 practice sessions, restoring the intended behavior.

