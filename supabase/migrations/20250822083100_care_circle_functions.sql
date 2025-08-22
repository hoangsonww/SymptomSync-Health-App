-- Care Circle Access Control Functions
-- These functions help enforce delegated access control

-- Function to check if user has access to another user's data
CREATE OR REPLACE FUNCTION "public"."user_has_access"(
    target_user_id "uuid",
    required_scope "text",
    required_action "text" DEFAULT 'view'
) RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    has_access boolean := false;
    member_record record;
    grant_record record;
BEGIN
    -- Get current authenticated user
    current_user_id := "auth"."uid"();
    
    -- If no user is authenticated, deny access
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- If user is accessing their own data, allow
    IF current_user_id = target_user_id THEN
        RETURN true;
    END IF;
    
    -- Check if user has an active care circle membership with valid grants
    SELECT ccm.*, ag.scopes, ag.expires_at
    INTO member_record
    FROM "public"."care_circle_members" ccm
    JOIN "public"."access_grants" ag ON ag.member_id = ccm.id
    WHERE ccm.owner_id = target_user_id
      AND ccm.member_user_id = current_user_id  
      AND ccm.status = 'active'
      AND ag.expires_at > now()
      AND required_scope = ANY(ag.scopes);
    
    -- If we found a valid grant, check action permissions
    IF FOUND THEN
        -- Viewers can only view, editors can view and modify
        IF required_action = 'view' OR (required_action IN ('create', 'update', 'delete') AND member_record.role = 'editor') THEN
            has_access := true;
        END IF;
    END IF;
    
    RETURN has_access;
END;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION "public"."log_audit_event"(
    owner_id "uuid",
    action_type "public"."audit_action",
    resource_type "public"."audit_resource_type", 
    resource_id "uuid" DEFAULT NULL,
    metadata "jsonb" DEFAULT '{}'::jsonb
) RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    audit_id uuid;
BEGIN
    current_user_id := "auth"."uid"();
    
    -- Only log if we have an authenticated user
    IF current_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO "public"."audit_log" (
        owner_id,
        actor_user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        owner_id,
        current_user_id,
        action_type,
        resource_type,
        resource_id,
        metadata
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- Function to clean up expired grants and memberships
CREATE OR REPLACE FUNCTION "public"."cleanup_expired_grants"()
RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    -- Mark care circle members as expired if their grants have expired
    UPDATE "public"."care_circle_members" 
    SET status = 'expired', updated_at = now()
    WHERE id IN (
        SELECT ccm.id 
        FROM "public"."care_circle_members" ccm
        JOIN "public"."access_grants" ag ON ag.member_id = ccm.id
        WHERE ccm.status = 'active' 
          AND ag.expires_at <= now()
    );
    
    -- Clean up old ICE tokens
    DELETE FROM "public"."ice_tokens" 
    WHERE expires_at <= now() - interval '1 day';
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION "public"."user_has_access" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."log_audit_event" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."cleanup_expired_grants" TO "service_role";