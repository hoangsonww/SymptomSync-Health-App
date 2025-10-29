-- Update RLS policies to support Care Circle delegated access
-- This migration updates existing policies to check for care circle grants

-- Drop existing policies and recreate with care circle support

-- Medication Reminders policies
DROP POLICY IF EXISTS "meds_policy" ON "public"."medication_reminders";

CREATE POLICY "medication_select_policy" ON "public"."medication_reminders"
    FOR SELECT USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'medications', 'view')
    );

CREATE POLICY "medication_insert_policy" ON "public"."medication_reminders"
    FOR INSERT WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'medications', 'create')
    );

CREATE POLICY "medication_update_policy" ON "public"."medication_reminders"
    FOR UPDATE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'medications', 'update')
    ) WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'medications', 'update')
    );

CREATE POLICY "medication_delete_policy" ON "public"."medication_reminders"
    FOR DELETE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'medications', 'delete')
    );

-- Appointment Reminders policies
-- Note: The existing schema doesn't show specific policies, so we'll create comprehensive ones
CREATE POLICY "appointment_select_policy" ON "public"."appointment_reminders"
    FOR SELECT USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'appointments', 'view')
    );

CREATE POLICY "appointment_insert_policy" ON "public"."appointment_reminders"
    FOR INSERT WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'appointments', 'create')
    );

CREATE POLICY "appointment_update_policy" ON "public"."appointment_reminders"
    FOR UPDATE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'appointments', 'update')
    ) WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'appointments', 'update')
    );

CREATE POLICY "appointment_delete_policy" ON "public"."appointment_reminders"
    FOR DELETE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'appointments', 'delete')
    );

-- Health Logs policies
CREATE POLICY "health_logs_select_policy" ON "public"."health_logs"
    FOR SELECT USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'health_logs', 'view')
    );

CREATE POLICY "health_logs_insert_policy" ON "public"."health_logs"
    FOR INSERT WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'health_logs', 'create')
    );

CREATE POLICY "health_logs_update_policy" ON "public"."health_logs"
    FOR UPDATE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'health_logs', 'update')
    ) WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'health_logs', 'update')
    );

CREATE POLICY "health_logs_delete_policy" ON "public"."health_logs"
    FOR DELETE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'health_logs', 'delete')
    );

-- Files policies  
CREATE POLICY "files_select_policy" ON "public"."files"
    FOR SELECT USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'documents', 'view')
    );

CREATE POLICY "files_insert_policy" ON "public"."files"
    FOR INSERT WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'documents', 'create')
    );

CREATE POLICY "files_update_policy" ON "public"."files"
    FOR UPDATE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'documents', 'update')
    ) WITH CHECK (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'documents', 'update')
    );

CREATE POLICY "files_delete_policy" ON "public"."files"
    FOR DELETE USING (
        "auth"."uid"() = "user_profile_id" OR 
        "public"."user_has_access"("user_profile_id", 'documents', 'delete')
    );

-- User Profiles policies (limited access for care circle members)
CREATE POLICY "profiles_select_policy" ON "public"."user_profiles"
    FOR SELECT USING (
        "auth"."uid"() = "id" OR 
        "public"."user_has_access"("id", 'profile', 'view')
    );

-- Profile updates should only be allowed by the owner
CREATE POLICY "profiles_update_policy" ON "public"."user_profiles"
    FOR UPDATE USING ("auth"."uid"() = "id") 
    WITH CHECK ("auth"."uid"() = "id");

-- User Notifications - update existing policy name for consistency
DROP POLICY IF EXISTS "only owner can read" ON "public"."user_notifications";

CREATE POLICY "notifications_select_policy" ON "public"."user_notifications"
    FOR SELECT USING ("auth"."uid"() = "user_profile_id");

-- Chat Messages - keep owner-only access for privacy
CREATE POLICY "chat_messages_policy" ON "public"."chat_messages"
    FOR ALL USING ("auth"."uid"() = "user_profile_id")
    WITH CHECK ("auth"."uid"() = "user_profile_id");