import {
  getAppointmentRemindersByUser,
  AppointmentReminder,
} from "./appointmentReminders";
import {
  getMedicationRemindersByUser,
  MedicationReminder,
} from "./medications";
import { z } from "zod";

const ReminderSchema = z.object({
  id: z.string(),
  type: z.enum(["appointment", "medication"]),
  title: z.string(),
  dueTime: z.date(),
});
export type Reminder = z.infer<typeof ReminderSchema>;

/**
 * Fetches and merges appointment and medication reminders for a user.
 * Converts the reminder due times (assumed to be stored as UTC ISO strings) into Date objects.
 *
 * @param userId - The current user ID.
 * @returns An array of Reminder objects.
 */
export async function fetchUserReminders(userId: string): Promise<Reminder[]> {
  const [appointments, medications] = await Promise.all([
    getAppointmentRemindersByUser(userId),
    getMedicationRemindersByUser(userId),
  ]);

  const appointmentReminders: Reminder[] = appointments.map(
    (appt: AppointmentReminder) => ({
      id: `appt-${appt.id}`,
      type: "appointment",
      title: appt.appointment_name,
      dueTime: new Date(appt.date),
    }),
  );

  const medicationReminders: Reminder[] = medications.map(
    (med: MedicationReminder) => ({
      id: `med-${med.id}`,
      type: "medication",
      title: med.medication_name,
      dueTime: new Date(med.reminder_time),
    }),
  );

  return ReminderSchema.array().parse([
    ...appointmentReminders,
    ...medicationReminders,
  ]);
}
