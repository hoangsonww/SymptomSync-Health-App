-- Reminders v2: Web Push + Service Worker + Offline Sync
-- Create tables for push subscriptions, notification events, and user settings

-- User settings table for notification preferences, timezone, DND, etc.
CREATE TABLE public.user_settings (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid not null,
  timezone text not null default 'UTC',
  dnd_start time null default '22:00:00',
  dnd_end time null default '07:00:00',
  snooze_presets integer[] not null default '{10,30,120}',
  notify_meds boolean not null default true,
  notify_appts boolean not null default true,
  notify_logs boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_settings_pkey primary key (id),
  constraint user_settings_user_id_key unique (user_id),
  constraint user_settings_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- User push subscriptions table for Web Push endpoints
CREATE TABLE public.user_push_subscriptions (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  constraint user_push_subscriptions_pkey primary key (id),
  constraint user_push_subscriptions_endpoint_key unique (endpoint),
  constraint user_push_subscriptions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Notification events table for tracking sent notifications
CREATE TABLE public.notification_events (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid not null,
  entity_type text not null check (entity_type in ('medication', 'appointment')),
  entity_id uuid not null,
  scheduled_at timestamp with time zone not null,
  sent_at timestamp with time zone null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'delivered', 'clicked')),
  error_message text null,
  subscription_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint notification_events_pkey primary key (id),
  constraint notification_events_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint notification_events_subscription_id_fkey foreign key (subscription_id) references user_push_subscriptions (id) on delete set null
) tablespace pg_default;

-- Create indexes for efficient queries
CREATE INDEX idx_user_settings_user_id ON public.user_settings USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX idx_user_push_subscriptions_user_id ON public.user_push_subscriptions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX idx_user_push_subscriptions_last_seen_at ON public.user_push_subscriptions USING btree (last_seen_at DESC) TABLESPACE pg_default;
CREATE INDEX idx_notification_events_user_id_scheduled_at ON public.notification_events USING btree (user_id, scheduled_at) TABLESPACE pg_default;
CREATE INDEX idx_notification_events_status ON public.notification_events USING btree (status) TABLESPACE pg_default;
CREATE INDEX idx_notification_events_entity ON public.notification_events USING btree (entity_type, entity_id) TABLESPACE pg_default;

-- Add updated_at trigger for user_settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own push subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.user_push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON public.user_push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own notification events
CREATE POLICY "Users can view their own notifications" ON public.notification_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notification_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access all notification events for cron jobs
CREATE POLICY "Service role can access all notifications" ON public.notification_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all subscriptions" ON public.user_push_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all settings" ON public.user_settings
    FOR ALL USING (auth.role() = 'service_role');