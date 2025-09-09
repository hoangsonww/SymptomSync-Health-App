/**
 * Hook for managing notification state and service worker integration
 */

import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  getNotificationPermission,
  subscribeToPushNotifications,
  sendSubscriptionToServer,
  setupServiceWorkerMessaging,
  queueNotificationAction,
  queueOfflineData,
  getOfflineQueueStatus,
  flushOfflineQueues,
  type NotificationAction,
} from '@/lib/notifications';

interface UseNotificationsProps {
  userId?: string;
  authToken?: string;
}

interface NotificationState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isSupported: boolean;
  swReady: boolean;
  offlineQueue: {
    notificationActions: number;
    offlineData: number;
  };
}

export function useNotifications({ userId, authToken }: UseNotificationsProps = {}) {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSubscribed: false,
    isSupported: false,
    swReady: false,
    offlineQueue: { notificationActions: 0, offlineData: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Initialize notifications
  const initialize = useCallback(async () => {
    try {
      setLoading(true);

      // Check support
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      // Get current permission state
      const permission = getNotificationPermission();
      
      // Register service worker
      const registration = await registerServiceWorker();
      const swReady = !!registration;

      // Check if already subscribed
      let isSubscribed = false;
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription();
        isSubscribed = !!existingSubscription;
      }

      // Get offline queue status
      const offlineQueue = await getOfflineQueueStatus();

      setState({
        permission,
        isSubscribed,
        isSupported,
        swReady,
        offlineQueue
      });

      // Set up messaging if we have auth info
      if (authToken && swReady) {
        setupServiceWorkerMessaging(authToken);
      }

    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported || !userId || !authToken) {
      throw new Error('Missing requirements for subscription');
    }

    try {
      // Request permission if needed
      if (state.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission denied');
        }
        setState(prev => ({ ...prev, permission }));
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        throw new Error('Service worker not ready');
      }

      // Subscribe to push
      const subscriptionData = await subscribeToPushNotifications(registration);
      if (!subscriptionData) {
        throw new Error('Failed to create subscription');
      }

      // Send to server
      const result = await sendSubscriptionToServer(subscriptionData, authToken);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save subscription');
      }

      setState(prev => ({ ...prev, isSubscribed: true }));
      return result.subscriptionId;

    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }, [state.isSupported, state.permission, userId, authToken]);

  // Queue notification action for offline processing
  const queueAction = useCallback(async (action: NotificationAction) => {
    try {
      await queueNotificationAction(action);
      const offlineQueue = await getOfflineQueueStatus();
      setState(prev => ({ ...prev, offlineQueue }));
    } catch (error) {
      console.error('Error queuing notification action:', error);
    }
  }, []);

  // Queue offline data for sync
  const queueData = useCallback(async (
    type: 'medication' | 'appointment' | 'log',
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    data: Record<string, unknown>
  ) => {
    try {
      await queueOfflineData(type, method, url, data);
      const offlineQueue = await getOfflineQueueStatus();
      setState(prev => ({ ...prev, offlineQueue }));
    } catch (error) {
      console.error('Error queuing offline data:', error);
    }
  }, []);

  // Flush offline queues
  const flushQueues = useCallback(async () => {
    try {
      await flushOfflineQueues();
      // Update queue status after a short delay to allow processing
      setTimeout(async () => {
        const offlineQueue = await getOfflineQueueStatus();
        setState(prev => ({ ...prev, offlineQueue }));
      }, 1000);
    } catch (error) {
      console.error('Error flushing offline queues:', error);
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      flushQueues();
    };

    const handleOffline = async () => {
      const offlineQueue = await getOfflineQueueStatus();
      setState(prev => ({ ...prev, offlineQueue }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueues]);

  // Listen for notification actions
  useEffect(() => {
    const handleNotificationAction = (event: CustomEvent) => {
      const action = event.detail as NotificationAction;
      console.log('Notification action received:', action);
      
      // You can emit custom events here for UI updates
      // For example, show a toast or update medication status
    };

    window.addEventListener('notificationAction', handleNotificationAction as EventListener);
    
    return () => {
      window.removeEventListener('notificationAction', handleNotificationAction as EventListener);
    };
  }, []);

  // Initialize when dependencies change
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Periodically check queue status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const offlineQueue = await getOfflineQueueStatus();
        setState(prev => ({ ...prev, offlineQueue }));
      } catch (error) {
        console.error('Error checking offline queue:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    loading,
    subscribe,
    queueAction,
    queueData,
    flushQueues,
    initialize
  };
}