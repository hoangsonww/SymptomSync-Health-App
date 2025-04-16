import { supabase } from "./supabaseClient";
import { z } from "zod";

/**
 * This file contains functions to manage health logs in a Supabase database.
 * It includes functions to retrieve, create, update, and delete health log records.
 */

// Zod schema for a health log record.
export const HealthLogSchema = z.object({
  id: z.string(),
  user_profile_id: z.string(),
  symptom_type: z.string().nullable(),
  severity: z.number().nullable(),
  mood: z.string().nullable(),
  vitals: z.any().nullable(),
  medication_intake: z.string().nullable(),
  notes: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string().nullable(),
});

export type HealthLog = z.infer<typeof HealthLogSchema>;

/**
 * Retrieves all health logs for a given user.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param userId - The id of the user.
 * @returns An array of health log records.
 * @throws An error if the query fails.
 */
export async function getHealthLogsByUser(
  userId: string,
): Promise<HealthLog[]> {
  const { data, error } = await supabase
    .from("health_logs")
    .select("*")
    .eq("user_profile_id", userId);

  if (error) throw error;
  return HealthLogSchema.array().parse(data);
}

/**
 * Retrieves a paginated list of health logs for a given user.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param userId   The id of the user.
 * @param page     1‑based page number.
 * @param pageSize Number of items per page (default 50).
 */
export async function getPaginatedHealthLogsByUser(
  userId: string,
  page: number,
  pageSize = 20,
): Promise<{ data: HealthLog[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  const { data, error, count } = await supabase
    .from("health_logs")
    .select("*", { count: "exact" })
    .eq("user_profile_id", userId)
    .order("start_date", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    data: HealthLogSchema.array().parse(data),
    count: count ?? 0,
  };
}

/**
 * Creates a new health log record.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param params - The health log details.
 * @returns The created health log.
 * @throws An error if the insert fails.
 */
export async function createHealthLog(params: {
  user_profile_id: string;
  symptom_type?: string | null;
  severity?: number | null;
  mood?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vitals?: any;
  medication_intake?: string | null;
  notes?: string | null;
  start_date?: string;
  end_date?: string | null;
}): Promise<HealthLog> {
  const insertPayload = {
    user_profile_id: params.user_profile_id,
    symptom_type: params.symptom_type ?? null,
    severity: params.severity ?? null,
    mood: params.mood ?? null,
    vitals: params.vitals ?? null,
    medication_intake: params.medication_intake ?? null,
    notes: params.notes ?? null,
    start_date: params.start_date ?? new Date().toISOString(),
    end_date: params.end_date ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("health_logs")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return HealthLogSchema.parse(data);
}

/**
 * Updates an existing health log record.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param id - The id of the health log to update.
 * @param updatePayload - The fields to update.
 * @returns The updated health log.
 * @throws An error if the update fails.
 */
export async function updateHealthLog(
  id: string,
  updatePayload: Partial<{
    symptom_type: string | null;
    severity: number | null;
    mood: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vitals: any;
    medication_intake: string | null;
    notes: string | null;
    start_date: string;
    end_date: string | null;
  }>,
): Promise<HealthLog> {
  const { data, error } = await supabase
    .from("health_logs")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return HealthLogSchema.parse(data);
}

/**
 * Deletes a health log record.
 * Note: Supabase RLS will block this operation if the user is not the owner of the record.
 *
 * @param id - The id of the health log record to delete.
 * @returns The deleted health log.
 * @throws An error if the deletion fails.
 */
export async function deleteHealthLog(id: string): Promise<HealthLog> {
  const { data, error } = await supabase
    .from("health_logs")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return HealthLogSchema.parse(data);
}

// Supabase RLS Policy: Only allow authenticated users to access their own health logs.
// Only the user who created the health log can access, update, or delete it.
// They cannot access, update, or delete health logs created by other users.
// Ensure that the user is authenticated before performing any operations.
