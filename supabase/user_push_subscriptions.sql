-- User push subscriptions for Web Push notifications
create table public.user_push_subscriptions (
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

create index idx_user_push_subscriptions_user_id on public.user_push_subscriptions using btree (user_id) tablespace pg_default;
create index idx_user_push_subscriptions_last_seen_at on public.user_push_subscriptions using btree (last_seen_at desc) tablespace pg_default;