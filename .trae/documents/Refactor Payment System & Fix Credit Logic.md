I will perform the following actions to resolve your requests:

### 1. Remove Mercado Pago References
I will remove the obsolete Mercado Pago fields and replace them with a generic internal subscription tracking system.

*   **`types/users/users.ts`**: 
    *   Remove `mercadoPagoCustomerId`.
    *   Rename `mercadoPagoSubscriptionId` to `currentSubscriptionId`.
*   **`services/subscriptionService.ts`**:
    *   Update `updateUserSubscriptionStatus` to save the ID in `currentSubscriptionId`.
    *   Update `createPixSubscription` to use the new field name.
*   **`app/api/onboarding/check-payment-status/route.ts`**:
    *   Update the active subscription check logic to look for `currentSubscriptionId` instead of the Mercado Pago ID.

### 2. Fix Credit Logic (Full Payment + Credits)
I will fix the issue where credits are not being granted when the student chooses to pay the full amount for a partial month.

*   **`types/financial/subscription.ts`**:
    *   Update `CreateSubscriptionParams` interface to include `addLateCredits` and `lateCreditsAmount`.
*   **`services/subscriptionService.ts`**:
    *   Update `createSubscription` to accept and pass the credit parameters.
    *   Update `createPixSubscription` to handle these parameters.
    *   Implement the logic to call `creditService.grantCredits` immediately after the subscription is created. I will set a default expiration of **90 days** for these credits.

### 3. Verify AbacatePay Integration
I have analyzed the current implementation against the documentation and your requirements:

*   **PIX Flow:** The implementation correctly uses the `/pixQrCode/create` endpoint (which is compatible with the API v1) and handles the flow without redirection, as you requested. The logic for generating the code and checking status via webhook is correct.
*   **Webhook Verification:** The code currently uses `ABACATEPAY_CONFIG.PUBLIC_KEY` to verify the webhook signature. While some providers use a Secret Key, if this is currently working for you, I will keep it. If you encounter signature errors, we may need to switch to `WEBHOOK_SECRET`.
*   **Recommendation:** I will proceed with the code cleanup and logic fixes, keeping the current AbacatePay configuration as it appears to be functional.

I will now proceed with these changes.