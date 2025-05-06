create table public.health_logs (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_profile_id uuid not null,
  symptom_type text null,
  severity integer null,
  mood text null,
  vitals jsonb null,
  medication_intake text null,
  notes text null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone null,
  constraint health_logs_pkey primary key (id),
  constraint health_logs_user_profile_id_fkey foreign KEY (user_profile_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_health_logs_user_profile on public.health_logs using btree (user_profile_id) TABLESPACE pg_default;
