import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

interface UnsubscribeRequest {
  endpoint: string;
}

interface UnsubscribeResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnsubscribeResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Get user from session
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    const { endpoint }: UnsubscribeRequest = req.body;

    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing endpoint" 
      });
    }

    // Delete push subscription
    const { error } = await supabase
      .from("user_push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting subscription:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to delete subscription" 
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Unsubscribe error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
}