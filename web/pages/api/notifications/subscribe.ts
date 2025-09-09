import type { NextApiRequest, NextApiResponse } from "next";
import webpush from "web-push";
import { supabase } from "@/lib/supabaseClient";

// Set VAPID details (will be set from environment variables)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface SubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

interface SubscribeResponse {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubscribeResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Get user from session (you might need to adjust this based on your auth setup)
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

    const { endpoint, keys, userAgent }: SubscribeRequest = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required subscription data" 
      });
    }

    // Upsert push subscription
    const { data, error } = await supabase
      .from("user_push_subscriptions")
      .upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent || null,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: "endpoint",
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error saving subscription:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to save subscription" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      subscriptionId: data.id 
    });

  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
}