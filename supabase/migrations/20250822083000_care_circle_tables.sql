-- Care Circle Tables and Policies Migration
-- This migration adds support for delegated access and care circle sharing

-- Create enum for member status
CREATE TYPE "public"."member_status" AS ENUM (
    'invited',
    'active', 
    'revoked',
    'expired'
);

-- Create enum for member role
CREATE TYPE "public"."member_role" AS ENUM (
    'viewer',
    'editor'
);

-- Create enum for action types in audit log
CREATE TYPE "public"."audit_action" AS ENUM (
    'create',
    'update', 
    'delete',
    'download',
    'view'
);

-- Create enum for resource types in audit log
CREATE TYPE "public"."audit_resource_type" AS ENUM (
    'medication',
    'appointment',
    'health_log',
    'document',
    'profile'
);

-- Care Circle Members table
CREATE TABLE IF NOT EXISTS "public"."care_circle_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "member_user_id" "uuid",
    "email" "text" NOT NULL,
    "role" "public"."member_role" DEFAULT 'viewer'::"public"."member_role" NOT NULL,
    "status" "public"."member_status" DEFAULT 'invited'::"public"."member_status" NOT NULL,
    "invite_token" "text",
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."care_circle_members" OWNER TO "postgres";

-- Access Grants table
CREATE TABLE IF NOT EXISTS "public"."access_grants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."access_grants" OWNER TO "postgres";

-- Audit Log table
CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    "action" "public"."audit_action" NOT NULL,
    "resource_type" "public"."audit_resource_type" NOT NULL,
    "resource_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."audit_log" OWNER TO "postgres";

-- ICE Tokens table (for emergency access)
CREATE TABLE IF NOT EXISTS "public"."ice_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "code_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."ice_tokens" OWNER TO "postgres";

-- Add primary keys
ALTER TABLE ONLY "public"."care_circle_members"
    ADD CONSTRAINT "care_circle_members_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ice_tokens"
    ADD CONSTRAINT "ice_tokens_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."care_circle_members"
    ADD CONSTRAINT "care_circle_members_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."care_circle_members"
    ADD CONSTRAINT "care_circle_members_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."access_grants"
    ADD CONSTRAINT "access_grants_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."care_circle_members"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."ice_tokens"
    ADD CONSTRAINT "ice_tokens_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX "care_circle_members_owner_id_idx" ON "public"."care_circle_members" USING "btree" ("owner_id");
CREATE INDEX "care_circle_members_member_user_id_idx" ON "public"."care_circle_members" USING "btree" ("member_user_id");
CREATE INDEX "care_circle_members_email_idx" ON "public"."care_circle_members" USING "btree" ("email");
CREATE INDEX "care_circle_members_status_idx" ON "public"."care_circle_members" USING "btree" ("status");

CREATE INDEX "access_grants_owner_id_idx" ON "public"."access_grants" USING "btree" ("owner_id");
CREATE INDEX "access_grants_member_id_idx" ON "public"."access_grants" USING "btree" ("member_id");
CREATE INDEX "access_grants_expires_at_idx" ON "public"."access_grants" USING "btree" ("expires_at");

CREATE INDEX "audit_log_owner_id_idx" ON "public"."audit_log" USING "btree" ("owner_id");
CREATE INDEX "audit_log_actor_user_id_idx" ON "public"."audit_log" USING "btree" ("actor_user_id");
CREATE INDEX "audit_log_created_at_idx" ON "public"."audit_log" USING "btree" ("created_at");
CREATE INDEX "audit_log_resource_type_idx" ON "public"."audit_log" USING "btree" ("resource_type");

CREATE INDEX "ice_tokens_owner_id_idx" ON "public"."ice_tokens" USING "btree" ("owner_id");
CREATE INDEX "ice_tokens_expires_at_idx" ON "public"."ice_tokens" USING "btree" ("expires_at");

-- Enable Row Level Security
ALTER TABLE "public"."care_circle_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."access_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ice_tokens" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for care_circle_members
CREATE POLICY "owners_can_manage_care_circle" ON "public"."care_circle_members"
    FOR ALL USING ("auth"."uid"() = "owner_id");

CREATE POLICY "members_can_view_own_membership" ON "public"."care_circle_members"
    FOR SELECT USING ("auth"."uid"() = "member_user_id");

-- RLS Policies for access_grants
CREATE POLICY "owners_can_manage_grants" ON "public"."access_grants"
    FOR ALL USING ("auth"."uid"() = "owner_id");

-- RLS Policies for audit_log
CREATE POLICY "owners_can_view_audit_log" ON "public"."audit_log"
    FOR SELECT USING ("auth"."uid"() = "owner_id");

-- RLS Policies for ice_tokens
CREATE POLICY "owners_can_manage_ice_tokens" ON "public"."ice_tokens"
    FOR ALL USING ("auth"."uid"() = "owner_id");

-- Grant permissions
GRANT ALL ON TABLE "public"."care_circle_members" TO "anon";
GRANT ALL ON TABLE "public"."care_circle_members" TO "authenticated";
GRANT ALL ON TABLE "public"."care_circle_members" TO "service_role";

GRANT ALL ON TABLE "public"."access_grants" TO "anon";
GRANT ALL ON TABLE "public"."access_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."access_grants" TO "service_role";

GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";

GRANT ALL ON TABLE "public"."ice_tokens" TO "anon";
GRANT ALL ON TABLE "public"."ice_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."ice_tokens" TO "service_role";

-- Add to realtime publication
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."care_circle_members";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."access_grants";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."audit_log";