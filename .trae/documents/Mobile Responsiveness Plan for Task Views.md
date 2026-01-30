I will implement mobile responsiveness improvements for the Task Board, specifically targeting the Kanban and Week views as requested.

### 1. Update `TaskCard` & `DraggableTaskCard`
- Add support for "movement actions" (Up/Down for Kanban, Left/Right for Week).
- Render directional arrow buttons on the card when these actions are available.
- Ensure these buttons are touch-friendly and don't interfere with the main card click.

### 2. Update `TaskKanbanView`
- **Mobile Detection**: Use `useIsMobile` to detect mobile state.
- **Vertical Layout**: Switch from horizontal columns to a vertical stack on mobile (`flex-col`).
- **Mobile Actions**:
  - Implement `moveTaskStatus(taskId, direction)` logic.
  - Pass "Up" (previous status) and "Down" (next status) actions to the cards.
  - Status order: `todo` ↔ `in-progress` ↔ `review` ↔ `done`.

### 3. Update `TaskWeekView`
- **Responsive Columns**:
  - Desktop: Show full 7 days.
  - Mobile: Show only 2 days at a time to avoid horizontal scrolling.
- **View Navigation**:
  - Add "Previous Days" and "Next Days" buttons on mobile to navigate the week.
- **Mobile Actions**:
  - Implement `moveTaskDate(taskId, direction)` logic.
  - Pass "Left" (previous day) and "Right" (next day) actions to the cards.

### 4. Update `TaskList`
- Verify grid responsiveness (already uses `grid-cols-1` on mobile, which is appropriate).
