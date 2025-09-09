/**
 * Notification Settings Component
 * Manages push notification permissions, device subscriptions, and user preferences
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Smartphone, Laptop, Trash2, Settings, Clock, Moon, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  registerServiceWorker,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendSubscriptionToServer,
  removeSubscriptionFromServer,
  setupServiceWorkerMessaging,
  getOfflineQueueStatus
} from '@/lib/notifications';
import { supabase } from '@/lib/supabaseClient';

interface UserSettings {
  id: string;
  user_id: string;
  timezone: string;
  dnd_start: string;
  dnd_end: string;
  snooze_presets: number[];
  notify_meds: boolean;
  notify_appts: boolean;
  notify_logs: boolean;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  user_agent: string | null;
  last_seen_at: string;
  created_at: string;
}

interface NotificationSettingsProps {
  userId: string;
  authToken: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

export function NotificationSettings({ userId, authToken }: NotificationSettingsProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [offlineQueueStatus, setOfflineQueueStatus] = useState({ notificationActions: 0, offlineData: 0 });
  const [newSnoozePreset, setNewSnoozePreset] = useState('');

  useEffect(() => {
    initializeNotifications();
    loadUserSettings();
    loadSubscriptions();
    checkOfflineQueue();
    
    // Set up service worker messaging
    setupServiceWorkerMessaging(authToken);

    // Listen for online/offline events
    window.addEventListener('online', checkOfflineQueue);
    window.addEventListener('offline', checkOfflineQueue);

    return () => {
      window.removeEventListener('online', checkOfflineQueue);
      window.removeEventListener('offline', checkOfflineQueue);
    };
  }, [userId, authToken]);

  const initializeNotifications = async () => {
    setPermissionState(getNotificationPermission());
    
    // Register service worker
    const registration = await registerServiceWorker();
    if (registration) {
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!existingSubscription);
    }
  };

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const defaultSettings = {
          user_id: userId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dnd_start: '22:00:00',
          dnd_end: '07:00:00',
          snooze_presets: [10, 30, 120],
          notify_meds: true,
          notify_appts: true,
          notify_logs: false
        };

        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .select('id, endpoint, user_agent, last_seen_at, created_at')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const checkOfflineQueue = async () => {
    try {
      const status = await getOfflineQueueStatus();
      setOfflineQueueStatus(status);
    } catch (error) {
      console.error('Error checking offline queue:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setUpdating(true);
      
      // Request permission
      const permission = await requestNotificationPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('Failed to register service worker');
        return;
      }

      // Subscribe to push notifications
      const subscriptionData = await subscribeToPushNotifications(registration);
      if (!subscriptionData) {
        toast.error('Failed to create push subscription');
        return;
      }

      // Send subscription to server
      const result = await sendSubscriptionToServer(subscriptionData, authToken);
      if (!result.success) {
        toast.error(result.error || 'Failed to save subscription');
        return;
      }

      setIsSubscribed(true);
      toast.success('Push notifications enabled successfully!');
      
      // Reload subscriptions
      await loadSubscriptions();
      
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setUpdating(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setUpdating(true);
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Remove from server first
        const result = await removeSubscriptionFromServer(subscription.endpoint, authToken);
        if (result.success) {
          // Then unsubscribe locally
          await unsubscribeFromPushNotifications(registration);
          setIsSubscribed(false);
          toast.success('Push notifications disabled');
          await loadSubscriptions();
        } else {
          toast.error(result.error || 'Failed to remove subscription');
        }
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveDevice = async (subscriptionId: string, endpoint: string) => {
    try {
      const result = await removeSubscriptionFromServer(endpoint, authToken);
      if (result.success) {
        toast.success('Device removed successfully');
        await loadSubscriptions();
      } else {
        toast.error(result.error || 'Failed to remove device');
      }
    } catch (error) {
      console.error('Error removing device:', error);
      toast.error('Failed to remove device');
    }
  };

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      setSettings({ ...settings, ...updates });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddSnoozePreset = () => {
    const minutes = parseInt(newSnoozePreset);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Please enter a valid number of minutes');
      return;
    }

    if (settings && !settings.snooze_presets.includes(minutes)) {
      const updatedPresets = [...settings.snooze_presets, minutes].sort((a, b) => a - b);
      handleUpdateSettings({ snooze_presets: updatedPresets });
      setNewSnoozePreset('');
    } else {
      toast.error('This preset already exists');
    }
  };

  const handleRemoveSnoozePreset = (minutes: number) => {
    if (settings) {
      const updatedPresets = settings.snooze_presets.filter(preset => preset !== minutes);
      handleUpdateSettings({ snooze_presets: updatedPresets });
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Smartphone className="w-4 h-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Laptop className="w-4 h-4" />;
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 max-w-4xl mx-auto p-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Permission Status */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {permissionState === 'granted' && isSubscribed ? (
                <Bell className="w-5 h-5 text-green-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-500" />
              )}
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {permissionState === 'granted' && isSubscribed
                    ? 'Push notifications are enabled for this device'
                    : permissionState === 'denied'
                    ? 'Push notifications are blocked. Please enable in browser settings.'
                    : 'Enable push notifications to receive reminders even when the app is closed'
                  }
                </p>
                <Badge variant={
                  permissionState === 'granted' && isSubscribed ? 'default' :
                  permissionState === 'denied' ? 'destructive' : 'secondary'
                }>
                  {permissionState === 'granted' && isSubscribed ? 'Enabled' :
                   permissionState === 'denied' ? 'Blocked' : 'Disabled'}
                </Badge>
              </div>
              <Button
                onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
                disabled={updating || permissionState === 'denied'}
                variant={isSubscribed ? 'outline' : 'default'}
              >
                {updating ? 'Processing...' : isSubscribed ? 'Disable' : 'Enable Notifications'}
              </Button>
            </div>

            {/* Offline Queue Status */}
            {(offlineQueueStatus.notificationActions > 0 || offlineQueueStatus.offlineData > 0) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Offline queue:</span> {' '}
                  {offlineQueueStatus.notificationActions} notification actions, {' '}
                  {offlineQueueStatus.offlineData} data changes pending sync
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Types */}
      {settings && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-meds">Medication Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified when it&apos;s time to take medication</p>
                </div>
                <Switch
                  id="notify-meds"
                  checked={settings.notify_meds}
                  onCheckedChange={(checked) => handleUpdateSettings({ notify_meds: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-appts">Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming appointments</p>
                </div>
                <Switch
                  id="notify-appts"
                  checked={settings.notify_appts}
                  onCheckedChange={(checked) => handleUpdateSettings({ notify_appts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-logs">Health Log Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified to log health data</p>
                </div>
                <Switch
                  id="notify-logs"
                  checked={settings.notify_logs}
                  onCheckedChange={(checked) => handleUpdateSettings({ notify_logs: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Do Not Disturb */}
      {settings && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Do Not Disturb
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Notifications will be deferred during these hours
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dnd-start">Start Time</Label>
                  <Input
                    id="dnd-start"
                    type="time"
                    value={settings.dnd_start}
                    onChange={(e) => handleUpdateSettings({ dnd_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dnd-end">End Time</Label>
                  <Input
                    id="dnd-end"
                    type="time"
                    value={settings.dnd_end}
                    onChange={(e) => handleUpdateSettings({ dnd_end: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => handleUpdateSettings({ timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">GMT</SelectItem>
                    <SelectItem value="Europe/Berlin">CET</SelectItem>
                    <SelectItem value="Asia/Tokyo">JST</SelectItem>
                    {/* Add more timezones as needed */}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Snooze Presets */}
      {settings && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Snooze Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quick snooze options for notifications (in minutes)
              </p>
              <div className="flex flex-wrap gap-2">
                {settings.snooze_presets.map((preset) => (
                  <Badge key={preset} variant="secondary" className="flex items-center gap-1">
                    {preset}m
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveSnoozePreset(preset)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Minutes"
                  value={newSnoozePreset}
                  onChange={(e) => setNewSnoozePreset(e.target.value)}
                  className="w-24"
                />
                <Button
                  onClick={handleAddSnoozePreset}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* My Devices */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>My Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No devices registered for push notifications
              </p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(subscription.user_agent)}
                      <div>
                        <p className="text-sm font-medium">
                          {subscription.user_agent?.includes('Mobile') ? 'Mobile Device' :
                           subscription.user_agent?.includes('Android') ? 'Android Device' :
                           subscription.user_agent?.includes('iPhone') ? 'iPhone' :
                           subscription.user_agent?.includes('iPad') ? 'iPad' :
                           'Desktop Browser'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {formatLastSeen(subscription.last_seen_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDevice(subscription.id, subscription.endpoint)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}