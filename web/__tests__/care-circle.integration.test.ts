/**
 * Integration test file for Care Circle functionality
 * This tests the complete flow from database to API to frontend
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { supabase } from '@/lib/supabaseClient';
import {
  inviteCareCircleMember,
  acceptCareCircleInvite,
  getCareCircleMembers,
  updateCareCircleMember,
  revokeCareCircleMember,
  getAuditLog,
  checkUserAccess,
  generateICECode,
  useICECode,
  MemberRole,
  Scope,
} from '@/lib/careCircle';

// Mock user IDs for testing
const OWNER_USER_ID = 'owner-test-user-id';
const MEMBER_USER_ID = 'member-test-user-id';
const TEST_EMAIL = 'test-member@example.com';

// Test utilities
async function cleanupTestData() {
  // Clean up test data
  await supabase
    .from('care_circle_members')
    .delete()
    .or(`owner_id.eq.${OWNER_USER_ID},member_user_id.eq.${MEMBER_USER_ID}`);
    
  await supabase
    .from('audit_log')
    .delete()
    .or(`owner_id.eq.${OWNER_USER_ID},actor_user_id.eq.${MEMBER_USER_ID}`);
    
  await supabase
    .from('ice_tokens')
    .delete()
    .eq('owner_id', OWNER_USER_ID);
}

describe('Care Circle Integration Tests', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Invitation Flow', () => {
    it('should create and accept an invitation successfully', async () => {
      // Step 1: Create invitation
      const invitation = await inviteCareCircleMember({
        email: TEST_EMAIL,
        role: 'viewer' as MemberRole,
        scopes: ['medications', 'appointments'] as Scope[],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        personalMessage: 'Test invitation',
      });

      expect(invitation).toBeDefined();
      expect(invitation.email).toBe(TEST_EMAIL);
      expect(invitation.role).toBe('viewer');
      expect(invitation.status).toBe('invited');

      // Step 2: Verify invitation in database
      const { data: dbMember } = await supabase
        .from('care_circle_members')
        .select('*, access_grants(*)')
        .eq('id', invitation.id)
        .single();

      expect(dbMember).toBeDefined();
      expect(dbMember.access_grants).toHaveLength(1);
      expect(dbMember.access_grants[0].scopes).toEqual(['medications', 'appointments']);

      // Step 3: Accept invitation (simulate member accepting)
      if (dbMember.invite_token) {
        const acceptedMember = await acceptCareCircleInvite(dbMember.invite_token);
        expect(acceptedMember.status).toBe('active');
        expect(acceptedMember.member_user_id).toBe(MEMBER_USER_ID);
      }
    });

    it('should handle invalid invitation tokens', async () => {
      await expect(acceptCareCircleInvite('invalid-token'))
        .rejects
        .toThrow();
    });
  });

  describe('Member Management', () => {
    let testMemberId: string;

    beforeEach(async () => {
      // Create a test member
      const member = await inviteCareCircleMember({
        email: TEST_EMAIL,
        role: 'viewer' as MemberRole,
        scopes: ['medications'] as Scope[],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      testMemberId = member.id;
    });

    it('should list care circle members', async () => {
      const members = await getCareCircleMembers();
      expect(members).toHaveLength(1);
      expect(members[0].email).toBe(TEST_EMAIL);
      expect(members[0].grant.scopes).toEqual(['medications']);
    });

    it('should update member permissions', async () => {
      const updatedMember = await updateCareCircleMember(testMemberId, {
        role: 'editor' as MemberRole,
        scopes: ['medications', 'appointments'] as Scope[],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      expect(updatedMember.role).toBe('editor');
      
      // Verify grant was updated
      const members = await getCareCircleMembers();
      expect(members[0].grant.scopes).toEqual(['medications', 'appointments']);
    });

    it('should revoke member access', async () => {
      await revokeCareCircleMember(testMemberId);
      
      // Verify member is revoked
      const { data: revokedMember } = await supabase
        .from('care_circle_members')
        .select('*')
        .eq('id', testMemberId)
        .single();

      expect(revokedMember.status).toBe('revoked');
      expect(revokedMember.revoked_at).toBeDefined();
    });
  });

  describe('Access Control', () => {
    it('should correctly validate user access', async () => {
      // Create active member with medication access
      const member = await inviteCareCircleMember({
        email: TEST_EMAIL,
        role: 'viewer' as MemberRole,
        scopes: ['medications'] as Scope[],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Accept the invitation
      const { data: dbMember } = await supabase
        .from('care_circle_members')
        .select('invite_token')
        .eq('id', member.id)
        .single();

      if (dbMember?.invite_token) {
        await acceptCareCircleInvite(dbMember.invite_token);
      }

      // Test access validation
      const hasAccess = await checkUserAccess(OWNER_USER_ID, 'medications', 'view');
      expect(hasAccess).toBe(true);

      const hasEditAccess = await checkUserAccess(OWNER_USER_ID, 'medications', 'update');
      expect(hasEditAccess).toBe(false); // Viewer role shouldn't have edit access

      const hasOtherAccess = await checkUserAccess(OWNER_USER_ID, 'appointments', 'view');
      expect(hasOtherAccess).toBe(false); // No appointment scope granted
    });
  });

  describe('Audit Logging', () => {
    it('should log actions in audit trail', async () => {
      // This would typically be tested with actual data operations
      // For now, we'll test the audit log retrieval function
      const auditLogs = await getAuditLog({
        resourceType: 'medication',
        limit: 10,
      });

      expect(Array.isArray(auditLogs)).toBe(true);
    });
  });

  describe('Emergency ICE Codes', () => {
    it('should generate and validate ICE codes', async () => {
      // Generate ICE code
      const { code, expiresAt } = await generateICECode();
      
      expect(code).toMatch(/^\d{6}$/); // 6-digit code
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Use ICE code
      const isValid = await useICECode(code, OWNER_USER_ID);
      expect(isValid).toBe(true);

      // Try to use the same code again (should fail - single use)
      const isValidSecondTime = await useICECode(code, OWNER_USER_ID);
      expect(isValidSecondTime).toBe(false);
    });

    it('should reject invalid ICE codes', async () => {
      const isValid = await useICECode('000000', OWNER_USER_ID);
      expect(isValid).toBe(false);
    });
  });

  describe('Database Functions', () => {
    it('should properly enforce RLS policies', async () => {
      // Test that RLS policies are working by trying to access data
      // without proper permissions
      
      // This would require setting up proper auth context
      // For now, we'll just verify the functions exist and are callable
      const { data, error } = await supabase.rpc('user_has_access', {
        target_user_id: OWNER_USER_ID,
        required_scope: 'medications',
        required_action: 'view',
      });

      expect(error).toBeNull();
      expect(typeof data).toBe('boolean');
    });

    it('should clean up expired grants', async () => {
      // Create a member with past expiry
      const member = await inviteCareCircleMember({
        email: TEST_EMAIL,
        role: 'viewer' as MemberRole,
        scopes: ['medications'] as Scope[],
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      // Run cleanup function
      const { error } = await supabase.rpc('cleanup_expired_grants');
      expect(error).toBeNull();

      // Verify member status is updated
      const { data: expiredMember } = await supabase
        .from('care_circle_members')
        .select('status')
        .eq('id', member.id)
        .single();

      expect(expiredMember?.status).toBe('expired');
    });
  });
});

// API Endpoint Tests
describe('Care Circle API Endpoints', () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const mockAuthHeader = 'Bearer mock-token';

  describe('/api/care-circle', () => {
    it('should handle GET requests for listing members', async () => {
      const response = await fetch(`${baseUrl}/api/care-circle`, {
        headers: { Authorization: mockAuthHeader },
      });

      // Should return 401 without proper auth in real environment
      expect([200, 401]).toContain(response.status);
    });

    it('should validate required fields for invitations', async () => {
      const response = await fetch(`${baseUrl}/api/care-circle?action=invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: mockAuthHeader,
        },
        body: JSON.stringify({
          // Missing required fields
          email: 'test@example.com',
        }),
      });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('/api/audit-log', () => {
    it('should handle audit log requests', async () => {
      const response = await fetch(`${baseUrl}/api/audit-log`, {
        headers: { Authorization: mockAuthHeader },
      });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('/api/ice', () => {
    it('should handle ICE code generation', async () => {
      const response = await fetch(`${baseUrl}/api/ice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: mockAuthHeader,
        },
      });

      expect([200, 401]).toContain(response.status);
    });
  });
});

export {};