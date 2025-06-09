create table public.medication_reminders (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_profile_id uuid not null,
  medication_name text not null,
  dosage text null,
  reminder_time timestamp with time zone not null,
  recurrence text null,
  calendar_sync_token text null,
  created_at timestamp with time zone null default now(),
  notified boolean null default false,
  constraint medication_reminders_pkey primary key (id),
  constraint medication_reminders_user_profile_id_fkey foreign KEY (user_profile_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_medication_reminders_user_profile on public.medication_reminders using btree (user_profile_id) TABLESPACE pg_default;
