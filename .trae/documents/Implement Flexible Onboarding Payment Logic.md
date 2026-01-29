I will implement the requested changes, ensuring the **Contract Start Date** is defined by the Admin and strictly followed by the system.

### 1. Admin: Define Class/Contract Start Date (`AddUserModal.tsx`)

* **Add Date Picker**: Include "Data de Início das Aulas" in the creation modal. Actually, the Adm only chooses the month here, the date is always defined as the first day of the selected month.

* **Backend Sync**: Save this date as the user's `contractStartDate`.

### 2. Onboarding: Enforce Start Date & Payment Logic (`PaymentStep.tsx`)

* **Fixed Start Date**: The system will use the Admin-defined `contractStartDate` instead of the current date.

* **Contract Selection**: Display "Data de Início: \[DD/MM/YYYY]" so the student is aware.

* **Payment Dates**: Restrict billing day selection to **1, 5, 10, 12**.

* **"Late Entrant" Logic**:

  * If `contractStartDate` is in the **current month** (and user is joining "late"):

  * **Option A (Pro-rated)**:

    * Calculates amount for remaining days.

    * First payment due immediately (or end of month).

    * Future payments align with selected billing day.

  * **Option B (Full + Credits)**:

    * Pay full month.

    * First payment due immediately (or end of month).

    * Future payments align with selected billing day.

    * System automatically adds `LATE_STUDENTS` credits.

  * If `contractStartDate` is **future**:

    * First payment and contract start on that future date.

* Update the

### 3. Backend: Subscription Engine (`subscriptionService.ts`)

* **Contract Validity**: Update `createSubscription` to respect the passed `contractStartDate`.

* **Flexible First Payment**: Support `initialPaymentAmount` (for pro-rating).

* **Auto-Credits**: Implement logic to inject credits if "Full Payment" is selected for a late start.

This approach satisfies your requirement: the contract validity and start date are controlled by the Admin (`classStartDate`), while giving the student flexibility on how to handle the first partial month.
