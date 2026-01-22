I will implement the backend and frontend logic to connect the practice session to the database and support saving/resuming progress.

### 1. Define Data Structure for Session State
I will create a new interface `PracticeSessionState` in `types/practice.ts` to define what we save:
- `planId`: string
- `currentDay`: number
- `currentIndex`: number
- `results`: Array of results so far
- `items`: Array of `PracticeItem` (optional, to avoid re-fetching if we want strict consistency, but re-fetching `getDailyPractice` is usually fine if we just store the index. However, storing items guarantees the same session if the day changes while playing. I will store `items`.)
- `lastUpdated`: Date

### 2. Create Server Actions (`actions/srs-actions.ts`)
I will add the following actions:
- `saveSessionProgress(planId: string, state: PracticeSessionState)`: Saves the state to a subcollection `plans/{planId}/practice_sessions/current`.
- `getSessionProgress(planId: string)`: Retrieves the saved state.
- `clearSessionProgress(planId: string)`: Deletes the saved state.
- Update `getDailyPractice`: No changes needed to the logic itself, but I will use it in the component if no saved session exists.

### 3. Update Frontend Components
- **`PracticeSession.tsx`**:
    - Remove `MOCK_SESSION`.
    - Add `planId` prop.
    - Use `useEffect` to load data:
        1. Call `getSessionProgress(planId)`.
        2. If exists, load it (set `currentIndex`, `results`, `items`).
        3. If not, call `getDailyPractice(planId)`, then call `saveSessionProgress` to initialize.
    - On every `handleComplete`:
        - Update local state.
        - Call `saveSessionProgress` with the new index and results.
    - On finish:
        - Call `processPracticeResults` (existing).
        - Call `clearSessionProgress`.
        - Show summary.

- **`MyPracticePage.tsx`**:
    - Fetch the active plan using `planRepository.findActivePlanByStudent(sessionUser.id)`.
    - Pass `plan.id` to `PracticeSession`.
    - Handle case where no active plan exists (redirect or show message).

### 4. Verification
- I will verify by running the app and checking if progress persists after a refresh.
