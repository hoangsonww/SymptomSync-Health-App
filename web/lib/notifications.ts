/**
 * Utility functions for managing push notifications and service worker
 */

import { openDB, IDBPDatabase } from 'idb';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export interface NotificationAction {
  type: 'taken' | 'snooze' | 'dismiss';
  entityType: 'medication' | 'appointment';
  entityId: string;
  context?: {
    snoozeMinutes?: number;
    notificationEventId?: string;
  };
}

export interface OfflineDataPayload {
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Update service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available');
            // Optionally notify user about update
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Check notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscriptionData | null> {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      },
      userAgent: navigator.userAgent
    };

    return subscriptionData;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

// Send subscription to server
export async function sendSubscriptionToServer(
  subscriptionData: PushSubscriptionData,
  authToken: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(subscriptionData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    return { success: false, error: 'Network error' };
  }
}

// Remove subscription from server
export async function removeSubscriptionFromServer(
  endpoint: string,
  authToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ endpoint })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to remove subscription from server:', error);
    return { success: false, error: 'Network error' };
  }
}

// IndexedDB for offline queue management
let dbPromise: Promise<IDBPDatabase> | null = null;

export async function openOfflineDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB('SymptomSyncOffline', 1, {
      upgrade(db) {
        // Notification actions queue
        if (!db.objectStoreNames.contains('notificationActions')) {
          db.createObjectStore('notificationActions', { keyPath: 'id' });
        }
        
        // Offline data queue (medications, appointments, logs)
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
        
        // User settings cache
        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'userId' });
        }
      }
    });
  }
  return dbPromise;
}

// Queue notification action for background sync
export async function queueNotificationAction(action: NotificationAction): Promise<void> {
  try {
    const db = await openOfflineDB();
    
    const record = {
      id: generateId(),
      payload: action,
      timestamp: Date.now(),
      retryCount: 0
    };

    await db.add('notificationActions', record);
    console.log('Queued notification action:', record.id);

    // Register background sync if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (registration as any).sync.register('notification-actions');
      }
    }
  } catch (error) {
    console.error('Failed to queue notification action:', error);
  }
}

// Queue offline data for background sync
export async function queueOfflineData(
  type: 'medication' | 'appointment' | 'log',
  method: 'POST' | 'PUT' | 'DELETE',
  url: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const db = await openOfflineDB();
    
    const record = {
      id: generateId(),
      type,
      payload: { method, url, data },
      timestamp: Date.now(),
      retryCount: 0
    };

    await db.add('offlineData', record);
    console.log('Queued offline data:', record.id);

    // Register background sync if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (registration as any).sync.register('offline-data');
      }
    }
  } catch (error) {
    console.error('Failed to queue offline data:', error);
  }
}

// Get offline queue status
export async function getOfflineQueueStatus(): Promise<{
  notificationActions: number;
  offlineData: number;
}> {
  try {
    const db = await openOfflineDB();
    
    const notificationActions = await db.count('notificationActions');
    const offlineData = await db.count('offlineData');

    return { notificationActions, offlineData };
  } catch (error) {
    console.error('Failed to get offline queue status:', error);
    return { notificationActions: 0, offlineData: 0 };
  }
}

// Flush offline queues when back online
export async function flushOfflineQueues(): Promise<void> {
  if (!navigator.onLine) {
    return;
  }

  try {
    // Trigger background sync
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (registration as any).sync.register('notification-actions'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (registration as any).sync.register('offline-data')
        ]);
      }
    }
  } catch (error) {
    console.error('Failed to flush offline queues:', error);
  }
}

// Set up service worker messaging
export function setupServiceWorkerMessaging(authToken: string): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Send auth token to service worker
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.active) {
      registration.active.postMessage({
        type: 'SET_AUTH_TOKEN',
        token: authToken
      });
    }
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message from SW:', event.data);

    if (event.data?.type === 'NOTIFICATION_ACTION') {
      // Handle notification action in main thread
      handleNotificationAction(event.data.payload);
    } else if (event.data?.type === 'GET_AUTH_TOKEN') {
      // Respond with current auth token
      event.ports[0].postMessage({ token: authToken });
    }
  });
}

// Handle notification action in main thread
async function handleNotificationAction(action: NotificationAction): Promise<void> {
  try {
    // You can implement UI updates here
    console.log('Handling notification action in main thread:', action);
    
    // For example, show a toast notification
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('notificationAction', {
        detail: action
      }));
    }
  } catch (error) {
    console.error('Error handling notification action:', error);
  }
}

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}