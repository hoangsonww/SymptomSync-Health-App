

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."recurrence_freq" AS ENUM (
    'Daily',
    'Weekly',
    'Biweekly',
    'Monthly',
    'As Needed'
);


ALTER TYPE "public"."recurrence_freq" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public, auth'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_due_reminders"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  r            RECORD;
  window_start TIMESTAMPTZ := now() - INTERVAL '1 minute';
  window_end   TIMESTAMPTZ := now();
  rid          TEXT;
  next_ts      TIMESTAMPTZ;
  step         INTERVAL;
BEGIN
  -- ── APPOINTMENTS ───────────────────────────────────────────────────────────
  FOR r IN
    SELECT *
      FROM appointment_reminders
     WHERE date BETWEEN window_start AND window_end
       AND NOT EXISTS (
         SELECT 1
           FROM user_notifications
          WHERE reminder_id = 'appt-' || r.id
       )
  LOOP
    INSERT INTO user_notifications(
      user_profile_id,
      reminder_id,
      type,
      title,
      due_time,
      notified
    ) VALUES (
      r.user_profile_id,
      'appt-' || r.id,
      'appointment',
      r.appointment_name,
      r.date,
      true
    );
  END LOOP;

  -- ── MEDICATIONS ────────────────────────────────────────────────────────────
  FOR r IN
    SELECT *
      FROM medication_reminders
     WHERE reminder_time BETWEEN window_start AND window_end
  LOOP
    -- unique per‐occurrence key
    rid := 'med-' || r.id || '-' ||
           to_char(r.reminder_time AT TIME ZONE 'UTC','YYYYMMDDHH24MISS');

    IF NOT EXISTS (
      SELECT 1
        FROM user_notifications
       WHERE reminder_id = rid
    ) THEN
      INSERT INTO user_notifications(
        user_profile_id,
        reminder_id,
        type,
        title,
        due_time,
        notified
      ) VALUES (
        r.user_profile_id,
        rid,
        'medication',
        r.medication_name,
        r.reminder_time,
        true
      );
    END IF;

    -- bump to next occurrence if needed
    IF r.recurrence IS NOT NULL THEN
      CASE r.recurrence
        WHEN 'daily'    THEN step := '1 day'::interval;
        WHEN 'weekly'   THEN step := '1 week'::interval;
        WHEN 'biweekly' THEN step := '2 weeks'::interval;
        WHEN 'monthly'  THEN step := '1 month'::interval;
        ELSE                step := NULL;
      END CASE;

      IF step IS NOT NULL THEN
        next_ts := r.reminder_time + step;
        UPDATE medication_reminders
           SET reminder_time = next_ts
         WHERE id = r.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."notify_due_reminders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_notified_flag"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  /*
    Fire when:
      • row is inserted
      • appointment date changed
  */
  if TG_OP = 'INSERT'
     or NEW.date is distinct from OLD.date
  then
     NEW.notified := false;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."reset_notified_flag"() OWNER TO "postgres";


CREATE PROCEDURE "public"."send_due_reminders"()
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _now   timestamptz := now();
  _from  timestamptz := _now - interval '1 second';   -- 1-sec window
begin
  /* MEDICATIONS */
  insert into public.user_notifications (user_profile_id, title, body)
  select mr.user_profile_id,
         mr.medication_name,
         concat('Time to take ', mr.medication_name,
                coalesce(' ('||mr.dosage||')',''))
  from public.medication_reminders mr
  where mr.next_due_at  >  _from
    and mr.next_due_at <= _now;

  update public.medication_reminders mr
  set next_due_at = case lower(mr.recurrence::text)
                      when 'daily'     then mr.next_due_at + interval '1 day'
                      when 'weekly'    then mr.next_due_at + interval '1 week'
                      when 'biweekly'  then mr.next_due_at + interval '2 weeks'
                      when 'monthly'   then mr.next_due_at + interval '1 month'
                      else null
                    end
  where mr.next_due_at  >  _from
    and mr.next_due_at <= _now;

  /* APPOINTMENTS */
  insert into public.user_notifications (user_profile_id, title, body)
  select ar.user_profile_id,
         ar.appointment_name,
         concat('Appointment now: ', ar.appointment_name)
  from public.appointment_reminders ar
  where ar.date  >  _from
    and ar.date <= _now
    and not ar.notified;

  update public.appointment_reminders
  set notified = true
  where date  >  _from
    and date <= _now
    and not notified;
end;
$$;


ALTER PROCEDURE "public"."send_due_reminders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_next_due_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  /*
    Fire when:
      • row is inserted
      • reminder_time actually changed
      • next_due_at is NULL (non-recurring dose already fired, user edits it)
  */
  if TG_OP = 'INSERT'
     or NEW.reminder_time is distinct from OLD.reminder_time
     or NEW.next_due_at is null
  then
     NEW.next_due_at := NEW.reminder_time;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_next_due_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointment_reminders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "appointment_name" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"(),
    "notified" boolean DEFAULT false
);


