I will implement the study reminders using a **Client-Side** approach as requested (no Cron Job).

### 1. Data Structure & API
- **File:** `types/users/users.ts`
- **Action:** Add `studyReminders` to the `User` type to store the daily schedule (e.g., `{ monday: "14:00" }`).
- **File:** `app/api/settings/route.ts`
- **Action:** Update the validation schema to allow saving these reminders.

### 2. User Interface
- **File:** `components/settings/SettingsForm.tsx`
- **Action:** Add the "Lembretes de Estudo" card.
    - Users can select a time for each day of the week.
    - Uses `next-intl` for translations.
- **File:** `messages/pt.json` & `messages/en.json`
- **Action:** Add translation keys.

### 3. Client-Side Notification Logic (The "No-Cron" Solution)
- **File:** `components/features/StudyReminderManager.tsx` (New Component)
- **Action:** Create a background component that:
    - Requests Browser Notification permissions.
    - Checks the time every minute.
    - Triggers a system notification (`new Notification(...)`) if the current time matches the user's schedule.
    - **Limitation:** This only works while the application tab is open (or minimized in some browsers), which fits the "no-cron" constraint.

### 4. Integration
- **File:** `app/[locale]/hub/layout.tsx`
- **Action:** Mount the `<StudyReminderManager />` so it runs automatically whenever the user is logged in.
