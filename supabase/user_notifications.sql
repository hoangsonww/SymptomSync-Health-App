create table public.user_notifications (
  id uuid not null default gen_random_uuid (),
  user_profile_id text not null,
  reminder_id text not null,
  type text not null,
  title text not null,
  due_time timestamp with time zone not null,
  notified boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint user_notifications_pkey primary key (id)
) TABLESPACE pg_default;
