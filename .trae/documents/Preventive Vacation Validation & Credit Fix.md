I will implement a preventive validation system for class generation and ensure the credit refund logic is correct.

### 1. Preventive Validation (Class Generation)

I will modify `SchedulingService` and the generation API to support conflict detection and resolution strategies.

* **New Method:** **`checkTemplateConflicts`**:

  * Before generating classes, this method will simulate the schedule and check against the `vacationRepository`.

  * It will return a list of conflicts (Date, Teacher, Student).

* **Update** **`generateClassesFromTemplate`**:

  * Add optional parameters: `strategy` ('skip\_and\_extend' | 'substitute' | 'default') and `substituteTeacherId`.

  * **Logic for 'skip\_and\_extend'**:

    * When a conflict is found, skip the class creation.

    * Track the number of skipped classes.

    * Extend the generation loop beyond the contract end date to append the missed classes (ensuring the student gets the full number of contracted classes).

    * Send an email to the student explaining the schedule adjustment.

  * **Logic for 'substitute'**:

    * When a conflict is found, use the `substituteTeacherId` for those specific dates.&#x20;

    * If no substitute is provided, fall back to skipping or error.

* **Update API Endpoint (`/api/classes/generate-classes`)**:

  * Accept `action` ('check' | 'generate'), `strategy`, and `substituteTeacherId`.

  * If `action === 'check'`, return the list of conflicts.

  * If `action === 'generate'`, execute the chosen strategy.

### 2. Credit Refund on Vacation

I have analyzed the `createTeacherVacation` logic and confirmed that it does **not** explicitly grant credits in the backend code (unlike `cancelClassByTeacher`). The issue likely stems from:

1. The `TEACHER_VACATION` status being misinterpreted by the frontend or reporting as a "credit" (available class).
2. Or a confusion with the `cancelClassByTeacher` flow.

To address this:

* I will add a safeguard in `SchedulingService` to ensure no credits are granted during vacation creation.

* I will verify `TeacherVacationEmail` to ensure it doesn't communicate incorrect credit information.

* By implementing the **Preventive Validation** (Step 1), we avoid generating these classes in the first place, effectively solving the "credit" confusion since the classes will be skipped/extended rather than cancelled.

### 3. Implementation Steps

1. Modify `services/learning/schedulingService.ts` to add `checkTemplateConflicts` and update `generateClassesFromTemplate`.
2. Update `app/api/classes/generate-classes/route.ts` to handle the new parameters.
3. Add the `Skip and Extend` logic to the generation loop.
4. Verify `TeacherVacationEmail` content.

