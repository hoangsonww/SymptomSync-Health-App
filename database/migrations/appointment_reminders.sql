create table public.appointment_reminders (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_profile_id uuid not null,
  appointment_name text not null,
  date timestamp with time zone null default now(),
  notified boolean null default false,
  constraint appointment_reminders_pkey primary key (id),
  constraint appointment_reminders_user_profile_id_fkey foreign KEY (user_profile_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists appointment_reminders_user_profile_id_idx on public.appointment_reminders using btree (user_profile_id) TABLESPACE pg_default;