ALTER TABLE "public"."appointment_reminders" OWNER TO "postgres";


COMMENT ON TABLE "public"."appointment_reminders" IS 'This is a duplicate of medication_reminders';



CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "room_id" "text" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "url" "text" NOT NULL,
    "file_type" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "symptom_type" "text",
    "severity" integer,
    "mood" "text",
    "vitals" "jsonb",
    "medication_intake" "text",
    "notes" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone
);


ALTER TABLE "public"."health_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medication_reminders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "medication_name" "text" NOT NULL,
    "dosage" "text",
    "reminder_time" timestamp with time zone NOT NULL,
    "recurrence" "public"."recurrence_freq" DEFAULT 'As Needed'::"public"."recurrence_freq",
    "calendar_sync_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notified" boolean DEFAULT false,
    "next_due_at" timestamp with time zone
);


ALTER TABLE "public"."medication_reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "condition_tags" "text"[],
    "created_at" timestamp with time zone,
    "email" "text"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointment_reminders"
    ADD CONSTRAINT "appointment_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_logs"
    ADD CONSTRAINT "health_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_reminders"
    ADD CONSTRAINT "medication_reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "appointment_reminders_user_profile_id_idx" ON "public"."appointment_reminders" USING "btree" ("user_profile_id");



CREATE INDEX "idx_appt_due" ON "public"."appointment_reminders" USING "btree" ("date");



CREATE INDEX "idx_chat_messages_user_profile" ON "public"."chat_messages" USING "btree" ("user_profile_id");



CREATE INDEX "idx_files_user_profile" ON "public"."files" USING "btree" ("user_profile_id");



CREATE INDEX "idx_health_logs_user_profile" ON "public"."health_logs" USING "btree" ("user_profile_id");



CREATE INDEX "idx_medication_next_due" ON "public"."medication_reminders" USING "btree" ("next_due_at");



CREATE INDEX "idx_medication_reminders_user_profile" ON "public"."medication_reminders" USING "btree" ("user_profile_id");



CREATE INDEX "idx_user_notifications_user" ON "public"."user_notifications" USING "btree" ("user_profile_id");



CREATE OR REPLACE TRIGGER "trg_reset_notified" BEFORE INSERT OR UPDATE ON "public"."appointment_reminders" FOR EACH ROW EXECUTE FUNCTION "public"."reset_notified_flag"();



CREATE OR REPLACE TRIGGER "trg_set_next_due_at" BEFORE INSERT OR UPDATE ON "public"."medication_reminders" FOR EACH ROW EXECUTE FUNCTION "public"."set_next_due_at"();



ALTER TABLE ONLY "public"."appointment_reminders"
    ADD CONSTRAINT "appointment_reminders_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_logs"
    ADD CONSTRAINT "health_logs_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_reminders"
    ADD CONSTRAINT "medication_reminders_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."appointment_reminders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appt_policy" ON "public"."appointment_reminders" TO "authenticated" USING (("auth"."uid"() = "user_profile_id")) WITH CHECK (("auth"."uid"() = "user_profile_id"));



CREATE POLICY "chat-policy" ON "public"."chat_messages" TO "authenticated" USING (("auth"."uid"() = "user_profile_id")) WITH CHECK (("auth"."uid"() = "user_profile_id"));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "files_policy" ON "public"."files" TO "authenticated" USING (("auth"."uid"() = "user_profile_id")) WITH CHECK (("auth"."uid"() = "user_profile_id"));



ALTER TABLE "public"."health_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logs_policy" ON "public"."health_logs" TO "authenticated" USING (("auth"."uid"() = "user_profile_id")) WITH CHECK (("auth"."uid"() = "user_profile_id"));



ALTER TABLE "public"."medication_reminders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meds_policy" ON "public"."medication_reminders" TO "authenticated" USING (("auth"."uid"() = "user_profile_id")) WITH CHECK (("auth"."uid"() = "user_profile_id"));



CREATE POLICY "only owner can read" ON "public"."user_notifications" FOR SELECT USING (("auth"."uid"() = "user_profile_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."appointment_reminders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."files";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."health_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."medication_reminders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_profiles";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_due_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_due_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_due_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_notified_flag"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_notified_flag"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_notified_flag"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."send_due_reminders"() TO "anon";
GRANT ALL ON PROCEDURE "public"."send_due_reminders"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."send_due_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_next_due_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_next_due_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_next_due_at"() TO "service_role";
























GRANT ALL ON TABLE "public"."appointment_reminders" TO "anon";
GRANT ALL ON TABLE "public"."appointment_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."health_logs" TO "anon";
GRANT ALL ON TABLE "public"."health_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."health_logs" TO "service_role";



GRANT ALL ON TABLE "public"."medication_reminders" TO "anon";
GRANT ALL ON TABLE "public"."medication_reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_reminders" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "anon";
GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
