import webpush from 'web-push';
import { Announcement } from '@/types/announcements';
import { UserAdminRepository } from '@/repositories/user.admin.repository';
import { PushSubscriptionRepository, StoredSubscription } from '@/repositories/pushSubscriptionRepository';

const userRepo = new UserAdminRepository();
const subRepo = new PushSubscriptionRepository();

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  // Determine a valid subject (must be https: or mailto:)
  const envSubject = process.env.VAPID_SUBJECT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  const pickSubject = (): string => {
    if (envSubject && (envSubject.startsWith('https://') || envSubject.startsWith('mailto:'))) return envSubject;
    if (appUrl && appUrl.startsWith('https://')) return appUrl;
    if (nextAuthUrl && nextAuthUrl.startsWith('https://')) return nextAuthUrl;
    return 'mailto:push@fluencylab.me';
  };

  const subject = pickSubject();

  if (publicKey && privateKey && subject) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
}

configureWebPush();

export class PushService {
  async sendAnnouncement(announcement: Announcement): Promise<void> {
    const recipients: string[] = await this.resolveRecipients(announcement);
    if (recipients.length === 0) return;
    const items = await subRepo.getForUsers(recipients);
    const payload = {
      title: announcement.title,
      body: announcement.message,
      type: announcement.type,
      url: process.env.NEXT_PUBLIC_APP_URL || '/',
    };
    await Promise.all(
      items.flatMap((item) => item.subscriptions.map((s) => this.sendToSubscription(s, payload)))
    );
  }

  private async resolveRecipients(announcement: Announcement): Promise<string[]> {
    if (announcement.recipients.type === 'specific' && Array.isArray(announcement.recipients.userIds)) {
      return announcement.recipients.userIds;
    }
    if (announcement.recipients.type === 'role' && Array.isArray(announcement.recipients.roles)) {
      const all: string[] = [];
      for (const role of announcement.recipients.roles) {
        const users = await userRepo.findUsersByRole(role);
        all.push(...users.map((u) => u.id));
      }
      return Array.from(new Set(all));
    }
    return [];
  }

  private async sendToSubscription(subscription: StoredSubscription, payload: any) {
    const sub = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    } as any;
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        // expired or gone, cleanup
        const url = subscription.endpoint;
        const matches = await this.findUserByEndpoint(url);
        if (matches) {
          await subRepo.remove(matches.userId, url);
        }
      }
    }
  }

  private async findUserByEndpoint(endpoint: string): Promise<{ userId: string } | null> {
    // naive scan: in production, index by endpoint
    return null;
  }
}

export const pushService = new PushService();
