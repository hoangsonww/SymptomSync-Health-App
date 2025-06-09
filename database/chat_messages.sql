create table public.chat_messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_profile_id uuid not null,
  room_id text not null,
  message text not null,
  created_at timestamp with time zone null default now(),
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_user_profile_id_fkey foreign KEY (user_profile_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_messages_user_profile on public.chat_messages using btree (user_profile_id) TABLESPACE pg_default;
