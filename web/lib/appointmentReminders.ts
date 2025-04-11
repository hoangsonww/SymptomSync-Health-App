import { supabase } from "./supabaseClient";
import { z } from "zod";

/**
 * This file contains functions to manage appointment reminders in a Supabase database.
 * It includes functions to retrieve, create, update, and delete appointment reminders.
 */

// Zod schema for an appointment reminder.
export const AppointmentReminderSchema = z.object({
  id: z.string(),
  user_profile_id: z.string(),
  appointment_name: z.string(),
  date: z.string(),
});

export type AppointmentReminder = z.infer<typeof AppointmentReminderSchema>;

/**
 * Retrieves all appointment reminders for a given user.
 * @param userId - The id of the user.
 * @returns An array of appointment reminders.
 * @throws An error if the query fails.
 */
export async function getAppointmentRemindersByUser(
  userId: string,
): Promise<AppointmentReminder[]> {
  const { data, error } = await supabase
    .from("appointment_reminders")
    .select("*")
    .eq("user_profile_id", userId);

  if (error) throw error;
  return AppointmentReminderSchema.array().parse(data);
}

/**
 * Creates a new appointment reminder.
 * @param params - The appointment reminder details.
 * @returns The created appointment reminder.
 * @throws An error if the insert fails.
 */
export async function createAppointmentReminder(params: {
  user_profile_id: string;
  appointment_name: string;
  date?: string;
}): Promise<AppointmentReminder> {
  const insertPayload = {
    user_profile_id: params.user_profile_id,
    appointment_name: params.appointment_name,
    date: params.date,
  };

  const { data, error } = await supabase
    .from("appointment_reminders")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return AppointmentReminderSchema.parse(data);
}

/**
 * Updates an existing appointment reminder.
 * @param id - The id of the appointment reminder.
 * @param updatePayload - The fields to update.
 * @returns The updated appointment reminder.
 * @throws An error if the update fails.
 */
export async function updateAppointmentReminder(
  id: string,
  updatePayload: Partial<{ appointment_name: string; date: string }>,
): Promise<AppointmentReminder> {
  const { data, error } = await supabase
    .from("appointment_reminders")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return AppointmentReminderSchema.parse(data);
}

/**
 * Deletes an appointment reminder.
 * @param id - The id of the appointment reminder to delete.
 * @returns The deleted appointment reminder.
 * @throws An error if the deletion fails.
 */
export async function deleteAppointmentReminder(
  id: string,
): Promise<AppointmentReminder> {
  const { data, error } = await supabase
    .from("appointment_reminders")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return AppointmentReminderSchema.parse(data);
}
