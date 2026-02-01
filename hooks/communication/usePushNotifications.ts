'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window);
    if (typeof window !== 'undefined') setPermission(Notification.permission);
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
    setRegistration(reg);
    const sub = await reg.pushManager.getSubscription();
    setSubscription(sub);
    return reg;
  }, []);

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada');
    const reg = registration || (await registerServiceWorker());
    if (!reg) throw new Error('Service worker não disponível');
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    setSubscription(sub);
    const serialized = JSON.parse(JSON.stringify(sub));
    await fetch('/api/push/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serialized),
    });
    return sub;
  }, [registration, registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    setSubscription(null);
    await fetch(`/api/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`, { method: 'DELETE' });
  }, [subscription]);

  return {
    isSupported,
    registration,
    subscription,
    permission,
    registerServiceWorker,
    subscribe,
    unsubscribe,
  };
}

