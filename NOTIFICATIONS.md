# SymptomSync Notifications & Offline Sync

This document covers the setup and configuration of the push notification system and offline synchronization features.

## Overview

SymptomSync includes a comprehensive notification system that provides:

- **Push Notifications**: OS-level notifications that work even when the app is closed
- **Offline Support**: Create and edit data offline, sync when back online  
- **Smart Scheduling**: Timezone awareness and Do-Not-Disturb windows
- **Flexible Snooze**: Configurable snooze presets for reminders
- **Multi-Device**: Support for multiple devices per user

## Architecture

The notification system consists of several components:

1. **Service Worker** (`public/sw.js`): Handles push notifications and background sync
2. **Notification APIs** (`pages/api/notifications/`): Manage subscriptions and actions
3. **Reminder Dispatch** (`lib/reminderDispatch.ts`): Scans and sends due notifications
4. **Frontend Components**: Settings UI and status indicators
5. **Database Tables**: Store subscriptions, settings, and notification events

## Setup

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications:

```bash
cd web
node scripts/generate-vapid-keys.js
```

### 2. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Web Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your-email@example.com

# Reminder Processing
REMINDER_SCAN_CRON="* * * * *"
PUSH_BATCH_SIZE=100
PUSH_MAX_RETRIES=3

# Cron Job Security
CRON_API_KEY=your_secret_cron_api_key
```

### 3. Database Setup

Run the migration to create the required tables:

```sql
-- Apply the migration
psql -h your-host -d your-db -f supabase/migrations/20250909130003_reminders_v2_tables.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### 4. Service Worker Registration

The service worker is automatically registered when users visit the app. It handles:

- Push notification display
- Notification action buttons (taken, snooze, dismiss)
- Background sync for offline changes
- IndexedDB queue management

### 5. Cron Job Setup

Set up a cron job to scan for due reminders. You can use:

**Vercel Cron (if deploying to Vercel):**
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "* * * * *"
    }
  ]
}
```

**External Cron Service:**
Set up a service to POST to your API endpoint every minute:

```bash
curl -X POST https://your-domain.com/api/cron/process-reminders \
  -H "X-API-Key: your_secret_cron_api_key"
```

## Usage

### User Settings

Users can configure notifications in the Settings page (`/settings`):

1. **Enable Notifications**: Request browser permission and subscribe to push
2. **Notification Types**: Toggle medication/appointment/log reminders
3. **Do Not Disturb**: Set quiet hours (e.g., 22:00 - 07:00)
4. **Snooze Presets**: Configure quick snooze options (default: 10m, 30m, 2h)
5. **Timezone**: Set timezone for accurate scheduling
6. **Device Management**: View and remove registered devices

### Developer APIs

**Test Notification:**
```bash
curl -X POST https://your-domain.com/api/admin/test-notification \
  -H "Authorization: Bearer user_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "title": "Test", "body": "Hello World"}'
```

**Manual Reminder Processing:**
```bash
curl -X POST https://your-domain.com/api/cron/process-reminders \
  -H "X-API-Key: your_secret_cron_api_key"
```

## Database Schema

### user_settings
- `user_id`: Reference to auth.users
- `timezone`: User's timezone (e.g., "America/New_York")
- `dnd_start/dnd_end`: Do-not-disturb window
- `snooze_presets`: Array of snooze minutes [10, 30, 120]
- `notify_meds/notify_appts/notify_logs`: Per-type toggles

### user_push_subscriptions
- `user_id`: Reference to auth.users
- `endpoint`: Push subscription endpoint
- `p256dh/auth`: Encryption keys
- `user_agent`: Device identification
- `last_seen_at`: For cleanup of old subscriptions

### notification_events
- `user_id`: Reference to auth.users
- `entity_type/entity_id`: What was reminded about
- `scheduled_at/sent_at`: Timing information
- `status`: queued, sent, failed, delivered, clicked
- `subscription_id`: Which device received it

## Offline Support

The app includes comprehensive offline support:

### Offline Queue
- Notification actions (taken/snooze/dismiss) are queued when offline
- Data changes (create/edit medications/appointments) are queued
- Automatic retry when connection is restored
- Background sync when available

### IndexedDB Storage
- `notificationActions`: Queued notification actions
- `offlineData`: Queued data changes
- `userSettings`: Cached settings for offline access

### Status Indicators
- Navigation shows online/offline status
- Queue count badges for pending items
- Settings show sync status

## Security

### Authentication
- All API endpoints require valid JWT tokens
- RLS policies restrict data access to owner
- Service role bypass for cron jobs

### API Protection
- Cron endpoints protected with API keys
- Rate limiting on subscription endpoints
- Input validation on all requests

### Data Privacy
- Notification payloads contain minimal data
- Push subscriptions encrypted in transit
- User can revoke device access anytime

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check browser permission status
   - Verify VAPID keys are correctly set
   - Check browser developer tools for service worker errors

2. **Offline sync not working**
   - Ensure service worker is registered
   - Check IndexedDB for queued items
   - Verify background sync support in browser

3. **Wrong timezone notifications**
   - User should set correct timezone in settings
   - Check server timezone configuration
   - Verify date-fns-tz calculations

### Debug Tools

**Check Service Worker Status:**
```javascript
navigator.serviceWorker.ready.then(registration => {
  console.log('SW registered:', registration);
});
```

**Check Push Subscription:**
```javascript
navigator.serviceWorker.ready.then(registration => {
  return registration.pushManager.getSubscription();
}).then(subscription => {
  console.log('Push subscription:', subscription);
});
```

**Check Offline Queue:**
```javascript
import { getOfflineQueueStatus } from '@/lib/notifications';
getOfflineQueueStatus().then(status => {
  console.log('Queue status:', status);
});
```

## Performance Considerations

- Push notifications have 24-hour TTL
- Cron job processes in batches (configurable)
- Old subscriptions cleaned up automatically
- IndexedDB has size limits (~50MB typical)
- Service worker caching for offline access

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: iOS 16.4+ required for push notifications
- **Mobile**: Add to Home Screen for better experience

## Deployment Notes

- Service worker must be served from root path
- HTTPS required for push notifications
- Configure Content Security Policy for push domains
- Test with actual mobile devices, not just desktop