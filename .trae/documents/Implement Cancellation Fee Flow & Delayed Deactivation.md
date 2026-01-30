I will implement the changes to handle contract cancellation with a pending fee as requested.

### 1. Backend: Subscription & Contract Logic
**File:** `services/subscriptionService.ts`
- **Modify `cancelSubscription`**:
  - If a cancellation fee applies:
    - Set subscription status to `canceled` (stops future monthly payments).
    - Generate the cancellation fee payment.
    - **Crucial**: Do NOT deactivate the user or invalidate the contract yet.
  - If NO fee applies:
    - Proceed with immediate full cancellation (invalidate contract + deactivate user).
- **Update `generateCancellationFeePayment`**:
  - Link the fee payment to the **actual subscription ID** (instead of `'cancellation-fee'`) so it appears in the student's payment history.
  - Add a `type: 'cancellation_fee'` field to the payment record for easy identification.
- **Update Payment Processing (`handleProviderPaymentPaid`)**:
  - Add a check: if the paid payment is a `cancellation_fee`, trigger the final deactivation:
    - Call `contractService.cancelContract`.
    - Update user record: `isActive = false`, `deactivatedAt = new Date()`.
- **Update `getPaymentStatus`**:
  - Prioritize showing the cancellation fee if it exists and is unpaid, ensuring it appears as the "current payment" for the frontend.

### 2. Backend: Types & API
**File:** `types/financial/subscription.ts`
- Add `type?: 'monthly' | 'cancellation_fee'` to the `MonthlyPayment` interface.
- Update `PaymentStatus` interface to include `userIsActive`.

**File:** `app/api/student/payment-status/route.ts`
- Return `userIsActive` status in the response so the frontend knows when to redirect.

### 3. Frontend: Payment Management Screen
**File:** `components/student/PaymentManagementClient.tsx`
- **New State Logic**:
  - If `subscriptionStatus === 'canceled'` AND `userIsActive === true`:
    - Hide the standard dashboard.
    - Show a dedicated **"Finalizar Cancelamento"** screen.
    - Display ONLY the cancellation fee amount, PIX QR Code, and status.
- **Redirect Logic**:
  - If `userIsActive === false` (detected after polling/refreshing), redirect the user to the `/goodbye` page.

### 4. New Page: Goodbye
**File:** `app/[locale]/goodbye/page.tsx`
- Create a simple public page (outside the Hub) with a farewell message to serve as the redirect target after final deactivation.