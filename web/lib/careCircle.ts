import { supabase } from "./supabaseClient";
import { z } from "zod";

/**
 * Care Circle management functions for SymptomSync
 * Handles invitations, grants, and access control for shared health data
 */

// Zod schemas for type safety
export const MemberStatusSchema = z.enum(['invited', 'active', 'revoked', 'expired']);
export const MemberRoleSchema = z.enum(['viewer', 'editor']);
export const ScopeSchema = z.array(z.enum(['medications', 'appointments', 'health_logs', 'documents', 'profile']));

export const CareCircleMemberSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  member_user_id: z.string().nullable(),
  email: z.string().email(),
  role: MemberRoleSchema,
  status: MemberStatusSchema,
  invite_token: z.string().nullable(),
  invited_at: z.string(),
  accepted_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AccessGrantSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  member_id: z.string(),
  scopes: ScopeSchema,
  expires_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AuditLogSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  actor_user_id: z.string(),
  action: z.enum(['create', 'update', 'delete', 'download', 'view']),
  resource_type: z.enum(['medication', 'appointment', 'health_log', 'document', 'profile']),
  resource_id: z.string().nullable(),
  metadata: z.record(z.any()),
  created_at: z.string(),
});

export type CareCircleMember = z.infer<typeof CareCircleMemberSchema>;
export type AccessGrant = z.infer<typeof AccessGrantSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type MemberStatus = z.infer<typeof MemberStatusSchema>;
export type MemberRole = z.infer<typeof MemberRoleSchema>;
export type Scope = z.infer<typeof ScopeSchema>[number];

// Predefined scope bundles for common use cases
export const SCOPE_BUNDLES = {
  caregiver_basic: ['medications', 'appointments'] as Scope[],
  caregiver_full: ['medications', 'appointments', 'health_logs'] as Scope[],
  clinician_readonly: ['medications', 'appointments', 'health_logs', 'documents'] as Scope[],
  family_member: ['appointments', 'health_logs'] as Scope[],
  emergency_contact: ['medications', 'profile'] as Scope[],
} as const;

/**
 * Invite a new member to the care circle
 */
export async function inviteCareCircleMember(params: {
  email: string;
  role: MemberRole;
  scopes: Scope[];
  expiresAt: Date;
  personalMessage?: string;
}): Promise<CareCircleMember> {
  const { email, role, scopes, expiresAt } = params;
  
  // Generate a secure invite token
  const inviteToken = crypto.randomUUID();
  
  // Create the care circle member record
  const { data: member, error: memberError } = await supabase
    .from('care_circle_members')
    .insert({
      email,
      role,
      invite_token: inviteToken,
      status: 'invited',
    })
    .select()
    .single();

  if (memberError) throw memberError;

  // Create the access grant
  const { error: grantError } = await supabase
    .from('access_grants')
    .insert({
      owner_id: member.owner_id,
      member_id: member.id,
      scopes,
      expires_at: expiresAt.toISOString(),
    });

  if (grantError) throw grantError;

  // TODO: Send email invitation with magic link
  // await sendInviteEmail({ email, inviteToken, personalMessage });

  return CareCircleMemberSchema.parse(member);
}

/**
 * Accept a care circle invitation
 */
export async function acceptCareCircleInvite(inviteToken: string): Promise<CareCircleMember> {
  const { data: member, error } = await supabase
    .from('care_circle_members')
    .update({
      member_user_id: (await supabase.auth.getUser()).data.user?.id,
      status: 'active',
      accepted_at: new Date().toISOString(),
      invite_token: null, // Clear the token after use
    })
    .eq('invite_token', inviteToken)
    .eq('status', 'invited')
    .select()
    .single();

  if (error) throw error;
  if (!member) throw new Error('Invalid or expired invitation');

  return CareCircleMemberSchema.parse(member);
}

/**
 * Get all care circle members for the current user
 */
export async function getCareCircleMembers(): Promise<(CareCircleMember & { grant: AccessGrant })[]> {
  const { data, error } = await supabase
    .from('care_circle_members')
    .select(`
      *,
      access_grants!inner(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(item => ({
    ...CareCircleMemberSchema.parse(item),
    grant: AccessGrantSchema.parse(item.access_grants[0])
  }));
}

/**
 * Update a care circle member's role and/or grant
 */
export async function updateCareCircleMember(
  memberId: string,
  updates: {
    role?: MemberRole;
    scopes?: Scope[];
    expiresAt?: Date;
  }
): Promise<CareCircleMember> {
  const { role, scopes, expiresAt } = updates;

  // Update member role if provided
  if (role) {
    const { error: memberError } = await supabase
      .from('care_circle_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (memberError) throw memberError;
  }

  // Update grant if scopes or expiry provided
  if (scopes || expiresAt) {
    const updateData: {
      scopes?: Scope[];
      expires_at?: string;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (scopes) updateData.scopes = scopes;
    if (expiresAt) updateData.expires_at = expiresAt.toISOString();

    const { error: grantError } = await supabase
      .from('access_grants')
      .update(updateData)
      .eq('member_id', memberId);

    if (grantError) throw grantError;
  }

  // Return updated member
  const { data: member, error } = await supabase
    .from('care_circle_members')
    .select()
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return CareCircleMemberSchema.parse(member);
}

/**
 * Revoke access for a care circle member
 */
export async function revokeCareCircleMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('care_circle_members')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId);

  if (error) throw error;
}

/**
 * Get audit log entries for the current user
 */
export async function getAuditLog(params?: {
  resourceType?: AuditLog['resource_type'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.resourceType) {
    query = query.eq('resource_type', params.resourceType);
  }

  if (params?.startDate) {
    query = query.gte('created_at', params.startDate.toISOString());
  }

  if (params?.endDate) {
    query = query.lte('created_at', params.endDate.toISOString());
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return AuditLogSchema.array().parse(data);
}

/**
 * Check if current user has access to another user's data
 */
export async function checkUserAccess(
  targetUserId: string,
  scope: Scope,
  action: 'view' | 'create' | 'update' | 'delete' = 'view'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_has_access', {
    target_user_id: targetUserId,
    required_scope: scope,
    required_action: action,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Generate an emergency ICE (In Case of Emergency) code
 */
export async function generateICECode(): Promise<{ code: string; expiresAt: Date }> {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Hash the code before storing
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { error } = await supabase
    .from('ice_tokens')
    .insert({
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
    });

  if (error) throw error;

  return { code, expiresAt };
}

/**
 * Use an ICE code to get emergency access
 */
export async function useICECode(code: string, ownerId: string): Promise<boolean> {
  // Hash the provided code
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Check if code exists and is valid
  const { data: iceToken, error } = await supabase
    .from('ice_tokens')
    .select('*')
    .eq('code_hash', codeHash)
    .eq('owner_id', ownerId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !iceToken) return false;

  // Mark as used
  await supabase
    .from('ice_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', iceToken.id);

  return true;
}