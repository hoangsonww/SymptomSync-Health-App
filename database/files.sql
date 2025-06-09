create table public.files (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_profile_id uuid not null,
  filename text not null,
  url text not null,
  file_type text null,
  uploaded_at timestamp with time zone null default now(),
  tags text[] null default '{}'::text[],
  constraint files_pkey primary key (id),
  constraint files_user_profile_id_fkey foreign KEY (user_profile_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_files_user_profile on public.files using btree (user_profile_id) TABLESPACE pg_default;
