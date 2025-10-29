-- User settings table for notification preferences
create table public.user_settings (
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

create index idx_user_settings_user_id on public.user_settings using btree (user_id) tablespace pg_default;