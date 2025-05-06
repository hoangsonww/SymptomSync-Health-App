create table if not exists public.user_profiles (
  id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  condition_tags text[] default ARRAY[]::text[],
  created_at timestamptz default now(),
  primary key (id)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    condition_tags, 
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    ARRAY[]::text[],
    now()
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW 
EXECUTE PROCEDURE public.handle_new_user();
