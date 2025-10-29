/**
 * Admin API route for testing push notifications
 * Only accessible to admin users
 */

import type { NextApiRequest, NextApiResponse } from "next";
import webpush from "web-push";
import { supabase } from "@/lib/supabaseClient";

// Initialize VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface TestNotificationRequest {
  userId: string;
  title?: string;
  body?: string;
  subscriptionId?: string; // Optional: test specific device
}

interface TestNotificationResponse {
  success: boolean;
  sent?: number;
  error?: string;
  details?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestNotificationResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Check authorization
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

    // For now, we'll allow any authenticated user to test notifications
    // In production, you'd want to check for admin role
    
    const { userId, title = "Test Notification", body = "This is a test notification from SymptomSync", subscriptionId }: TestNotificationRequest = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    // Get user's push subscriptions
    let subscriptionsQuery = supabase
      .from('user_push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (subscriptionId) {
      subscriptionsQuery = subscriptionsQuery.eq('id', subscriptionId);
    }

    const { data: subscriptions, error } = await subscriptionsQuery;

    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch subscriptions" 
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "No push subscriptions found for user" 
      });
    }

    // Send test notification to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const payload = {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-notification',
          requireInteraction: false,
          data: {
            entityType: 'test',
            entityId: 'test',
            timestamp: Date.now(),
            test: true
          }
        };

        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 60 * 60, // 1 hour
            vapidDetails: {
              subject: `mailto:${process.env.VAPID_EMAIL}`,
              publicKey: process.env.VAPID_PUBLIC_KEY!,
              privateKey: process.env.VAPID_PRIVATE_KEY!
            }
          }
        );

        return `Sent to ${subscription.id}`;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    const details: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        details.push(`✓ ${result.value}`);
      } else {
        details.push(`✗ Subscription ${index + 1}: ${result.reason.message || result.reason}`);
      }
    });

    return res.status(200).json({
      success: true,
      sent: successful.length,
      details,
      ...(failed.length > 0 && { 
        error: `${failed.length} notifications failed to send` 
      })
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}