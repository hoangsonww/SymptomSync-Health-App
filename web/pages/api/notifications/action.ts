import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

interface ActionRequest {
  type: 'taken' | 'snooze' | 'dismiss';
  entityType: 'medication' | 'appointment';
  entityId: string;
  context?: {
    snoozeMinutes?: number;
    notificationEventId?: string;
  };
}

interface ActionResponse {
  success: boolean;
  error?: string;
  nextFireAt?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ActionResponse>
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

    const { type, entityType, entityId, context }: ActionRequest = req.body;

    if (!type || !entityType || !entityId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required action data" 
      });
    }

    // Update notification event status if provided
    if (context?.notificationEventId) {
      await supabase
        .from("notification_events")
        .update({ status: 'clicked' })
        .eq("id", context.notificationEventId)
        .eq("user_id", user.id);
    }

    let nextFireAt: string | undefined;

    switch (type) {
      case 'taken':
        if (entityType === 'medication') {
          // Mark medication as taken and schedule next dose
          const { data: medData } = await supabase
            .from("medication_reminders")
            .select('*')
            .eq("id", entityId)
            .eq("user_profile_id", user.id)
            .single();

          if (medData) {
            // Create adherence record (you might need to create this table)
            // For now, just update the reminder as notified
            await supabase
              .from("medication_reminders")
              .update({ 
                notified: true,
                // Calculate next reminder time based on recurrence
                // This is simplified - you'd want more sophisticated scheduling
              })
              .eq("id", entityId)
              .eq("user_profile_id", user.id);
          }
        }
        break;

      case 'snooze':
        const snoozeMinutes = context?.snoozeMinutes || 10;
        const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
        
        if (entityType === 'medication') {
          const { data: updateData } = await supabase
            .from("medication_reminders")
            .update({ 
              reminder_time: snoozeUntil.toISOString()
            })
            .eq("id", entityId)
            .eq("user_profile_id", user.id)
            .select('reminder_time')
            .single();
          
          nextFireAt = updateData?.reminder_time;
        } else if (entityType === 'appointment') {
          const { data: updateData } = await supabase
            .from("appointment_reminders")
            .update({ 
              date: snoozeUntil.toISOString()
            })
            .eq("id", entityId)
            .eq("user_profile_id", user.id)
            .select('date')
            .single();
          
          nextFireAt = updateData?.date;
        }
        break;

      case 'dismiss':
        // Mark as dismissed/notified
        if (entityType === 'medication') {
          await supabase
            .from("medication_reminders")
            .update({ notified: true })
            .eq("id", entityId)
            .eq("user_profile_id", user.id);
        } else if (entityType === 'appointment') {
          await supabase
            .from("appointment_reminders")
            .update({ notified: true })
            .eq("id", entityId)
            .eq("user_profile_id", user.id);
        }
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: "Invalid action type" 
        });
    }

    return res.status(200).json({ 
      success: true,
      nextFireAt 
    });

  } catch (error) {
    console.error("Action error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
}