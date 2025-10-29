-- Audit logging triggers for care circle access
-- These triggers automatically log actions for audit trail

-- Function to handle audit logging on data changes
CREATE OR REPLACE FUNCTION "public"."handle_audit_logging"()
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    owner_user_id uuid;
    action_type public.audit_action;
    resource_type public.audit_resource_type;
    resource_id_val uuid;
    metadata_val jsonb := '{}';
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        owner_user_id := NEW.user_profile_id;
        resource_id_val := NEW.id;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        owner_user_id := NEW.user_profile_id;
        resource_id_val := NEW.id;
        -- Add what changed to metadata
        metadata_val := jsonb_build_object('changes', to_jsonb(NEW) - to_jsonb(OLD));
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        owner_user_id := OLD.user_profile_id;
        resource_id_val := OLD.id;
        metadata_val := to_jsonb(OLD);
    END IF;
    
    -- Determine resource type based on table
    CASE TG_TABLE_NAME
        WHEN 'medication_reminders' THEN resource_type := 'medication';
        WHEN 'appointment_reminders' THEN resource_type := 'appointment';
        WHEN 'health_logs' THEN resource_type := 'health_log';
        WHEN 'files' THEN resource_type := 'document';
        WHEN 'user_profiles' THEN resource_type := 'profile';
        ELSE resource_type := 'medication'; -- fallback
    END CASE;
    
    -- Only log if this is a delegated access (not the owner)
    IF auth.uid() != owner_user_id THEN
        PERFORM public.log_audit_event(
            owner_user_id,
            action_type,
            resource_type,
            resource_id_val,
            metadata_val
        );
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create audit triggers for each table
CREATE TRIGGER "medication_reminders_audit_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."medication_reminders"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_audit_logging"();

CREATE TRIGGER "appointment_reminders_audit_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."appointment_reminders"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_audit_logging"();

CREATE TRIGGER "health_logs_audit_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."health_logs"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_audit_logging"();

CREATE TRIGGER "files_audit_trigger"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."files"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_audit_logging"();

CREATE TRIGGER "user_profiles_audit_trigger"
    AFTER UPDATE ON "public"."user_profiles"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_audit_logging"();

-- Function to handle file downloads (to be called from API)
CREATE OR REPLACE FUNCTION "public"."log_file_download"(
    file_id uuid
) RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    file_record record;
BEGIN
    -- Get file details
    SELECT user_profile_id, filename INTO file_record
    FROM public.files
    WHERE id = file_id;
    
    IF FOUND THEN
        PERFORM public.log_audit_event(
            file_record.user_profile_id,
            'download',
            'document',
            file_id,
            jsonb_build_object('filename', file_record.filename)
        );
    END IF;
END;
$$;

-- Function to create notification for owner when care circle member makes changes
CREATE OR REPLACE FUNCTION "public"."notify_owner_of_changes"()
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    owner_user_id uuid;
    actor_name text;
    resource_name text;
    notification_title text;
    notification_body text;
BEGIN
    -- Only proceed if this is a delegated action
    IF auth.uid() = NEW.user_profile_id THEN
        RETURN NEW;
    END IF;
    
    owner_user_id := NEW.user_profile_id;
    
    -- Get actor name
    SELECT full_name INTO actor_name
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    -- Determine resource name and notification content
    CASE TG_TABLE_NAME
        WHEN 'medication_reminders' THEN 
            resource_name := NEW.medication_name;
            notification_title := 'Medication Updated';
            notification_body := format('%s updated medication: %s', COALESCE(actor_name, 'A care circle member'), resource_name);
        WHEN 'appointment_reminders' THEN
            resource_name := NEW.appointment_name;
            notification_title := 'Appointment Updated';
            notification_body := format('%s updated appointment: %s', COALESCE(actor_name, 'A care circle member'), resource_name);
        WHEN 'health_logs' THEN
            resource_name := COALESCE(NEW.symptom_type, 'Health log');
            notification_title := 'Health Log Updated';
            notification_body := format('%s updated a health log entry', COALESCE(actor_name, 'A care circle member'));
        ELSE
            RETURN NEW;
    END CASE;
    
    -- Insert notification
    INSERT INTO public.user_notifications (
        user_profile_id,
        title,
        body
    ) VALUES (
        owner_user_id,
        notification_title,
        notification_body
    );
    
    RETURN NEW;
END;
$$;

-- Create notification triggers for updates only
CREATE TRIGGER "medication_reminders_notify_trigger"
    AFTER UPDATE ON "public"."medication_reminders"
    FOR EACH ROW EXECUTE FUNCTION "public"."notify_owner_of_changes"();

CREATE TRIGGER "appointment_reminders_notify_trigger"
    AFTER UPDATE ON "public"."appointment_reminders"
    FOR EACH ROW EXECUTE FUNCTION "public"."notify_owner_of_changes"();

CREATE TRIGGER "health_logs_notify_trigger"
    AFTER UPDATE ON "public"."health_logs"
    FOR EACH ROW EXECUTE FUNCTION "public"."notify_owner_of_changes"();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION "public"."handle_audit_logging" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."log_file_download" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."notify_owner_of_changes" TO "authenticated";