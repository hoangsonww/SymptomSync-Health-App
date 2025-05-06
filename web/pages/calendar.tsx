import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import {
  MedicationReminder,
  getMedicationRemindersByUser,
  createMedicationReminder,
  deleteMedicationReminder,
  updateMedicationReminder,
} from "@/lib/medications";
import {
  AppointmentReminder,
  getAppointmentRemindersByUser,
  createAppointmentReminder,
  deleteAppointmentReminder,
  updateAppointmentReminder,
} from "@/lib/appointmentReminders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  parse,
  startOfWeek,
  getDay,
  format,
  addDays,
  addMonths,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { toast } from "sonner";
import {
  Trash2,
  Edit3,
  CheckSquare,
  XSquare,
  Download,
  Calendar as CalendarIcon,
  Pill,
  Loader2,
} from "lucide-react";
import Head from "next/head";
import { motion } from "framer-motion";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomTimePicker } from "@/components/ui/time-picker";

const containerVariants = {
  hidden: { opacity: 0, pointerEvents: "none" },
  visible: {
    opacity: 1,
    pointerEvents: "auto",
    transition: { when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "medication" | "appointment";
};

/**
 * Takes a medication reminder and expands it into multiple calendar events based on its recurrence
 *
 * @param med - The medication reminder object.
 * @param horizonDays - The number of days to expand the events into the future.
 * @returns - An array of calendar events.
 */
function expandMedication(
  med: MedicationReminder,
  // For now we'll just do 90 days - since we don't ask the user for the end date when they add a med
  horizonDays = 90,
): CalendarEvent[] {
  const baseTime = new Date(med.reminder_time);
  const events: CalendarEvent[] = [];
  const recurrence = med.recurrence
    ? med.recurrence
        .toLowerCase()
        .replace(/[-\s]+/g, " ")
        .trim()
    : "";

  if (!recurrence || recurrence === "as needed") {
    events.push({
      id: `med-${med.id}-0`,
      title: `💊 Med: ${med.medication_name}`,
      start: baseTime,
      end: baseTime,
      type: "medication",
    });
    return events;
  }

  const endPoint = addDays(baseTime, horizonDays);

  let deltaDays = 1;
  if (recurrence === "weekly") {
    deltaDays = 7;
  } else if (recurrence === "biweekly") {
    deltaDays = 14;
  } else if (recurrence === "monthly") {
    // Monthly recurrence will be handled below
  }

  let index = 0;
  if (recurrence === "monthly") {
    let current = new Date(baseTime);
    while (current <= endPoint) {
      events.push({
        id: `med-${med.id}-${index}`,
        title: `💊 Med: ${med.medication_name}`,
        start: new Date(current),
        end: new Date(current),
        type: "medication",
      });
      index++;
      current = addMonths(current, 1);
    }
  } else {
    let current = new Date(baseTime);
    while (current <= endPoint) {
      events.push({
        id: `med-${med.id}-${index}`,
        title: `💊 Med: ${med.medication_name}`,
        start: new Date(current),
        end: new Date(current),
        type: "medication",
      });
      index++;
      current = addDays(current, deltaDays);
    }
  }

  return events;
}

/**
 * Converts a raw ICS date string of the form "YYYYMMDDTHHMMSS"
 * into a valid ISO 8601 date string (like "YYYY-MM-DDTHH:MM:SSZ")
 *
 * Asked ChatGPT to help me with the regexs
 *
 * @param dateStr - The raw ICS date string to normalize.
 * @returns - The normalized date string in ISO 8601 format.
 */
function normalizeIcsDate(dateStr: string): string {
  const regex = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/;
  const match = regex.exec(dateStr);
  if (match) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, year, month, day, hour, minute, second, z] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}${z || "Z"}`;
  }

  return dateStr;
}

/**
 * Generates an ICS string from the given events
 *
 * @param events - An array of calendar events to include in the ICS file.
 * @returns - A string representing the ICS file content.
 */
function generateIcs(events: CalendarEvent[]): string {
  const formatDateUtc = (date: Date) => format(date, "yyyyMMdd'T'HHmmss'Z'");
  const ics = [
    "BEGIN:VCALENDAR",
    "CALSCALE:GREGORIAN",
    "PRODID:-//SymptomSync//EN",
    "VERSION:2.0",
    "X-WR-CALNAME:SymptomSync Calendar",
  ];
  const dtStamp = formatDateUtc(new Date());
  events.forEach((ev) => {
    ics.push("BEGIN:VEVENT");
    ics.push(`UID:${ev.id}@symptomsync.com`);
    ics.push(`DTSTAMP:${dtStamp}`);
    ics.push(`DTSTART:${formatDateUtc(ev.start)}`);
    ics.push(`DTEND:${formatDateUtc(ev.end)}`);

    if (ev.type === "medication") {
      ics.push(`SUMMARY:💊 Med: ${ev.title.replace(/^💊 Med: /, "")}`);
    } else {
      ics.push(`SUMMARY:🗓️ Appt: ${ev.title.replace(/^🗓️ Appt: /, "")}`);
    }
    ics.push("END:VEVENT");
  });
  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}

/**
 * Parses a simple ICS string and returns an array of objects representing the events.
 * This parser extracts DTSTART, DTEND, and SUMMARY and normalizes the dates.
 * Only events within the past year are returned to avoid too large calendars
 */
function parseIcs(
  icsText: string,
): { summary: string; dtstart: string; dtend: string }[] {
  const events = [];
  const lines = icsText.split(/\r?\n/);
  let currentEvent: { summary?: string; dtstart?: string; dtend?: string } = {};
  let inEvent = false;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      currentEvent = {};
    } else if (line === "END:VEVENT") {
      inEvent = false;
      if (currentEvent.dtstart && currentEvent.dtend && currentEvent.summary) {
        events.push({
          summary: currentEvent.summary,
          dtstart: currentEvent.dtstart,
          dtend: currentEvent.dtend,
        });
      }
    } else if (inEvent) {
      if (line.startsWith("SUMMARY:")) {
        currentEvent.summary = line.substring(8).trim();
      } else if (line.startsWith("DTSTART:")) {
        currentEvent.dtstart = normalizeIcsDate(line.substring(8).trim());
      } else if (line.startsWith("DTEND:")) {
        currentEvent.dtend = normalizeIcsDate(line.substring(6).trim());
      }
    }
  }
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  return events.filter(
    (ev) => new Date(ev.dtstart).getTime() >= oneYearAgo.getTime(),
  );
}

/**
 * Handles importing an ICS file. Tries its best to classify events as
 * medications or appointments based on the summary. But this is a heuristic
 * and may not be 100% accurate. For events it doesn't recognize, it will
 * treat them as appointments
 *
 * @param e - The change event from the file input.
 * @param userId - The user ID to associate the events with.
 * @param refresh - A function to refresh the data after import.
 * @return - A promise that resolves when the import is complete.
 */
function handleImportIcs(
  e: React.ChangeEvent<HTMLInputElement>,
  userId: string,
  refresh: () => Promise<void>,
) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const text = event.target?.result as string;
      const importedEvents = parseIcs(text);
      for (const ev of importedEvents) {
        if (/^(Med:|Medication:)/i.test(ev.summary)) {
          const medName = ev.summary.replace(/^(Med:|Medication:)\s*/i, "");
          await createMedicationReminder({
            user_profile_id: userId,
            medication_name: medName,
            dosage: null,
            reminder_time: new Date(ev.dtstart).toISOString(),
            recurrence: "As Needed",
            calendar_sync_token: null,
          });
        } else {
          await createAppointmentReminder({
            user_profile_id: userId,
            appointment_name: ev.summary,
            date: new Date(ev.dtstart).toISOString(),
          });
        }
      }
      toast.success("ICS file imported successfully");
      await refresh();
    } catch (error) {
      console.error("Error importing ICS", error);
      toast.error("Error importing ICS file");
    }
  };
  reader.readAsText(file);
}

export default function CalendarPage() {
  const [userId, setUserId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [appointments, setAppointments] = useState<AppointmentReminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRefs = useRef<any[]>([]);
  const [showSelectTypeDialog, setShowSelectTypeDialog] = useState(false);
  const [slotDate, setSlotDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<"appointment" | "medication">(
    "appointment",
  );
  const [newApptName, setNewApptName] = useState("");
  const [newApptDate, setNewApptDate] = useState<Date | undefined>(undefined);
  const [newApptTime, setNewApptTime] = useState("00:00");
  const [newMedName, setNewMedName] = useState("");
  const [newMedDate, setNewMedDate] = useState<Date | undefined>(undefined);
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedDosageUnit, setNewMedDosageUnit] = useState("");
  const [newMedTimePicker, setNewMedTimePicker] = useState("00:00");
  const [newMedRecurrence, setNewMedRecurrence] = useState<null | string>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState("00:00");
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const [showIcsDialog, setShowIcsDialog] = useState(false);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);
  const [editMedDosage, setEditMedDosage] = useState("");
  const [editMedDosageUnit, setEditMedDosageUnit] = useState("mg");
  const [editMedRecurrence, setEditMedRecurrence] = useState("Daily");
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Function to send a broadcast message to all connected clients
   * using the Supabase broadcast channel.
   *
   * @param eventName - The name of the event to broadcast
   * @param message - The message to send with the event
   */
  const sendBroadcast = (eventName: string, message: string) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: "broadcast",
        event: eventName,
        payload: { message },
      });
    }
  };

  /**
   * Supabase Realtime #1: Subscribe to changes in medication and appointment reminders
   * and update the UI immediately as changes occur
   */
  useEffect(() => {
    let isMounted = true;
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      setUserId(user.id);
      await fetchAllData(user.id);

      const medsChannel = supabase
        .channel("medsSub")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            await fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            await fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            await fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.current.push(medsChannel);

      const apptsChannel = supabase
        .channel("apptsSub")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "appointment_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            await fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "appointment_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            await fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "appointment_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            await fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.current.push(apptsChannel);
    }

    init();

    return () => {
      isMounted = false;
      channelRefs.current.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);

  /**
   * Supabase Realtime #2: In the above realtime functionality, we already
   * created postgres changes for meds, appointments, and health logs. However,
   * that will only update the UI if the user adds a new med, appointment, or log
   * from another device. But we may also wanna broadcast a message to the user
   * when a new med, appointment, or log is added from another device as well.
   * This is where the broadcast channel comes in - it will broadcast a message
   * to the user when a new med, appointment, or log is added from another device so
   * that the user knows that something has changed in the UI and the reason
   * for that change.
   */
  useEffect(() => {
    async function subscribeToUserChannel() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const userChannelName = `user-channel-${user.id}`;
      broadcastChannelRef.current = supabase.channel(userChannelName, {
        config: { broadcast: { self: false } },
      });
      const channel = broadcastChannelRef.current;

      channel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("broadcast", { event: "*" }, (payload: any) => {
          toast.success(
            `Notification: ${payload.payload.message.replace(/\./g, "")} from another device or tab.`,
          );
        })
        .subscribe((status: string) => {
          console.log("User-specific channel status:", status);
        });

      return () => {
        supabase.removeChannel(channel);
        broadcastChannelRef.current = null;
      };
    }

    subscribeToUserChannel();
  }, [router]);

  /**
   * Fetch all data from the server and update the state
   * This function fetches both medications and appointments
   * and expands the medications into multiple events based on their recurrence
   *
   * @param uid - The user ID to fetch data for
   * @returns - Appointment and medication reminders data
   */
  async function fetchAllData(uid: string) {
    setIsLoading(true);

    try {
      const [meds, appts] = await Promise.all([
        getMedicationRemindersByUser(uid),
        getAppointmentRemindersByUser(uid),
      ]);
      setMedications(meds);
      setAppointments(appts);

      let medEvents: CalendarEvent[] = [];
      meds.forEach((m) => {
        const repeated = expandMedication(m);
        medEvents = medEvents.concat(repeated);
      });

      const apptEvents: CalendarEvent[] = appts.map((a) => {
        const startDate = new Date(a.date);
        const endDate = new Date(a.date);
        endDate.setHours(endDate.getHours() + 1);
        return {
          id: `appt-${a.id}`,
          title: `🗓️ Appt: ${a.appointment_name}`,
          start: startDate,
          end: endDate,
          type: "appointment",
        };
      });

      setEvents([...medEvents, ...apptEvents]);
      setIsLoading(false);
    } catch (error) {
      toast.error("Error fetching data");
      console.error("Error fetching data", error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle slot selection on the calendar
   * This function sets the selected date and shows the dialog to select type
   * of reminder to add (appointment or medication)
   *
   * @param slotInfo - The information about the selected slot
   */
  function handleSelectSlot(slotInfo: { start: Date; end: Date }) {
    setSlotDate(slotInfo.start);
    setShowSelectTypeDialog(true);
  }

  /**
   * On select type - This function sets the type of reminder to add
   * and initializes the date and time for the new reminder
   *
   * @param type - The type of reminder to add (appointment or medication)
   */
  function onSelectType(type: "appointment" | "medication") {
    setAddType(type);
    if (slotDate) {
      const timeStr = format(slotDate, "HH:mm");
      if (type === "appointment") {
        setNewApptDate(slotDate);
        setNewApptTime(timeStr);
      } else {
        setNewMedDate(slotDate);
        setNewMedTimePicker(timeStr);
        setNewMedRecurrence("As Needed");
      }
    }
    setShowSelectTypeDialog(false);
    setShowAddDialog(true);
  }

  /**
   * Add Appointment
   * This function creates a new appointment reminder and adds it to the events array
   * It also sets the start and end times for the event
   *
   * @returns - A promise that resolves when the appointment is created
   */
  async function handleAddAppointment() {
    if (!userId || !newApptName || !newApptDate) return;
    try {
      const dateString = format(newApptDate, "yyyy-MM-dd");
      const dateTimeString = newApptTime
        ? `${dateString}T${newApptTime}`
        : dateString;
      const localDate = new Date(dateTimeString);
      const isoString = localDate.toISOString();
      const created = await createAppointmentReminder({
        user_profile_id: userId,
        appointment_name: newApptName,
        date: isoString,
      });
      const startDt = new Date(created.date);
      const endDt = new Date(created.date);
      endDt.setHours(endDt.getHours() + 1);
      setEvents((prev) => [
        ...prev,
        {
          id: `appt-${created.id}`,
          title: `🗓️ Appt: ${created.appointment_name}`,
          start: startDt,
          end: endDt,
          type: "appointment",
        },
      ]);
      toast.success("Appointment reminder added successfully!");
      sendBroadcast(
        "appt-add",
        `New appointment reminder ${created.appointment_name} added.`,
      );
      setShowAddDialog(false);
      setNewApptName("");
      setNewApptDate(undefined);
      setNewApptTime("00:00");
    } catch (err) {
      toast.error("Error creating appointment reminder.");
      console.error(err);
    }
  }

  /**
   * Add Medication
   * This function creates a new medication reminder and expands it into multiple events
   * based on its recurrence
   *
   * @returns - A promise that resolves when the medication is created
   */
  async function handleAddMedication() {
    if (!userId || !newMedName || !newMedDate) return;
    try {
      if (!newMedRecurrence) {
        setNewMedRecurrence("As Needed");
      }
      const dateString = format(newMedDate, "yyyy-MM-dd");
      const combined = `${dateString}T${newMedTimePicker}`;
      const combinedDosage = newMedDosage
        ? `${newMedDosage} ${newMedDosageUnit}`
        : "";
      const localDate = new Date(combined);
      const isoString = localDate.toISOString();
      const created = await createMedicationReminder({
        user_profile_id: userId,
        medication_name: newMedName,
        dosage: combinedDosage,
        reminder_time: isoString,
        recurrence: newMedRecurrence,
        calendar_sync_token: null,
      });
      const repeated = expandMedication(created);
      setEvents((prev) => [...prev, ...repeated]);
      toast.success("Medication reminder added successfully!");
      sendBroadcast(
        "med-add",
        `New medication reminder "${newMedName}" added.`,
      );
      setShowAddDialog(false);
      setNewMedName("");
      setNewMedDate(undefined);
      setNewMedDosage("");
      setNewMedTimePicker("00:00");
      setNewMedRecurrence(null);
    } catch (err) {
      toast.error("Error creating medication reminder.");
      console.error(err);
    }
  }

  /**
   * Handle event selection
   * If selectMode is true, toggle the selected state of the event
   * Otherwise, show the edit dialog
   *
   * @param ev - The selected event
   * @returns - A promise that resolves when the event is selected
   */
  function handleSelectEvent(ev: CalendarEvent) {
    if (selectMode) {
      const newSet = new Set(selectedEventIds);
      if (newSet.has(ev.id)) {
        newSet.delete(ev.id);
      } else {
        newSet.add(ev.id);
      }
      setSelectedEventIds(newSet);
      return;
    }
    setDialogEvent(ev);

    if (ev.type === "medication") {
      setEditTitle(ev.title.replace(/^💊 Med: /, ""));
    } else {
      setEditTitle(ev.title.replace(/^🗓️ Appt: /, ""));
    }
    setEditDate(ev.start);
    setEditTime(format(ev.start, "HH:mm"));
    setShowEventDialog(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function dayPropGetter(date: Date): React.HTMLAttributes<HTMLDivElement> {
    return {
      style: {
        cursor: "pointer",
      },
    };
  }

  /**
   * Event style getter
   * If the event is selected, change the background color to something
   * lighter
   *
   * @param event - The event to style
   * @return - The style object for the event
   */
  function eventPropGetter(event: CalendarEvent) {
    const style: React.CSSProperties = {
      cursor: "pointer",
      backgroundColor: "#344966",
    };
    if (selectedEventIds.has(event.id)) {
      style.backgroundColor = "#4a5a75";
      style.border = "2px solid #FF577F";
    }
    return { style };
  }

  /**
   * Save event edits
   * For appointments, only update the single event
   * For medications, update the entire series
   *
   * @returns - A promise that resolves when the event is saved
   */
  async function handleSaveEventEdits() {
    if (!dialogEvent || !userId || !editDate) return;
    const dateString = format(editDate, "yyyy-MM-dd");
    const dateTimeString = `${dateString}T${editTime}`;
    const localDate = new Date(dateTimeString);
    const isoString = localDate.toISOString();

    try {
      const [type, ...rest] = dialogEvent.id.split("-");
      if (type === "appt") {
        const realId = rest.join("-");
        const updated = await updateAppointmentReminder(realId, {
          appointment_name: editTitle,
          date: isoString,
        });
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === dialogEvent.id) {
              const newEnd = new Date(updated.date);
              newEnd.setHours(newEnd.getHours() + 1);
              return {
                ...e,
                title: `🗓️ Appt: ${updated.appointment_name}`,
                start: new Date(updated.date),
                end: newEnd,
              };
            }
            return e;
          }),
        );
        sendBroadcast(
          "appt-update",
          `Appointment reminder "${editTitle}" updated successfully.`,
        );
        toast.success("Appointment updated successfully!");
      } else {
        const withoutPrefix = dialogEvent.id.slice(4);
        const lastDash = withoutPrefix.lastIndexOf("-");
        const realIdMed = withoutPrefix.substring(0, lastDash);

        const updated = await updateMedicationReminder(realIdMed, {
          medication_name: editTitle,
          dosage: `${editMedDosage} ${editMedDosageUnit}`,
          reminder_time: isoString,
          recurrence: editMedRecurrence,
        });

        const newEventsForMed = expandMedication(updated);
        setEvents((prev) => {
          const filtered = prev.filter((e) => {
            if (e.type === "medication") {
              return !e.id.startsWith(`med-${realIdMed}`);
            }
            return true;
          });
          return [...filtered, ...newEventsForMed];
        });
        sendBroadcast(
          "med-update",
          `Medication reminder "${editTitle}" updated successfully.`,
        );
        toast.success("Medication reminder updated successfully!");
      }
      setShowEventDialog(false);
    } catch (err) {
      toast.error("Error updating medication reminder.");
      console.error(err);
    }
  }

  /**
   * Delete event
   * For appointments, delete the single event
   * For medications, delete the entire series
   */
  function handleDeleteSingle() {
    if (!dialogEvent) return;
    setDeleteTargetIds([dialogEvent.id]);
    setShowConfirmDeleteDialog(true);
  }

  /**
   * Delete selected events
   * If no events are selected, do nothing
   * Otherwise, set the delete target IDs and show the confirmation dialog
   */
  function handleDeleteSelected() {
    if (selectedEventIds.size === 0) return;
    setDeleteTargetIds(Array.from(selectedEventIds));
    setShowConfirmDeleteDialog(true);
  }

  /**
   * Delete events
   * For appointments, delete the single event
   * For medications, delete the entire series
   * For both, remove from the events array
   * and update the state
   */
  async function doDeleteEvents() {
    try {
      const appointmentIdsToDelete = new Set();
      const medicationIdsToDelete = new Set();
      for (const eId of deleteTargetIds) {
        if (eId.startsWith("appt-")) {
          const realId = eId.slice(5);
          appointmentIdsToDelete.add(realId);
        } else if (eId.startsWith("med-")) {
          const withoutPrefix = eId.slice(4);
          const lastDash = withoutPrefix.lastIndexOf("-");
          const realId = withoutPrefix.substring(0, lastDash);
          medicationIdsToDelete.add(realId);
        }
      }
      for (const apptId of appointmentIdsToDelete) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await deleteAppointmentReminder(apptId);
        sendBroadcast(
          "appt-delete",
          `Appointment reminder deleted successfully.`,
        );
      }
      for (const medId of medicationIdsToDelete) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await deleteMedicationReminder(medId);
        sendBroadcast(
          "med-delete",
          `Medication reminder deleted successfully.`,
        );
      }
      toast.success("Deleted events");
      setEvents((prev) =>
        prev.filter((evt) => {
          if (evt.type === "appointment") {
            const evtId = evt.id.slice(5);
            return !appointmentIdsToDelete.has(evtId);
          } else if (evt.type === "medication") {
            const withoutPrefix = evt.id.slice(4);
            const lastDash = withoutPrefix.lastIndexOf("-");
            const medId = withoutPrefix.substring(0, lastDash);
            return !medicationIdsToDelete.has(medId);
          }
          return true;
        }),
      );
      setSelectedEventIds(new Set());
    } catch (err) {
      toast.error("Error deleting events");
      console.error(err);
    }
    setShowConfirmDeleteDialog(false);
    setShowEventDialog(false);
    setSelectMode(false);
  }

  /**
   * Export the entire calendar as an ICS file
   */
  async function handleExportCalendar() {
    const icsString = generateIcs(events);
    const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>SymptomSync | Calendar</title>
        <meta
          name="description"
          content="Manage your appointments & medications easily"
        />
      </Head>

      <motion.div
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full h-screen p-4 md:p-6 space-y-4"
      >
        <style jsx global>{`
          html {
            scroll-behavior: smooth;
          }

          html,
          body {
            overscroll-behavior: none;
          }
        `}</style>
        {isLoading && (
          <>
            <div className="absolute inset-0 z-50 bg-background bg-opacity-50" />

            <div
              className="absolute left-1/2 z-50"
              style={{ top: "50vh", transform: "translateX(-50%)" }}
            >
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 p-2 mb-6">
          <motion.div variants={slideInLeft} className="flex flex-col">
            <h1 className="text-3xl font-extrabold">Calendar 📆</h1>
            <motion.p
              variants={fadeInUp}
              className="text-foreground mt-2 text-center md:text-left"
            >
              Manage your appointments & medications easily
            </motion.p>
          </motion.div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() => {
                setAddType("appointment");
                setShowAddDialog(true);
              }}
              className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4ZZZZZ" /> Add Appointment
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setAddType("medication");
                setShowAddDialog(true);
              }}
              className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            >
              <Pill className="w-4 h-4ZZZZZ" /> Add Medication
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowIcsDialog(true)}
              className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
            >
              <Download className="w-4 h-4ZZZZZ" /> ICS Sync
            </Button>
            <Button
              variant="secondary"
              className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) setSelectedEventIds(new Set());
              }}
            >
              {selectMode ? (
                <>
                  <XSquare className="w-4 h-4ZZZZZ" /> Cancel Selection
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4ZZZZZ" /> Select Multiple
                </>
              )}
            </Button>
            {selectMode && selectedEventIds.size > 0 && (
              <Button
                variant="destructive"
                className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4ZZZZZ" /> Delete{" "}
                {selectedEventIds.size} Selected
              </Button>
            )}
          </div>
        </div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="bg-popover p-2 rounded-lg shadow-md"
          style={{ height: "calc(100vh - 12rem)" }}
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["month", "week", "day", "agenda"]}
            style={{ height: "100%", width: "100%", pointerEvents: "auto" }}
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
          />
        </motion.div>

        <Dialog open={showIcsDialog} onOpenChange={setShowIcsDialog}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ICS Import/Export</DialogTitle>
              <DialogDescription>
                Use this tool to export your calendar as an ICS file to sync
                with another calendar service, or import an ICS file from
                another provider into your SymptomSync calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="p-4 bg-white rounded shadow">
                <h3 className="text-lg font-semibold mb-2">
                  Export Your Calendar
                </h3>
                <p className="text-sm mb-4">
                  Download an ICS file containing all your events. You can then
                  manually import this file into Google Calendar, Outlook, or
                  Apple Calendar.
                </p>
                <Button
                  variant="default"
                  onClick={handleExportCalendar}
                  className="cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                >
                  <Download className="w-4 h-4 mr-1" /> Download ICS File
                </Button>
              </div>
              <div className="border-t border-gray-200"></div>

              <div className="p-4 bg-white rounded shadow">
                <h3 className="text-lg font-semibold mb-2">Import Calendar</h3>
                <p className="text-sm mb-4">
                  To import events from your other calendar, export an ICS file
                  from your calendar provider:
                  <br />
                  <span className="block mt-2">
                    <strong>- Google Calendar:</strong> Open Google Calendar,
                    click the gear icon, then &quot;Settings&quot;. Go to
                    &quot;Import &amp; Export&quot; and click &quot;Export&quot;
                    to download a ZIP file containing your calendars in ICS
                    format.
                  </span>
                  <span className="block mt-2">
                    <strong>- Outlook:</strong> Open Outlook Calendar, click on
                    &quot;File&quot;, then &quot;Save Calendar&quot;, and choose
                    the ICS format.
                  </span>
                  <span className="block mt-2">
                    <strong>- Apple Calendar (iCal):</strong> In Apple Calendar,
                    choose &quot;File&quot; &gt; &quot;Export&quot; &gt;
                    &quot;Export…&quot; to save your calendar as an ICS file.
                  </span>
                  <br />
                  Only events occurring within the past year will be imported.
                </p>
                <Input
                  type="file"
                  accept=".ics"
                  className="cursor-pointer"
                  onChange={(e) => {
                    if (userId) {
                      handleImportIcs(e, userId, async () => {
                        await fetchAllData(userId);
                      });
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowIcsDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showSelectTypeDialog}
          onOpenChange={setShowSelectTypeDialog}
        >
          <DialogContent className="max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a New Reminder</DialogTitle>
              <DialogDescription>
                Select which type of reminder to create.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowSelectTypeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                onClick={() => onSelectType("appointment")}
              >
                Appointment
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                onClick={() => onSelectType("medication")}
              >
                Medication
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {addType === "appointment"
                  ? "Add New Appointment"
                  : "Add New Medication"}
              </DialogTitle>
              <DialogDescription>
                {addType === "appointment"
                  ? "Provide appointment info and date/time."
                  : "Add medication info, date/time, and recurrence."}
              </DialogDescription>
            </DialogHeader>
            {addType === "appointment" ? (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Appointment Info
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Input
                    value={newApptName}
                    onChange={(e) => setNewApptName(e.target.value)}
                    placeholder="e.g. Check-up with Dr. Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Date
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <DatePicker value={newApptDate} onChange={setNewApptDate} />
                </div>
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Time (24h)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <CustomTimePicker
                    value={newApptTime}
                    onChange={setNewApptTime}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Medication Name
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Input
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="e.g. Ibuprofen"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Schedule (Date & Time)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <div className="mb-2">
                    <Label className="text-xs">Date</Label>
                    <DatePicker value={newMedDate} onChange={setNewMedDate} />
                  </div>
                  <div>
                    <Label className="text-xs">Time (24h)</Label>
                    <CustomTimePicker
                      value={newMedTimePicker}
                      onChange={setNewMedTimePicker}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="e.g. 200"
                    />
                    <Select
                      value={newMedDosageUnit}
                      onValueChange={setNewMedDosageUnit}
                    >
                      <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg">mg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Recurrence
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Select
                    value={newMedRecurrence ?? undefined}
                    onValueChange={setNewMedRecurrence}
                  >
                    <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="as-needed">As Needed</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Biweekly">Biweekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              {addType === "appointment" ? (
                <Button
                  variant="default"
                  onClick={handleAddAppointment}
                  className="cursor-pointer"
                  disabled={!newApptName || !newApptDate}
                >
                  Save
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleAddMedication}
                  className="cursor-pointer"
                  disabled={!newMedName || !newMedDate}
                >
                  Save
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogEvent && dialogEvent.type === "appointment"
                  ? "Edit Appointment"
                  : "Edit Medication"}
              </DialogTitle>
              <DialogDescription>
                {dialogEvent && dialogEvent.type === "appointment"
                  ? "Edit appointment info and its date/time."
                  : "Edit medication info, date/time, and recurrence."}
              </DialogDescription>
            </DialogHeader>
            {dialogEvent && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    {dialogEvent.type === "appointment"
                      ? "Appointment"
                      : "Medication"}{" "}
                    Title
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter title"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Date
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <DatePicker value={editDate} onChange={setEditDate} />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Time (24h)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <CustomTimePicker value={editTime} onChange={setEditTime} />
                </div>

                {dialogEvent.type === "medication" && (
                  <>
                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="1000"
                          step="0.1"
                          value={editMedDosage}
                          onChange={(e) => setEditMedDosage(e.target.value)}
                          placeholder="e.g. 200"
                        />
                        <Select
                          value={editMedDosageUnit}
                          onValueChange={setEditMedDosageUnit}
                        >
                          <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mg">mg</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recurrence</Label>
                      <Select
                        value={editMedRecurrence}
                        onValueChange={setEditMedRecurrence}
                      >
                        <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                          <SelectValue placeholder="Select recurrence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="as-needed">As Needed</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Biweekly">Biweekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowEventDialog(false)}
              >
                Close
              </Button>
              {dialogEvent && (
                <>
                  <Button
                    variant="default"
                    className="cursor-pointer"
                    onClick={handleSaveEventEdits}
                    disabled={!editTitle || !editDate || !editTime}
                  >
                    <Edit3 className="w-4 h-4 mr-1" /> Save Changes
                  </Button>
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={handleDeleteSingle}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showConfirmDeleteDialog}
          onOpenChange={setShowConfirmDeleteDialog}
        >
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {deleteTargetIds.length}{" "}
                event(s)? Deleting the event(s) will also delete all events in
                the series.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowConfirmDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={doDeleteEvents}
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}
