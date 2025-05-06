create table public.user_profiles (
  id uuid not null,
  full_name text not null,
  avatar_url text null,
  condition_tags text[] null,
  created_at timestamp with time zone null,
  email text null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
