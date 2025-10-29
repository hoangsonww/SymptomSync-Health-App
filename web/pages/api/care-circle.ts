import type { NextApiRequest, NextApiResponse } from "next";
import { 
  inviteCareCircleMember, 
  acceptCareCircleInvite, 
  getCareCircleMembers,
  updateCareCircleMember,
  revokeCareCircleMember,
  MemberRole,
  Scope,
} from "@/lib/careCircle";

type InviteRequest = {
  email: string;
  role: MemberRole;
  scopes: Scope[];
  expiresAt: string;
  personalMessage?: string;
};

type UpdateRequest = {
  role?: MemberRole;
  scopes?: Scope[];
  expiresAt?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    // Create a new Supabase client with the token
    const token = authHeader.replace('Bearer ', '');
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Care circle API error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const members = await getCareCircleMembers();
    return res.status(200).json({ data: members });
  } catch (error) {
    console.error('Error fetching care circle members:', error);
    return res.status(500).json({ error: "Failed to fetch care circle members" });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  if (action === 'invite') {
    return handleInvite(req, res);
  } else if (action === 'accept') {
    return handleAcceptInvite(req, res);
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }
}

async function handleInvite(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, role, scopes, expiresAt, personalMessage }: InviteRequest = req.body;

    // Validate required fields
    if (!email || !role || !scopes || !expiresAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate role
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Validate scopes
    const validScopes = ['medications', 'appointments', 'health_logs', 'documents', 'profile'];
    if (!Array.isArray(scopes) || !scopes.every(scope => validScopes.includes(scope))) {
      return res.status(400).json({ error: "Invalid scopes" });
    }

    const member = await inviteCareCircleMember({
      email,
      role,
      scopes,
      expiresAt: new Date(expiresAt),
      personalMessage,
    });

    return res.status(201).json({ data: member });
  } catch (error) {
    console.error('Error inviting care circle member:', error);
    return res.status(500).json({ error: "Failed to send invitation" });
  }
}

async function handleAcceptInvite(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { inviteToken } = req.body;

    if (!inviteToken) {
      return res.status(400).json({ error: "Invite token is required" });
    }

    const member = await acceptCareCircleInvite(inviteToken);
    return res.status(200).json({ data: member });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({ error: "Failed to accept invitation" });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { memberId } = req.query;
    
    if (!memberId || typeof memberId !== 'string') {
      return res.status(400).json({ error: "Member ID is required" });
    }

    const { role, scopes, expiresAt }: UpdateRequest = req.body;

    // Validate role if provided
    if (role && !['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Validate scopes if provided
    if (scopes) {
      const validScopes = ['medications', 'appointments', 'health_logs', 'documents', 'profile'];
      if (!Array.isArray(scopes) || !scopes.every(scope => validScopes.includes(scope))) {
        return res.status(400).json({ error: "Invalid scopes" });
      }
    }

    const updates: {
      role?: MemberRole;
      scopes?: Scope[];
      expiresAt?: Date;
    } = {};
    if (role) updates.role = role;
    if (scopes) updates.scopes = scopes;
    if (expiresAt) updates.expiresAt = new Date(expiresAt);

    const member = await updateCareCircleMember(memberId, updates);
    return res.status(200).json({ data: member });
  } catch (error) {
    console.error('Error updating care circle member:', error);
    return res.status(500).json({ error: "Failed to update member" });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { memberId } = req.query;
    
    if (!memberId || typeof memberId !== 'string') {
      return res.status(400).json({ error: "Member ID is required" });
    }

    await revokeCareCircleMember(memberId);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error revoking care circle member:', error);
    return res.status(500).json({ error: "Failed to revoke member" });
  }
}