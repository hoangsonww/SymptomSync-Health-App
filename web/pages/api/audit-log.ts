import type { NextApiRequest, NextApiResponse } from "next";
import { getAuditLog } from "@/lib/careCircle";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

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

    // Parse query parameters
    const { 
      resourceType, 
      startDate, 
      endDate, 
      limit 
    } = req.query;

    const params: {
      resourceType?: 'medication' | 'appointment' | 'health_log' | 'document' | 'profile';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {};
    
    if (resourceType && typeof resourceType === 'string') {
      const validResourceTypes = ['medication', 'appointment', 'health_log', 'document', 'profile'] as const;
      if (validResourceTypes.includes(resourceType as typeof validResourceTypes[number])) {
        params.resourceType = resourceType as typeof validResourceTypes[number];
      }
    }
    
    if (startDate && typeof startDate === 'string') {
      params.startDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string') {
      params.endDate = new Date(endDate);
    }
    
    if (limit && typeof limit === 'string') {
      params.limit = parseInt(limit, 10);
    }

    const auditLog = await getAuditLog(params);
    return res.status(200).json({ data: auditLog });
  } catch (error) {
    console.error('Audit log API error:', error);
    return res.status(500).json({ error: "Failed to fetch audit log" });
  }
}