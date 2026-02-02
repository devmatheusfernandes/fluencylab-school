I will modify the Stream Chat webhook handler to listen for `message.new` events. When a new message is received, I will use the `AnnouncementService` to create a system announcement for the message recipients (excluding the sender). This ensures that:
1.  The notification is persisted in the database (appearing in the notification bell).
2.  A Web Push notification is triggered via `PushService`, which the PWA Service Worker will receive and display.

**Step-by-step Implementation:**

1.  **Modify `app/api/webhooks/stream/route.ts`**:
    *   Import `announcementService`.
    *   Add a condition to handle `body.type === 'message.new'`.
    *   Extract sender, message content, and channel members from the payload.
    *   Identify recipients (channel members excluding the sender).
    *   Call `announcementService.createSystemAnnouncement` with the sender's name as title, message preview as body, and a link to the chat channel.

**Verification:**
*   The `SidebarWrapper` already handles Service Worker registration and subscription, so the client-side PWA part is ready.
*   The `AnnouncementService` is already configured to trigger `PushService`.
*   This change bridges the gap between Stream Chat events and the project's notification system.
