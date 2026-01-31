I will implement the same **local persistence** mechanism for the student onboarding (`OnboardingModal.tsx`).

### **Implementation Steps:**

1.  **Modify `OnboardingModal.tsx`**:
    *   Define a unique storage key: `fluencylab_student_onboarding_draft`.
    *   **Auto-Save**: Add a `useEffect` that saves `data` and `currentStep` to `localStorage` whenever they change (with debounce).
    *   **Auto-Load**: Add logic to restore the saved state when the component mounts.
    *   **Cleanup**: Clear the `localStorage` data in `handleCompleteOnboarding` after a successful submission.

This ensures students can also resume their onboarding process if interrupted.
