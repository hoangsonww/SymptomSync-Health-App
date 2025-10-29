/**
 * SymptomSync Service Worker for Push Notifications and Background Sync
 * Handles push notifications, notification actions, and offline data sync
 */

const SW_VERSION = '1.0.0';
const CACHE_NAME = `symptomsync-sw-${SW_VERSION}`;
const API_BASE_URL = '/api';

// Install event
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('symptomsync-sw-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received', event);

  let notificationData = {
    title: 'SymptomSync Reminder',
    body: 'You have a new reminder',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'symptomsync-reminder',
    requireInteraction: true,
    actions: [],
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (e) {
      console.error('[SW] Error parsing push payload', e);
    }
  }

  // Add action buttons based on notification type
  if (notificationData.data?.entityType === 'medication') {
    notificationData.actions = [
      {
        action: 'taken',
        title: 'Mark Taken',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 10min',
        icon: '/icons/snooze.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ];
  } else if (notificationData.data?.entityType === 'appointment') {
    notificationData.actions = [
      {
        action: 'dismiss',
        title: 'Acknowledge',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'snooze',
        title: 'Remind Later',
        icon: '/icons/snooze.png'
      }
    ];
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === 'taken' || action === 'snooze' || action === 'dismiss') {
    // Handle notification action
    const actionPromise = handleNotificationAction(action, data);
    event.waitUntil(actionPromise);
  } else {
    // Default click - open/focus the app
    const openPromise = openApp();
    event.waitUntil(openPromise);
  }
});

// Handle notification actions (taken, snooze, dismiss)
async function handleNotificationAction(action, data) {
  console.log('[SW] Handling notification action', action, data);

  const actionPayload = {
    type: action,
    entityType: data.entityType,
    entityId: data.entityId,
    context: {
      snoozeMinutes: action === 'snooze' ? 10 : undefined,
      notificationEventId: data.notificationEventId
    }
  };

  try {
    // Try to send action to any open client first
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'NOTIFICATION_ACTION',
        payload: actionPayload
      });
      return;
    }

    // No clients available, queue for background sync
    await queueNotificationAction(actionPayload);
    
    // Try to send directly if online
    if (navigator.onLine) {
      await sendNotificationAction(actionPayload);
    } else {
      // Register background sync
      await self.registration.sync.register('notification-actions');
    }

  } catch (error) {
    console.error('[SW] Error handling notification action', error);
    // Queue for retry
    await queueNotificationAction(actionPayload);
    await self.registration.sync.register('notification-actions');
  }
}

// Open or focus the app
async function openApp() {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // If a client is already open, focus it
  if (clients.length > 0) {
    return clients[0].focus();
  }
  
  // Otherwise, open a new window
  return self.clients.openWindow('/');
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync', event.tag);

  if (event.tag === 'notification-actions') {
    event.waitUntil(processNotificationActionQueue());
  } else if (event.tag === 'offline-data') {
    event.waitUntil(processOfflineDataQueue());
  }
});

// Process queued notification actions
async function processNotificationActionQueue() {
  console.log('[SW] Processing notification action queue');
  
  try {
    const db = await openDB();
    const tx = db.transaction(['notificationActions'], 'readonly');
    const store = tx.objectStore('notificationActions');
    const actions = await store.getAll();

    for (const actionRecord of actions) {
      try {
        await sendNotificationAction(actionRecord.payload);
        
        // Remove from queue on success
        const deleteTx = db.transaction(['notificationActions'], 'readwrite');
        const deleteStore = deleteTx.objectStore('notificationActions');
        await deleteStore.delete(actionRecord.id);
        
        console.log('[SW] Notification action processed successfully', actionRecord.id);
      } catch (error) {
        console.error('[SW] Failed to process notification action', actionRecord.id, error);
        // Keep in queue for retry
      }
    }
  } catch (error) {
    console.error('[SW] Error processing notification action queue', error);
  }
}

// Process offline data queue  
async function processOfflineDataQueue() {
  console.log('[SW] Processing offline data queue');
  
  try {
    const db = await openDB();
    const tx = db.transaction(['offlineData'], 'readonly');
    const store = tx.objectStore('offlineData');
    const dataRecords = await store.getAll();

    for (const record of dataRecords) {
      try {
        await sendOfflineData(record.payload);
        
        // Remove from queue on success
        const deleteTx = db.transaction(['offlineData'], 'readwrite');
        const deleteStore = deleteTx.objectStore('offlineData');
        await deleteStore.delete(record.id);
        
        console.log('[SW] Offline data processed successfully', record.id);
      } catch (error) {
        console.error('[SW] Failed to process offline data', record.id, error);
        // Keep in queue for retry
      }
    }
  } catch (error) {
    console.error('[SW] Error processing offline data queue', error);
  }
}

// Queue notification action for background sync
async function queueNotificationAction(payload) {
  const db = await openDB();
  const tx = db.transaction(['notificationActions'], 'readwrite');
  const store = tx.objectStore('notificationActions');
  
  const record = {
    id: generateId(),
    payload,
    timestamp: Date.now()
  };
  
  await store.add(record);
  console.log('[SW] Queued notification action', record.id);
}

// Send notification action to API
async function sendNotificationAction(payload) {
  const response = await fetch(`${API_BASE_URL}/notifications/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Send offline data to API
async function sendOfflineData(payload) {
  const { method, url, data } = payload;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SymptomSyncSW', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('notificationActions')) {
        db.createObjectStore('notificationActions', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

// Get auth token from storage or message client
async function getAuthToken() {
  try {
    const db = await openDB();
    const tx = db.transaction(['settings'], 'readonly');
    const store = tx.objectStore('settings');
    const tokenRecord = await store.get('authToken');
    
    if (tokenRecord && tokenRecord.value) {
      return tokenRecord.value;
    }
  } catch (error) {
    console.error('[SW] Error getting auth token from storage', error);
  }

  // Try to get from client
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.token);
      };
      
      clients[0].postMessage({
        type: 'GET_AUTH_TOKEN'
      }, [channel.port2]);
      
      // Timeout fallback
      setTimeout(() => resolve(null), 5000);
    });
  }

  return null;
}

// Generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received', event.data);

  if (event.data?.type === 'SET_AUTH_TOKEN') {
    // Store auth token for background requests
    openDB().then(db => {
      const tx = db.transaction(['settings'], 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: 'authToken', value: event.data.token });
    }).catch(error => {
      console.error('[SW] Error storing auth token', error);
    });
  }
});