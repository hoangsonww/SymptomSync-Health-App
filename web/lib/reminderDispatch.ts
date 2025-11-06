/**
 * Reminder dispatch service for scanning and sending push notifications
 * This can be run as a cron job or scheduled task
 */

import webpush from 'web-push';
import { supabase } from '@/lib/supabaseClient';
import { format, addMinutes, isWithinInterval, parseISO } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Initialize VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface ReminderItem {
  id: string;
  type: 'medication' | 'appointment';
  user_id: string;
  title: string;
  due_time: string;
  entity_id: string;
  timezone?: string;
}

interface UserSettings {
  user_id: string;
  timezone: string;
  dnd_start: string;
  dnd_end: string;
  notify_meds: boolean;
  notify_appts: boolean;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Main function to scan for due reminders and send notifications
 */
export async function processReminders(): Promise<void> {
  try {
    console.log('[ReminderDispatch] Starting reminder processing...');

    // Get all due reminders
    const dueReminders = await getDueReminders();
    console.log(`[ReminderDispatch] Found ${dueReminders.length} due reminders`);

    if (dueReminders.length === 0) {
      return;
    }

    // Group reminders by user
    const remindersByUser = groupRemindersByUser(dueReminders);

    // Process each user's reminders
    const results = await Promise.allSettled(
      Object.entries(remindersByUser).map(([userId, reminders]) =>
        processUserReminders(userId, reminders)
      )
    );

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[ReminderDispatch] Processed ${successful} users successfully, ${failed} failed`);

  } catch (error) {
    console.error('[ReminderDispatch] Error in processReminders:', error);
  }
}

/**
 * Get all due reminders that haven't been notified yet
 */
async function getDueReminders(): Promise<ReminderItem[]> {
  const now = new Date();
  const reminders: ReminderItem[] = [];

  // Get due medication reminders
  const { data: medReminders, error: medError } = await supabase
    .from('medication_reminders')
    .select(`
      id,
      user_profile_id,
      medication_name,
      reminder_time,
      notified
    `)
    .eq('notified', false)
    .lte('reminder_time', now.toISOString());

  if (medError) {
    console.error('[ReminderDispatch] Error fetching medication reminders:', medError);
  } else {
    reminders.push(...medReminders.map(med => ({
      id: `med-${med.id}`,
      type: 'medication' as const,
      user_id: med.user_profile_id,
      title: med.medication_name,
      due_time: med.reminder_time,
      entity_id: med.id
    })));
  }

  // Get due appointment reminders  
  const { data: apptReminders, error: apptError } = await supabase
    .from('appointment_reminders')
    .select(`
      id,
      user_profile_id,
      appointment_name,
      date,
      notified
    `)
    .eq('notified', false)
    .lte('date', now.toISOString());

  if (apptError) {
    console.error('[ReminderDispatch] Error fetching appointment reminders:', apptError);
  } else {
    reminders.push(...apptReminders.map(appt => ({
      id: `appt-${appt.id}`,
      type: 'appointment' as const,
      user_id: appt.user_profile_id,
      title: appt.appointment_name,
      due_time: appt.date,
      entity_id: appt.id
    })));
  }

  return reminders;
}

/**
 * Group reminders by user ID
 */
function groupRemindersByUser(reminders: ReminderItem[]): Record<string, ReminderItem[]> {
  return reminders.reduce((acc, reminder) => {
    if (!acc[reminder.user_id]) {
      acc[reminder.user_id] = [];
    }
    acc[reminder.user_id].push(reminder);
    return acc;
  }, {} as Record<string, ReminderItem[]>);
}

/**
 * Process reminders for a specific user
 */
async function processUserReminders(userId: string, reminders: ReminderItem[]): Promise<void> {
  try {
    // Get user settings
    const userSettings = await getUserSettings(userId);
    if (!userSettings) {
      console.error(`[ReminderDispatch] No settings found for user ${userId}`);
      return;
    }

    // Filter reminders based on user preferences and DND
    const filteredReminders = await filterReminders(reminders, userSettings);
    
    if (filteredReminders.length === 0) {
      console.log(`[ReminderDispatch] No eligible reminders for user ${userId} after filtering`);
      return;
    }

    // Get user's push subscriptions
    const subscriptions = await getUserPushSubscriptions(userId);
    if (subscriptions.length === 0) {
      console.log(`[ReminderDispatch] No push subscriptions found for user ${userId}`);
      return;
    }

    // Send notifications to all user devices
    await Promise.allSettled(
      subscriptions.map(subscription =>
        sendNotificationsToDevice(subscription, filteredReminders, userSettings)
      )
    );

  } catch (error) {
    console.error(`[ReminderDispatch] Error processing reminders for user ${userId}:`, error);
  }
}

/**
 * Get user settings including timezone and DND preferences
 */
async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, timezone, dnd_start, dnd_end, notify_meds, notify_appts')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`[ReminderDispatch] Error fetching settings for user ${userId}:`, error);
    return null;
  }

  return data;
}

/**
 * Filter reminders based on user preferences and DND settings
 */
async function filterReminders(
  reminders: ReminderItem[], 
  settings: UserSettings
): Promise<ReminderItem[]> {
  const now = new Date();
  const userTimezone = settings.timezone || 'UTC';

  return reminders.filter(reminder => {
    // Check notification preferences
    if (reminder.type === 'medication' && !settings.notify_meds) {
      return false;
    }
    if (reminder.type === 'appointment' && !settings.notify_appts) {
      return false;
    }

    // Check Do Not Disturb
    if (isInDoNotDisturbWindow(now, settings, userTimezone)) {
      console.log(`[ReminderDispatch] Reminder ${reminder.id} deferred due to DND`);
      return false;
    }

    return true;
  });
}

/**
 * Check if current time is within Do Not Disturb window
 */
function isInDoNotDisturbWindow(
  currentTime: Date,
  settings: UserSettings,
  timezone: string
): boolean {
  if (!settings.dnd_start || !settings.dnd_end) {
    return false;
  }

  try {
    // Convert current time to user's timezone
    const userTime = utcToZonedTime(currentTime, timezone);
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();

    // Parse DND times (format: "HH:mm:ss")
    const dndStart = settings.dnd_start.split(':').map(Number);
    const dndEnd = settings.dnd_end.split(':').map(Number);

    const dndStartMinutes = dndStart[0] * 60 + dndStart[1];
    const dndEndMinutes = dndEnd[0] * 60 + dndEnd[1];
    const currentMinutes = currentHour * 60 + currentMinute;

    // Handle overnight DND (e.g., 22:00 to 07:00)
    if (dndStartMinutes > dndEndMinutes) {
      return currentMinutes >= dndStartMinutes || currentMinutes <= dndEndMinutes;
    }

    // Handle same-day DND (e.g., 12:00 to 14:00)
    return currentMinutes >= dndStartMinutes && currentMinutes <= dndEndMinutes;

  } catch (error) {
    console.error('[ReminderDispatch] Error checking DND window:', error);
    return false;
  }
}

/**
 * Get user's push subscriptions
 */
async function getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('user_push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    console.error(`[ReminderDispatch] Error fetching subscriptions for user ${userId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Send notifications to a specific device
 */
async function sendNotificationsToDevice(
  subscription: PushSubscription,
  reminders: ReminderItem[],
  settings: UserSettings
): Promise<void> {
  for (const reminder of reminders) {
    try {
      await sendPushNotification(subscription, reminder, settings);
      await recordNotificationEvent(reminder, subscription, 'sent');
      await markReminderAsNotified(reminder);
      
    } catch (error) {
      console.error(`[ReminderDispatch] Error sending notification for ${reminder.id}:`, error);
      await recordNotificationEvent(reminder, subscription, 'failed', error.message);
    }
  }
}

/**
 * Send a push notification to a device
 */
async function sendPushNotification(
  subscription: PushSubscription,
  reminder: ReminderItem,
  settings: UserSettings
): Promise<void> {
  const payload = {
    title: getReminderTitle(reminder),
    body: getReminderBody(reminder),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: `reminder-${reminder.entity_id}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      entityType: reminder.type,
      entityId: reminder.entity_id,
      reminderId: reminder.id,
      userId: reminder.user_id,
      timestamp: Date.now()
    }
  };

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };

  const options = {
    TTL: 24 * 60 * 60, // 24 hours
    vapidDetails: {
      subject: `mailto:${process.env.VAPID_EMAIL}`,
      publicKey: process.env.VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!
    }
  };

  await webpush.sendNotification(pushSubscription, JSON.stringify(payload), options);
}

/**
 * Get appropriate title for reminder notification
 */
function getReminderTitle(reminder: ReminderItem): string {
  if (reminder.type === 'medication') {
    return 'Medication Reminder';
  } else {
    return 'Appointment Reminder';
  }
}

/**
 * Get appropriate body text for reminder notification  
 */
function getReminderBody(reminder: ReminderItem): string {
  if (reminder.type === 'medication') {
    return `Time to take ${reminder.title}`;
  } else {
    return `Upcoming appointment: ${reminder.title}`;
  }
}

/**
 * Record notification event in database
 */
async function recordNotificationEvent(
  reminder: ReminderItem,
  subscription: PushSubscription,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('notification_events')
    .insert({
      user_id: reminder.user_id,
      entity_type: reminder.type,
      entity_id: reminder.entity_id,
      scheduled_at: reminder.due_time,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      status,
      error_message: errorMessage,
      subscription_id: subscription.id
    });

  if (error) {
    console.error('[ReminderDispatch] Error recording notification event:', error);
  }
}

/**
 * Mark reminder as notified in the database
 */
async function markReminderAsNotified(reminder: ReminderItem): Promise<void> {
  const table = reminder.type === 'medication' ? 'medication_reminders' : 'appointment_reminders';
  
  const { error } = await supabase
    .from(table)
    .update({ notified: true })
    .eq('id', reminder.entity_id);

  if (error) {
    console.error(`[ReminderDispatch] Error marking reminder ${reminder.id} as notified:`, error);
  }
}

/**
 * Create a cron job function for use with deployment platforms
 */
export async function reminderCronHandler(): Promise<Response> {
  try {
    await processReminders();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[ReminderDispatch] Cron job failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}