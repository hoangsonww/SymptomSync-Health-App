/**
 * Snooze utility functions for reminders
 */

import { supabase } from '@/lib/supabaseClient';
import { addMinutes } from 'date-fns';

export interface SnoozeOptions {
  entityType: 'medication' | 'appointment';
  entityId: string;
  userId: string;
  minutes: number;
}

/**
 * Snooze a reminder by updating its due time
 */
export async function snoozeReminder({
  entityType,
  entityId,
  userId,
  minutes
}: SnoozeOptions): Promise<{ success: boolean; error?: string; nextFireAt?: string }> {
  try {
    const newTime = addMinutes(new Date(), minutes);
    const table = entityType === 'medication' ? 'medication_reminders' : 'appointment_reminders';
    const timeColumn = entityType === 'medication' ? 'reminder_time' : 'date';

    const { data, error } = await supabase
      .from(table)
      .update({ 
        [timeColumn]: newTime.toISOString(),
        notified: false // Reset notified flag so it can fire again
      })
      .eq('id', entityId)
      .eq('user_profile_id', userId)
      .select(timeColumn)
      .single();

    if (error) {
      console.error('Error snoozing reminder:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      nextFireAt: data[timeColumn] 
    };

  } catch (error) {
    console.error('Error snoozing reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Mark a medication reminder as taken
 */
export async function markMedicationTaken(
  medicationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mark as notified (taken)
    const { error: updateError } = await supabase
      .from('medication_reminders')
      .update({ notified: true })
      .eq('id', medicationId)
      .eq('user_profile_id', userId);

    if (updateError) {
      console.error('Error marking medication as taken:', updateError);
      return { success: false, error: updateError.message };
    }

    // TODO: In the future, you might want to:
    // 1. Create an adherence record
    // 2. Schedule the next dose based on frequency
    // 3. Update medication streak counters

    return { success: true };

  } catch (error) {
    console.error('Error marking medication as taken:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Dismiss a reminder (mark as handled without specific action)
 */
export async function dismissReminder(
  entityType: 'medication' | 'appointment',
  entityId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const table = entityType === 'medication' ? 'medication_reminders' : 'appointment_reminders';

    const { error } = await supabase
      .from(table)
      .update({ notified: true })
      .eq('id', entityId)
      .eq('user_profile_id', userId);

    if (error) {
      console.error('Error dismissing reminder:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Error dismissing reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user's snooze presets
 */
export async function getUserSnoozePresets(userId: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('snooze_presets')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching snooze presets:', error);
      return [10, 30, 120]; // Default presets
    }

    return data?.snooze_presets || [10, 30, 120];

  } catch (error) {
    console.error('Error fetching snooze presets:', error);
    return [10, 30, 120];
  }
}

/**
 * Format snooze duration for display
 */
export function formatSnoozeDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `${days}d`;
    }
    return `${days}d ${remainingHours}h`;
  }
}