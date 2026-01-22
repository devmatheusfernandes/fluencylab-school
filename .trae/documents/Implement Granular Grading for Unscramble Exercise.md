I will implement the movement tracking and SRS integration as requested.

### 1. Track User Moves in `UnscrambleExercise.tsx`
- **State**: Add a `movesCount` state to track user interactions.
- **Tracking**: Increment `movesCount` every time a word is moved (`handleWordClick`).
- **Callback**: Update the `onComplete` prop to pass `movesMade` back to the parent component.

### 2. Integrate with SRS in `PracticeSession.tsx`
- **Logic**: Update the `UnscrambleExercise` handler to receive `movesMade`.
- **Grading**:
  - If **Correct**: Use `calculateOrderingGrade(movesMade, minMoves)` to assign a grade (5, 4, or 3) based on efficiency.
  - If **Incorrect**: Maintain grade 1.
- **Result**: This ensures students who struggle (many moves) get a lower passing grade than those who solve it perfectly, improving SRS scheduling accuracy.