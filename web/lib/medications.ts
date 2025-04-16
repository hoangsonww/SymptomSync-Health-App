import { supabase } from "./supabaseClient";
import { z } from "zod";

/**
 * This file contains functions to manage medication reminders in a Supabase database.
 * It includes functions to retrieve, create, update, and delete medication reminder records.
 */

// Zod schema for a medication reminder.
export const MedicationReminderSchema = z.object({
  id: z.string(),
  user_profile_id: z.string(),
  medication_name: z.string(),
  dosage: z.string().nullable(),
  reminder_time: z.string(),
  recurrence: z.string().nullable(),
  calendar_sync_token: z.string().nullable(),
  created_at: z.string(),
});

export type MedicationReminder = z.infer<typeof MedicationReminderSchema>;

/**
 * Retrieves all medication reminders for a given user.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param userId - The id of the user.
 * @returns An array of medication reminders.
 * @throws An error if the query fails.
 */
export async function getMedicationRemindersByUser(
  userId: string,
): Promise<MedicationReminder[]> {
  const { data, error } = await supabase
    .from("medication_reminders")
    .select("*")
    .eq("user_profile_id", userId);

  if (error) throw error;
  return MedicationReminderSchema.array().parse(data);
}

/**
 * Retrieves one page of medication reminders for a given user.
 * Returns up to `pageSize` items, plus the total count.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param userId   - The id of the user.
 * @param page     - 1‑based page number (defaults to 1).
 * @param pageSize - Number of items per page (defaults to 50).
 * @returns An object with `data` (current page) and `count` (total across all pages).
 */
export async function getPaginatedMedicationRemindersByUser(
  userId: string,
  page = 1,
  pageSize = 30,
): Promise<{ data: MedicationReminder[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const { data, error, count } = await supabase
    .from("medication_reminders")
    .select("*", { count: "exact" })
    .eq("user_profile_id", userId)
    .order("reminder_time", { ascending: true })
    .range(from, to);

  if (error) throw error;
  return {
    data: MedicationReminderSchema.array().parse(data || []),
    count: count ?? 0,
  };
}

/**
 * Creates a new medication reminder.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param params - The medication reminder details.
 * @returns The created medication reminder.
 * @throws An error if the insert fails.
 */
export async function createMedicationReminder(params: {
  user_profile_id: string;
  medication_name: string;
  dosage?: string | null;
  reminder_time: string;
  recurrence?: string | null;
  calendar_sync_token?: string | null;
}): Promise<MedicationReminder> {
  const insertPayload = {
    user_profile_id: params.user_profile_id,
    medication_name: params.medication_name,
    dosage: params.dosage ?? null,
    reminder_time: params.reminder_time,
    recurrence: params.recurrence ?? null,
    calendar_sync_token: params.calendar_sync_token ?? null,
  };

  const { data, error } = await supabase
    .from("medication_reminders")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return MedicationReminderSchema.parse(data);
}

/**
 * Updates an existing medication reminder.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param id - The id of the medication reminder.
 * @param updatePayload - The fields to update.
 * @returns The updated medication reminder.
 * @throws An error if the update fails.
 */
export async function updateMedicationReminder(
  id: string,
  updatePayload: Partial<{
    medication_name: string;
    dosage: string | null;
    reminder_time: string;
    recurrence: string | null;
    calendar_sync_token: string | null;
  }>,
): Promise<MedicationReminder> {
  const { data, error } = await supabase
    .from("medication_reminders")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return MedicationReminderSchema.parse(data);
}

/**
 * Deletes a medication reminder.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param id - The id of the medication reminder to delete.
 * @returns The deleted medication reminder.
 * @throws An error if the deletion fails.
 */
export async function deleteMedicationReminder(
  id: string,
): Promise<MedicationReminder> {
  const { data, error } = await supabase
    .from("medication_reminders")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return MedicationReminderSchema.parse(data);
}

// Supabase RLS Policy: Table is only accessible to authenticated users.
// Only the user who created the reminder can access, update, or delete it.
// They cannot access, update, or delete reminders created by other users.
