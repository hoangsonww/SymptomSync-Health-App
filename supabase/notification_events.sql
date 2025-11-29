-- Notification events for tracking push notifications
create table public.notification_events (
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

create index idx_notification_events_user_id_scheduled_at on public.notification_events using btree (user_id, scheduled_at) tablespace pg_default;
create index idx_notification_events_status on public.notification_events using btree (status) tablespace pg_default;
create index idx_notification_events_entity on public.notification_events using btree (entity_type, entity_id) tablespace pg_default;