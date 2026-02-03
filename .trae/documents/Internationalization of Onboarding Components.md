# Internationalization of Onboarding Components

This plan outlines the steps to implement `next-intl` in the onboarding flow for both Students and Teachers.

## 1. Update Translation Files
- Update `messages/pt.json` and `messages/en.json` to include the `Onboarding` namespace with all necessary keys for Student and Teacher steps.
- Ensure all hardcoded strings identified in the analysis are covered.

## 2. Refactor Student Onboarding Components
- **`OnboardingModal.tsx`**: Replace hardcoded steps titles and button texts with `useTranslations`.
- **`WelcomeStep.tsx`**: Translate welcome message and description.
- **`BasicInfoStep.tsx`**: Translate labels, placeholders, and error messages.
- **`BestPracticesStep.tsx`**: Translate rules and titles.
- **`ContractSelectionStep.tsx`**: Translate plan names, badges, and benefits.
- **`ContractReviewStep.tsx`**: Translate form labels, validation messages, and success states.
- **`PaymentStep.tsx`**: Translate payment method details and instructions.
- **`FinishStep.tsx`**: Translate success message and support link.

## 3. Refactor Teacher Onboarding Components
- **`TeacherOnboardingModal.tsx`**: Replace hardcoded steps titles, button texts, and inline components (`TeacherWelcomeStep`, `TeacherFinishStep`) with translations.
- **`TeacherBasicInfoStep.tsx`**: Translate profile configuration labels and helpers.
- **`BankingInfoStep.tsx`**: Translate banking form fields and options.
- **`ScheduleSelectionStep.tsx`**: Translate schedule management interface and validation messages.
- **`TeacherContractStep.tsx`**: Translate contract signing form and status messages.

## 4. Verification
- Verify that all texts are correctly replaced and no hardcoded strings remain in the UI.
- Ensure that the logic remains unchanged.
