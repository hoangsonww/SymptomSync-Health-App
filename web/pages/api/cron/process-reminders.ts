/**
 * API route for processing reminder notifications
 * Can be called by cron jobs or webhooks
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { processReminders } from "@/lib/reminderDispatch";

interface CronResponse {
  success: boolean;
  processed?: number;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  // Only allow POST requests for security
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed",
      timestamp: new Date().toISOString()
    });
  }

  // Basic API key protection (you should use a proper secret)
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const expectedApiKey = process.env.CRON_API_KEY;
  
  if (expectedApiKey && apiKey !== expectedApiKey) {
    return res.status(401).json({ 
      success: false, 
      error: "Unauthorized",
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('[CronAPI] Starting reminder processing...');
    
    await processReminders();
    
    console.log('[CronAPI] Reminder processing completed successfully');
    
    return res.status(200).json({ 
      success: true, 
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CronAPI] Error processing reminders:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}