I will implement the functionality to view and edit the generated quiz.

### 1. Backend: Server Action
- **Update `actions/content-processing.ts`**:
    - Add `updateQuiz(contentId: string, quiz: Quiz)` function.
    - This function will validate the input using `quizSchema` and update the `quiz` field in the Firestore document.

### 2. Frontend: Quiz Editor Page
- **Create Route**: `app/[locale]/hub/admin/contents/[contentId]/quiz/page.tsx`
    - This server component will fetch the content by ID.
    - It will pass the content data to the client-side `QuizEditor` component.
- **Create Component**: `components/admin/QuizEditor.tsx`
    - A modern, responsive client component to edit the quiz.
    - **Features**:
        - **Tabbed Interface/Accordion**: To organize sections (Vocabulary, Grammar, etc.) cleanly on mobile.
        - **Form Management**: Use `react-hook-form` and `zod` to manage the state of questions and options.
        - **Edit Mode**: Allow editing question text, options, explanation, and selecting the correct answer.
        - **Validation**: Ensure the quiz structure remains valid.
        - **Save**: Call `updateQuiz` to persist changes.
    - **UI Library**: Use Shadcn UI components (`Card`, `Input`, `Button`, `Tabs` or `Accordion`, `Badge`) for a polished look.

### 3. Integration: ContentProcessor
- **Update `components/admin/ContentProcessor.tsx`**:
    - Modify the "Quiz: X questions" display.
    - Wrap it in a `Tooltip` that says "Click to View/Edit".
    - Make it a `Link` pointing to `/hub/admin/contents/${content.id}/quiz`.
    - Add a hover effect (underline or color change) to indicate interactivity as requested ("hover... abra uma opcao").

### 4. Verification
- **Test**: Navigate to the new page, edit a question, save, and verify the changes are persisted.
