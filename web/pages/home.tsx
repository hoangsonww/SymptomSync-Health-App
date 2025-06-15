import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import {
  Pill,
  Calendar as CalendarIcon,
  Heart,
  Edit3,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  HeartPulse,
  Clock,
  Thermometer,
} from "lucide-react";
import {
  MedicationReminder,
  getPaginatedMedicationRemindersByUser,
  getMedicationRemindersByUser,
  createMedicationReminder,
  updateMedicationReminder,
  deleteMedicationReminder,
} from "@/lib/medications";
import {
  AppointmentReminder,
  getPaginatedAppointmentRemindersByUser,
  getAppointmentRemindersByUser,
  createAppointmentReminder,
  updateAppointmentReminder,
  deleteAppointmentReminder,
} from "@/lib/appointmentReminders";
import {
  HealthLog,
  getPaginatedHealthLogsByUser,
  getHealthLogsByUser,
  createHealthLog,
  updateHealthLog,
  deleteHealthLog,
} from "@/lib/healthLogs";
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
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PolarAreaController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut, Radar, PolarArea } from "react-chartjs-2";
import Head from "next/head";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomTimePicker } from "@/components/ui/time-picker";
import { BarcodeScanModal, MedInfo } from "@/components/ScanMedication";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PolarAreaController,
  Title,
  Tooltip,
  Legend,
);

/**
 * This hook checks if an element is in the viewport using the Intersection Observer API.
 * It sets up an observer on the provided ref and updates the visibility state
 * when the element comes into view.
 *
 * @param ref - The ref of the element to observe
 * @param rootMargin - The margin around the root element
 * @returns - A boolean indicating whether the element is in view
 */
function useInView(
  ref: React.RefObject<Element>,
  rootMargin = "0px 0px -20% 0px",
): boolean {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin, visible]);

  return visible;
}

/**
 * This component lazily loads its children when it comes into view.
 * It uses the useInView hook to determine if the element is in the viewport.
 *
 * @param param0 - The props for the LazyChart component
 * @returns - A div that lazily loads its children when in view
 */
function LazyChart({
  height = "250px",
  children,
}: {
  height?: string | number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const show = useInView(ref);

  return (
    <div
      ref={ref}
      style={{ minHeight: typeof height === "number" ? `${height}px` : height }}
      className="w-full h-full flex items-center justify-center"
    >
      {show ? children : null}
    </div>
  );
}

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

/**
 * Returns a friendly greeting based on the current hour of the day
 *
 * @returns A greeting string, e.g., "Good Morning", "Good Afternoon", or "Good Evening".
 */
function getGreetingParts(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: "Good Morning", emoji: "☀️" };
  if (hour < 18) return { greeting: "Good Afternoon", emoji: "⛅" };
  return { greeting: "Good Evening", emoji: "🌙" };
}

/**
 * A helper function to display a string value safely, avoiding
 * showing "null" or "undefined".
 *
 * @param val - The string or null/undefined value to display
 * @returns A safe display string.
 */
function safeDisplay(val: string | null | undefined): string {
  return val && val.trim() !== "" ? val : "N/A";
}

/**
 * Function to animate a counter from 0 to a given value
 *
 * @param param0 - The value to animate to and the duration of the animation
 * @returns A span element containing the animated number
 */
function AnimatedCounter({
  value,
  duration = 700,
}: {
  value: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const totalSteps = 30;
    const increment = (end - start) / totalSteps;
    let current = start;
    let steps = 0;

    const timer = setInterval(() => {
      steps += 1;
      current += increment;
      if (steps >= totalSteps || current >= end) {
        current = end;
        clearInterval(timer);
      }
      setCount(Math.floor(current));
    }, duration / totalSteps);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<AppointmentReminder[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [totalMeds, setTotalMeds] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [addApptOpen, setAddApptOpen] = useState(false);
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedDosageUnit, setNewMedDosageUnit] = useState("mg");
  const [newMedDate, setNewMedDate] = useState<Date | undefined>(undefined);
  const [newMedTimePicker, setNewMedTimePicker] = useState("00:00");
  const [newMedRecurrence, setNewMedRecurrence] = useState("Daily");
  const [newMedCalendarSync, setNewMedCalendarSync] = useState("");
  const [newApptName, setNewApptName] = useState("");
  const [newApptDate, setNewApptDate] = useState<Date | undefined>(undefined);
  const [newApptTime, setNewApptTime] = useState("00:00");
  const [hlSymptomType, setHlSymptomType] = useState("");
  const [hlSeverity, setHlSeverity] = useState<number>(0);
  const [hlMood, setHlMood] = useState("");
  const [hlHeartRate, setHlHeartRate] = useState("");
  const [hlBloodPressureSys, setHlBloodPressureSys] = useState("");
  const [hlBloodPressureDia, setHlBloodPressureDia] = useState("");
  const [hlMedIntakeNumber, setHlMedIntakeNumber] = useState("");
  const [hlMedIntakeUnit, setHlMedIntakeUnit] = useState("mg");
  const [hlNotes, setHlNotes] = useState("");
  const [hlStartDatePicker, setHlStartDatePicker] = useState<Date | undefined>(
    undefined,
  );
  const [hlStartTimePicker, setHlStartTimePicker] = useState("00:00");
  const [hlEndDatePicker, setHlEndDatePicker] = useState<Date | undefined>(
    undefined,
  );
  const [hlEndTimePicker, setHlEndTimePicker] = useState("00:00");
  const [editingMed, setEditingMed] = useState<MedicationReminder | null>(null);
  const [editMedName, setEditMedName] = useState("");
  const [editMedDosage, setEditMedDosage] = useState("");
  const [editMedDosageUnit, setEditMedDosageUnit] = useState("mg");
  const [editMedDate, setEditMedDate] = useState<Date | undefined>(undefined);
  const [editMedTimePicker, setEditMedTimePicker] = useState("00:00");
  const [editMedRecurrence, setEditMedRecurrence] = useState("Daily");
  const [editMedCalendarSync, setEditMedCalendarSync] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentReminder | null>(
    null,
  );
  const [editApptName, setEditApptName] = useState("");
  const [editApptDate, setEditApptDate] = useState<Date | undefined>(undefined);
  const [editApptTime, setEditApptTime] = useState("");
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  const [editSymptomType, setEditSymptomType] = useState("");
  const [editSeverity, setEditSeverity] = useState<number>(0);
  const [editMood, setEditMood] = useState("");
  const [editHeartRate, setEditHeartRate] = useState("");
  const [editBloodPressureSys, setEditBloodPressureSys] = useState("");
  const [editBloodPressureDia, setEditBloodPressureDia] = useState("");
  const [editMedIntakeNumber, setEditMedIntakeNumber] = useState("");
  const [editMedIntakeUnit, setEditMedIntakeUnit] = useState("mg");
  const [editNotes, setEditNotes] = useState("");
  const [editStartDatePicker, setEditStartDatePicker] = useState<
    Date | undefined
  >(undefined);
  const [editStartTimePicker, setEditStartTimePicker] = useState("00:00");
  const [editEndDatePicker, setEditEndDatePicker] = useState<Date | undefined>(
    undefined,
  );
  const [editEndTimePicker, setEditEndTimePicker] = useState("00:00");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRefs: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);
  const router = useRouter();
  const [showDeleteLogDialog, setShowDeleteLogDialog] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [showDeleteMedDialog, setShowDeleteMedDialog] = useState(false);
  const [deleteMedId, setDeleteMedId] = useState<string | null>(null);
  const [showDeleteApptDialog, setShowDeleteApptDialog] = useState(false);
  const [deleteApptId, setDeleteApptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medPage, setMedPage] = useState(1);
  const [apptPage, setApptPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [allMedications, setAllMedications] = useState<MedicationReminder[]>(
    [],
  );
  const [allAppointments, setAllAppointments] = useState<AppointmentReminder[]>(
    [],
  );
  const [allLogs, setAllLogs] = useState<HealthLog[]>([]);
  const [viewingMed, setViewingMed] = useState<MedicationReminder | null>(null);
  const [viewingAppt, setViewingAppt] = useState<AppointmentReminder | null>(
    null,
  );
  const [viewingLog, setViewingLog] = useState<HealthLog | null>(null);

  const [medSearch, setMedSearch] = useState("");
  const [debouncedMedSearch, setDebouncedMedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedMedSearch(medSearch), 300);
    return () => clearTimeout(t);
  }, [medSearch]);
  useEffect(() => {
    setMedPage(1);
  }, [debouncedMedSearch]);

  const [apptSearch, setApptSearch] = useState("");
  const [debouncedApptSearch, setDebouncedApptSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedApptSearch(apptSearch), 300);
    return () => clearTimeout(t);
  }, [apptSearch]);
  useEffect(() => {
    setApptPage(1);
  }, [debouncedApptSearch]);

  const [logSearch, setLogSearch] = useState("");
  const [debouncedLogSearch, setDebouncedLogSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLogSearch(logSearch), 300);
    return () => clearTimeout(t);
  }, [logSearch]);
  useEffect(() => {
    setLogPage(1);
  }, [debouncedLogSearch]);

  /**
   * This function fetches all data for the user, including medications, appointments, and health logs
   * from the database. It uses Promise.all to fetch all data concurrently to improve performance
   *
   * @param uid - The user ID
   */
  async function fetchAllData(uid: string) {
    try {
      const [medRes, apptsRes, userLogs] = await Promise.all([
        getPaginatedMedicationRemindersByUser(uid, medPage, 30),
        getPaginatedAppointmentRemindersByUser(uid, apptPage, 50),
        getPaginatedHealthLogsByUser(uid, logPage, 20),
      ]);

      setMedications(medRes.data);
      setAppointments(apptsRes.data);
      setLogs(userLogs.data);
      setTotalMeds(medRes.count);
      setTotalAppointments(apptsRes.count);
      setTotalLogs(userLogs.count);

      await fetchAllRecords(uid);

      setIsLoading(false);
    } catch (err) {
      toast.error("Error fetching data.");
      console.error("Error fetching data:", err);
      setIsLoading(false);
    }
  }

  /**
   * Fetches all records (medications, appointments, and health logs) for the user
   * from the database. This is used to update the state when a new record is added
   * from another device or tab.
   *
   * @param uid - The user ID
   */
  async function fetchAllRecords(uid: string) {
    try {
      const [meds, appts, logs] = await Promise.all([
        getMedicationRemindersByUser(uid),
        getAppointmentRemindersByUser(uid),
        getHealthLogsByUser(uid),
      ]);
      setAllMedications(meds);
      setAllAppointments(appts);
      setAllLogs(logs);
    } catch (err) {
      console.error("Error fetching all records:", err);
      toast.error("Error loading chart data.");
    }
  }

  useEffect(() => {
    if (userId) fetchAllData(userId);
  }, [userId, medPage, apptPage, logPage]);

  /**
   * This function sends a broadcast message to all connected clients using the Supabase
   * broadcast channel. It is used to notify other devices or tabs when a new medication,
   * appointment, or health log is added
   *
   * @param eventName - The name of the event to broadcast
   * @param message - The message to send
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
   * Supabase Realtime #1: Listens for changes in the database (in terms of medication,
   * appointments, and health logs) and updates the state accordingly
   *
   * For example, if the user adds a new med from another device, it will be reflected
   * in the UI in the current device without needing to refresh the page. Same for
   * appointments and health logs
   */
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;
      setUserId(user.id);

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      await fetchAllData(user.id);

      const medsChannel = supabase.channel("medicationChanges");
      medsChannel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
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
          () => {
            if (isMounted) fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "medication_reminders",
          },
          () => {
            fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.push(medsChannel);

      const apptsChannel = supabase.channel("appointmentChanges");
      apptsChannel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "appointment_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
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
          () => {
            if (isMounted) fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "appointment_reminders",
          },
          () => {
            fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.push(apptsChannel);

      const logsChannel = supabase.channel("healthLogChanges");
      logsChannel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "health_logs",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "health_logs",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "health_logs",
          },
          () => {
            fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.push(logsChannel);
    }

    init();

    return () => {
      isMounted = false;
      channelRefs.forEach((ch) => {
        supabase.removeChannel(ch);
      });
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
   * Adds a new medication reminder for the user
   */
  async function handleAddMedication() {
    if (!userId || !newMedName || !newMedDate) return;
    try {
      const dateString = format(newMedDate, "yyyy-MM-dd");
      const combined = `${dateString}T${newMedTimePicker}`;
      const localDate = new Date(combined);
      const combinedDosage = newMedDosage
        ? `${newMedDosage} ${newMedDosageUnit}`
        : "";

      await createMedicationReminder({
        user_profile_id: userId,
        medication_name: newMedName,
        dosage: combinedDosage || null,
        reminder_time: localDate.toISOString(),
        recurrence: newMedRecurrence || null,
        calendar_sync_token: newMedCalendarSync || null,
      });

      sendBroadcast(
        "med-add",
        `New medication reminder "${newMedName}" added.`,
      );

      await fetchAllData(userId);

      setNewMedName("");
      setNewMedDosage("");
      setNewMedDosageUnit("mg");
      setNewMedDate(undefined);
      setNewMedTimePicker("00:00");
      setNewMedRecurrence("Daily");
      setNewMedCalendarSync("");
      setAddMedOpen(false);
      toast.success("Medication reminder added successfully!");
    } catch (err) {
      console.error("Error creating medication:", err);
      toast.error("Error creating medication reminder.");
    }
  }

  /**
   * Adds a new appointment reminder for the user
   */
  async function handleAddAppointment() {
    if (!userId || !newApptName || !newApptDate) return;
    try {
      const dateString = format(newApptDate, "yyyy-MM-dd");
      const combined = `${dateString}T${newApptTime}`;
      const localDate = new Date(combined);
      const isoString = localDate.toISOString();

      await createAppointmentReminder({
        user_profile_id: userId,
        appointment_name: newApptName,
        date: isoString,
      });

      sendBroadcast(
        "appt-add",
        `New appointment reminder "${newApptName}" added.`,
      );

      await fetchAllData(userId);

      setNewApptName("");
      setNewApptDate(undefined);
      setNewApptTime("");
      setAddApptOpen(false);
      toast.success("Appointment reminder added successfully!");
    } catch (err) {
      toast.error("Error creating appointment reminder.");
      console.error("Error creating appointment:", err);
    }
  }

  /**
   * Adds a new health log for the user
   */
  async function handleAddHealthLog() {
    if (!userId) return;

    try {
      const localStart = hlStartDatePicker
        ? new Date(
            `${format(hlStartDatePicker, "yyyy-MM-dd")}T${hlStartTimePicker}`,
          )
        : new Date();
      const startISO = localStart.toISOString();
      const localEnd = hlEndDatePicker
        ? new Date(
            `${format(hlEndDatePicker, "yyyy-MM-dd")}T${hlEndTimePicker}`,
          )
        : new Date();
      const endISO = localEnd.toISOString();

      const bpString =
        hlBloodPressureSys && hlBloodPressureDia
          ? `${hlBloodPressureSys}/${hlBloodPressureDia} mmHg`
          : "";

      const medIntakeString = hlMedIntakeNumber
        ? `${hlMedIntakeNumber} ${hlMedIntakeUnit}`
        : "";

      const vitalsObj = {
        heartRate: hlHeartRate ? `${hlHeartRate} BPM` : null,
        bloodPressure: bpString || null,
      };

      await createHealthLog({
        user_profile_id: userId,
        symptom_type: hlSymptomType || null,
        severity: hlSeverity,
        mood: hlMood || null,
        vitals: JSON.stringify(vitalsObj),
        medication_intake: medIntakeString || null,
        notes: hlNotes || null,
        start_date: startISO,
        end_date: endISO,
      });

      sendBroadcast("log-add", `New health log added successfully.`);

      await fetchAllData(userId);

      setHlSymptomType("");
      setHlSeverity(0);
      setHlMood("");
      setHlHeartRate("");
      setHlBloodPressureSys("");
      setHlBloodPressureDia("");
      setHlMedIntakeNumber("");
      setHlMedIntakeUnit("mg");
      setHlNotes("");
      setHlStartDatePicker(undefined);
      setHlStartTimePicker("00:00");
      setHlEndDatePicker(undefined);
      setHlEndTimePicker("00:00");
      setAddLogOpen(false);
      toast.success("Health log added successfully!");
    } catch (err) {
      toast.error("Error creating health log.");
      console.error("Error creating health log:", err);
    }
  }

  /**
   * Opens the edit dialog for a medication reminder
   */
  function openEditMedDialog(med: MedicationReminder) {
    setEditingMed(med);
    setEditMedName(med.medication_name);

    if (med.dosage) {
      const parts = med.dosage.split(" ");
      setEditMedDosage(parts[0] || "");
      setEditMedDosageUnit(parts[1] || "mg");
    } else {
      setEditMedDosage("");
      setEditMedDosageUnit("mg");
    }
    const medDate = new Date(med.reminder_time);
    setEditMedDate(medDate);
    setEditMedTimePicker(medDate.toTimeString().slice(0, 5));
    setEditMedRecurrence(med.recurrence ?? "Daily");
    setEditMedCalendarSync(med.calendar_sync_token ?? "");
  }

  /**
   * Handles the update of a medication reminder
   */
  async function handleUpdateMed() {
    if (!editingMed || !userId || !editMedDate) return;
    try {
      const dateString = format(editMedDate, "yyyy-MM-dd");
      const combined = `${dateString}T${editMedTimePicker}`;
      const isoString = new Date(combined).toISOString();

      const combinedDosage = editMedDosage
        ? `${editMedDosage} ${editMedDosageUnit}`
        : "";

      await updateMedicationReminder(editingMed.id, {
        medication_name: editMedName,
        dosage: combinedDosage,
        reminder_time: isoString,
        recurrence: editMedRecurrence,
        calendar_sync_token: editMedCalendarSync,
      });

      sendBroadcast(
        "med-update",
        `Medication reminder "${editMedName}" updated successfully.`,
      );

      await fetchAllData(userId);
      setEditingMed(null);
      toast.success("Medication reminder updated successfully!");
    } catch (err) {
      toast.error("Error updating medication reminder.");
      console.error("Error updating medication:", err);
    }
  }

  /**
   * Opens the edit dialog for an appointment reminder
   */
  function openEditApptDialog(appt: AppointmentReminder) {
    setEditingAppt(appt);
    setEditApptName(appt.appointment_name);

    const d = new Date(appt.date);
    setEditApptDate(d);
    setEditApptTime(d.toTimeString().slice(0, 5));
  }

  /**
   * Handles the update of an appointment reminder
   */
  async function handleUpdateAppt() {
    if (!editingAppt || !userId || !editApptDate) return;
    try {
      const dateString = format(editApptDate, "yyyy-MM-dd");
      const combined = `${dateString}T${editApptTime}`;
      const isoString = new Date(combined).toISOString();

      await updateAppointmentReminder(editingAppt.id, {
        appointment_name: editApptName,
        date: isoString,
      });

      sendBroadcast(
        "appt-update",
        `Appointment reminder "${editApptName}" updated successfully.`,
      );

      await fetchAllData(userId);
      setEditingAppt(null);
      toast.success("Appointment reminder updated successfully!");
    } catch (err) {
      toast.error("Error updating appointment reminder.");
      console.error("Error updating appointment:", err);
    }
  }

  /**
   * Opens the edit dialog for a health log
   */
  function openEditLogDialog(log: HealthLog) {
    setEditingLog(log);
    setEditSymptomType(log.symptom_type ?? "");
    setEditSeverity(log.severity ?? 0);
    setEditMood(log.mood ?? "");
    setEditNotes(log.notes ?? "");

    const start = new Date(log.start_date);
    setEditStartDatePicker(start);
    setEditStartTimePicker(start.toTimeString().slice(0, 5));

    if (log.end_date) {
      const end = new Date(log.end_date);
      setEditEndDatePicker(end);
      setEditEndTimePicker(end.toTimeString().slice(0, 5));
    } else {
      setEditEndDatePicker(undefined);
      setEditEndTimePicker("00:00");
    }

    let heartRateStr = "";
    if (log.vitals) {
      try {
        const v =
          typeof log.vitals === "string" ? JSON.parse(log.vitals) : log.vitals;
        if (v.heartRate) {
          const hrParts = v.heartRate.split(" ");
          heartRateStr = hrParts[0] || "";
        }
        if (v.bloodPressure) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [sysDia, _unit] = v.bloodPressure.split(" ");
          if (sysDia) {
            const [sys, dia] = sysDia.split("/");
            setEditBloodPressureSys(sys || "");
            setEditBloodPressureDia(dia || "");
          }
        }
      } catch {
        /* fallback */
      }
    }
    setEditHeartRate(heartRateStr);

    let medsIntakeNumber = "";
    let medsIntakeUnit = "mg";

    if (log.medication_intake) {
      const parts = log.medication_intake.split(" ");
      medsIntakeNumber = parts[0] || "";
      medsIntakeUnit = parts[1] || "mg";
    }

    setEditMedIntakeNumber(medsIntakeNumber);
    setEditMedIntakeUnit(medsIntakeUnit);
  }

  /**
   * Handles updating a health log in the database
   */
  async function handleUpdateLog() {
    if (!editingLog || !userId || !editStartDatePicker) return;
    try {
      const startCombined = `${format(editStartDatePicker, "yyyy-MM-dd")}T${editStartTimePicker}`;
      const startISO = new Date(startCombined).toISOString();
      const endCombined = editEndDatePicker
        ? `${format(editEndDatePicker, "yyyy-MM-dd")}T${editEndTimePicker}`
        : "";
      const endISO = endCombined
        ? new Date(endCombined).toISOString()
        : new Date().toISOString();

      const bpString =
        editBloodPressureSys && editBloodPressureDia
          ? `${editBloodPressureSys}/${editBloodPressureDia} mmHg`
          : "";
      const hrString = editHeartRate ? `${editHeartRate} BPM` : "";
      const vitalsObj = {
        heartRate: hrString || null,
        bloodPressure: bpString || null,
      };

      const medIntakeString = editMedIntakeNumber
        ? `${editMedIntakeNumber} ${editMedIntakeUnit}`
        : "";

      await updateHealthLog(editingLog.id, {
        symptom_type: editSymptomType,
        severity: editSeverity,
        mood: editMood,
        vitals: JSON.stringify(vitalsObj),
        medication_intake: medIntakeString,
        notes: editNotes,
        start_date: startISO,
        end_date: endISO,
      });

      sendBroadcast("log-update", `Health log updated successfully.`);

      await fetchAllData(userId);
      setEditingLog(null);
      toast.success("Health log updated successfully!");
    } catch (err) {
      toast.error("Error updating health log.");
      console.error("Error updating health log:", err);
    }
  }

  /**
   * Deletes a medication reminder
   */
  async function handleDeleteMedication(id: string) {
    if (!userId) return;
    try {
      await deleteMedicationReminder(id);
      await fetchAllData(userId);
      sendBroadcast("med-delete", `Medication reminder deleted successfully.`);
      toast.success("Medication reminder deleted successfully!");
    } catch (err) {
      toast.error("Error deleting medication reminder.");
      console.error("Error deleting medication:", err);
    }
  }

  /**
   * Deletes an appointment reminder
   */
  async function handleDeleteAppointment(id: string) {
    if (!userId) return;
    try {
      await deleteAppointmentReminder(id);
      await fetchAllData(userId);
      sendBroadcast(
        "appt-delete",
        `Appointment reminder deleted successfully.`,
      );
      toast.success("Appointment reminder deleted successfully!");
    } catch (err) {
      toast.error("Error deleting appointment reminder.");
      console.error("Error deleting appointment:", err);
    }
  }

  /**
   * Deletes a health log
   */
  async function handleDeleteLog(id: string) {
    if (!userId) return;
    try {
      await deleteHealthLog(id);
      await fetchAllData(userId);
      sendBroadcast("log-delete", `Health log deleted successfully.`);
      toast.success("Health log deleted successfully!");
    } catch (err) {
      toast.error("Error deleting health log.");
      console.error("Error deleting health log:", err);
    }
  }

  /**
   * Filters the medications, appointments, and health logs based on the search input
   * and pagination
   */
  const filteredMeds = allMedications.filter((m) =>
    m.medication_name
      .toLowerCase()
      .includes(debouncedMedSearch.trim().toLowerCase()),
  );

  const medsForDisplay = debouncedMedSearch.trim()
    ? filteredMeds
    : allMedications;
  const medsTotalPages = Math.max(1, Math.ceil(medsForDisplay.length / 30));
  const medsPageItems = medsForDisplay
    .slice((medPage - 1) * 30, medPage * 30)
    .sort(
      (a, b) =>
        new Date(a.reminder_time).getTime() -
        new Date(b.reminder_time).getTime(),
    );

  const filteredAppts = allAppointments.filter((a) =>
    a.appointment_name
      .toLowerCase()
      .includes(debouncedApptSearch.trim().toLowerCase()),
  );

  const apptsForDisplay = debouncedApptSearch.trim()
    ? filteredAppts
    : allAppointments;
  const apptTotalPages = Math.max(1, Math.ceil(apptsForDisplay.length / 50));
  const apptPageItems = apptsForDisplay
    .slice((apptPage - 1) * 50, apptPage * 50)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredLogs = allLogs.filter((l) => {
    const t = debouncedLogSearch.trim().toLowerCase();
    return (
      l.symptom_type?.toLowerCase().includes(t) ||
      l.notes?.toLowerCase().includes(t)
    );
  });

  const logsForDisplay = debouncedLogSearch.trim() ? filteredLogs : allLogs;
  const logsTotalPages = Math.max(1, Math.ceil(logsForDisplay.length / 20));
  const logsPageItems = logsForDisplay
    .slice((logPage - 1) * 20, logPage * 20)
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );

  const { greeting, emoji } = getGreetingParts();

  const colorSet = [
    "#344966",
    "#F97F51",
    "#EAD637",
    "#4CD137",
    "#FF577F",
    "#9A6AFF",
    "#00BDA5",
    "#FF8C00",
    "#00A8E8",
    "#9B5DE5",
    "#F15BB5",
    "#7D7D7D",
  ];

  /**
   * For the Health Trends charts, sometimes there are too many data points
   * which makes the chart unreadable. So, this logic takes every health log,
   * groups them by calendar day, sums and counts the severities for each day
   * to obtain a daily average, orders those days chronologically. If the
   * series would exceed a readability threshold (50 data points) then we
   * compresses it by slicing the timeline into equal windows and
   * replacing each window with a single representative point
   * (which is its first date and the window’s average severity).
   */
  const severityBucket: Record<string, { sum: number; n: number }> = {};

  allLogs.forEach((l) => {
    const d = format(new Date(l.start_date), "yyyy-MM-dd");
    const sev = l.severity ?? 0;
    if (!severityBucket[d]) severityBucket[d] = { sum: 0, n: 0 };
    severityBucket[d].sum += sev;
    severityBucket[d].n += 1;
  });

  const dayLabels = Object.keys(severityBucket).sort();
  const dayValues = dayLabels.map(
    (d) => +(severityBucket[d].sum / severityBucket[d].n).toFixed(2),
  );

  const MAX_POINTS = 50;
  if (dayLabels.length > MAX_POINTS) {
    const step = Math.ceil(dayLabels.length / MAX_POINTS);
    const sampledLabels: string[] = [];
    const sampledValues: number[] = [];

    for (let i = 0; i < dayLabels.length; i += step) {
      const slice = dayValues.slice(i, i + step);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      sampledLabels.push(dayLabels[i]);
      sampledValues.push(+avg.toFixed(2));
    }

    // overwrite with the sampled arrays
    dayLabels.splice(0, dayLabels.length, ...sampledLabels);
    dayValues.splice(0, dayValues.length, ...sampledValues);
  }

  const severityLabels = dayLabels;

  const severityLineData = {
    labels: dayLabels,
    datasets: [
      {
        label: "Avg. Symptom Severity (lower is better)",
        data: dayValues,
        borderColor: colorSet[0],
        backgroundColor: colorSet[0],
        tension: 0.2,
        fill: false,
      },
    ],
  };

  const apptsCountMap: Record<string, number> = {};
  allAppointments.forEach((a) => {
    const d = format(new Date(a.date), "yyyy-MM-dd");
    apptsCountMap[d] = (apptsCountMap[d] || 0) + 1;
  });
  const apptLabels = Object.keys(apptsCountMap).sort();
  const apptValues = apptLabels.map((d) => apptsCountMap[d]);
  const appointmentsBarData = {
    labels: apptLabels,
    datasets: [
      {
        label: "Appointments by Day",
        data: apptValues,
        backgroundColor: colorSet[1],
        borderColor: colorSet[1],
        borderWidth: 1,
      },
    ],
  };

  const symptomFreqMap: Record<string, number> = {};
  allLogs.forEach((l) =>
    (l.symptom_type || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => (symptomFreqMap[s] = (symptomFreqMap[s] || 0) + 1)),
  );
  const doughnutLabels = Object.keys(symptomFreqMap);
  const doughnutValues = doughnutLabels.map((k) => symptomFreqMap[k]);
  const symptomDoughnutData = {
    labels: doughnutLabels,
    datasets: [
      {
        label: "Symptom Distribution",
        data: doughnutValues,
        backgroundColor: doughnutLabels.map(
          (_, i) => colorSet[i % colorSet.length],
        ),
      },
    ],
  };

  const moodCountMap: Record<string, number> = {};
  allLogs.forEach((l) => {
    const m = (l.mood || "").toLowerCase();
    if (m) moodCountMap[m] = (moodCountMap[m] || 0) + 1;
  });
  const moodLabels = Object.keys(moodCountMap).map(
    (m) => m.charAt(0).toUpperCase() + m.slice(1),
  );
  const moodValues = moodLabels.map((m) => moodCountMap[m.toLowerCase()]);
  const moodRadarData = {
    labels: moodLabels,
    datasets: [
      {
        label: "Mood Distribution",
        data: moodValues,
        backgroundColor: colorSet[2],
        borderColor: colorSet[2],
      },
    ],
  };

  const sevCount: Record<number, number> = {};
  allLogs.forEach((l) => {
    const s = l.severity ?? 0;
    sevCount[s] = (sevCount[s] || 0) + 1;
  });
  const polarSeverityLabels = Object.keys(sevCount).sort();
  const polarSeverityValues = polarSeverityLabels.map((k) => sevCount[+k]);
  const severityPolarData = {
    labels: polarSeverityLabels.map((l) => `Severity ${l}`),
    datasets: [
      {
        label: "Severity Distribution",
        data: polarSeverityValues,
        backgroundColor: polarSeverityValues.map(
          (_, i) => colorSet[i % colorSet.length],
        ),
      },
    ],
  };

  const apptHourMap: Record<number, number> = {};
  allAppointments.forEach((a) => {
    const hr = new Date(a.date).getHours();
    apptHourMap[hr] = (apptHourMap[hr] || 0) + 1;
  });
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourValues = hourLabels.map((l) => apptHourMap[+l.split(":")[0]] || 0);
  const appointmentsHourBarData = {
    labels: hourLabels,
    datasets: [
      {
        label: "Appointments by Hour",
        data: hourValues,
        backgroundColor: colorSet[3],
        borderColor: colorSet[3],
        borderWidth: 1,
      },
    ],
  };

  const recMap: Record<string, number> = {};
  allMedications.forEach((m) => {
    const r = m.recurrence || "N/A";
    recMap[r] = (recMap[r] || 0) + 1;
  });
  const recurrenceLabels = Object.keys(recMap);
  const recurrenceValues = recurrenceLabels.map((k) => recMap[k]);
  const medicationRecurrenceData = {
    labels: recurrenceLabels,
    datasets: [
      {
        label: "Medications by Recurrence",
        data: recurrenceValues,
        backgroundColor: recurrenceLabels.map(
          (_, i) => colorSet[i % colorSet.length],
        ),
      },
    ],
  };

  const { theme, resolvedTheme } = useTheme();
  const effectiveTheme = theme === "system" ? resolvedTheme : theme;
  const tickColor = effectiveTheme === "dark" ? "#ffffff" : "#000000";
  const gridColor =
    effectiveTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const basePlugins = {
    legend: {
      labels: {
        color: tickColor,
      },
    },
    tooltip: {
      titleColor: effectiveTheme === "light" ? "#ffffff" : tickColor,
      bodyColor: effectiveTheme === "light" ? "#ffffff" : tickColor,
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: basePlugins,
    scales: {},
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: basePlugins,
    scales: {
      r: {
        grid: {
          display: true,
          color: gridColor,
          circular: false,
        },
        angleLines: {
          display: true,
          color: gridColor,
        },
        ticks: {
          display: false,
        },
        pointLabels: {
          color: tickColor,
        },
      },
    },
  };

  const polarAreaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: basePlugins,
    scales: {
      r: {
        grid: {
          display: true,
          color: gridColor,
          circular: true,
        },
        angleLines: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: basePlugins,
    scales: {
      x: {
        ticks: {
          color: tickColor,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        ticks: {
          color: tickColor,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  /**
   * This function returns the style object for the staggered animation
   * for each card in the dashboard
   *
   * @param index - The index of the card to apply staggered animation
   * @returns - The style object for the card
   */
  const getStaggerStyle = (index: number) => ({
    animationDelay: `${0.1 + index * 0.05}s`,
  });

  return (
    <>
      <Head>
        <title>SymptomSync | Home</title>
        <meta name="description" content="Your personal health dashboard." />
      </Head>

      <motion.div
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative p-6 md:p-8 flex-1 overflow-y-auto space-y-8"
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

        <motion.div variants={slideInLeft}>
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {userName} {emoji}!
          </h1>
          <motion.p
            variants={fadeInUp}
            className="text-sm md:text-base text-foreground"
          >
            Let&apos;s make today a little healther ~
          </motion.p>
        </motion.div>

        <div
          className="flex flex-wrap gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <Button
            variant="default"
            onClick={() => setAddMedOpen(true)}
            className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          >
            <Pill className="w-4 h-4" /> Add Medication
          </Button>
          <Button
            variant="default"
            onClick={() => setAddApptOpen(true)}
            className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" /> Add Appointment
          </Button>
          <Button
            variant="default"
            onClick={() => setAddLogOpen(true)}
            className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          >
            <Heart className="w-4 h-4" /> Add Health Log
          </Button>
        </div>

        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[
            { label: "Total Medications", value: totalMeds },
            { label: "Total Appointments", value: totalAppointments },
            { label: "Total Health Logs", value: totalLogs },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              custom={idx}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card
                key={stat.label}
                className="bg-card border border-border rounded-lg p-4 pt-6 min-w-[280px] gap-0 text-center transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101"
                style={getStaggerStyle(idx)}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    <AnimatedCounter value={stat.value} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="bg-card border border-border rounded-lg min-w-[280px] w-full pt-4 transition-all hover:shadow-xl h-auto min-h-[450px] hover:-translate-y-1 hover:scale-101">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Overall Health Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="relative w-full h-full">
              {severityLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No logs available for severity trend.
                </p>
              ) : (
                <div className="w-full h-[380px]">
                  <Line data={severityLineData} options={defaultChartOptions} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
        >
          <motion.div custom={0} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
              <CardHeader>
                <CardTitle>Appointments by Day</CardTitle>
              </CardHeader>
              <CardContent className="relative w-full h-full">
                {apptLabels.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No appointments found.
                  </p>
                ) : (
                  <div className="w-full h-[250px]">
                    <LazyChart>
                      <Bar
                        data={appointmentsBarData}
                        options={defaultChartOptions}
                      />
                    </LazyChart>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={1} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
              <CardHeader>
                <CardTitle>Symptom Distribution</CardTitle>
              </CardHeader>
              <CardContent className="relative w-full h-full">
                {doughnutLabels.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No symptoms recorded.
                  </p>
                ) : (
                  <div className="w-full h-[250px]">
                    <LazyChart>
                      <Doughnut
                        data={symptomDoughnutData}
                        options={doughnutOptions}
                      />
                    </LazyChart>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent className="relative w-full h-full">
                {moodLabels.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No mood data recorded.
                  </p>
                ) : (
                  <div className="w-full h-[250px]">
                    <LazyChart>
                      <Radar data={moodRadarData} options={radarOptions} />
                    </LazyChart>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent className="relative w-full h-full">
                {polarSeverityLabels.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No severity data found.
                  </p>
                ) : (
                  <div className="w-full h-[250px]">
                    <LazyChart>
                      <PolarArea
                        data={severityPolarData}
                        options={polarAreaOptions}
                      />
                    </LazyChart>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={4} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
              <CardHeader>
                <CardTitle>Appointments by Hour</CardTitle>
              </CardHeader>
              <CardContent className="relative w-full h-full">
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No appointment hours found.
                  </p>
                ) : (
                  <div className="w-full h-[250px]">
                    <LazyChart>
                      <Bar
                        data={appointmentsHourBarData}
                        options={defaultChartOptions}
                      />
                    </LazyChart>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={5} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
              <CardHeader>
                <CardTitle>Medications by Recurrence</CardTitle>
              </CardHeader>
              <CardContent className="relative w-full h-full">
                {recurrenceLabels.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No medications to display.
                  </p>
                ) : (
                  <div className="w-full h-[250px]">
                    <LazyChart>
                      <Bar
                        data={medicationRecurrenceData}
                        options={defaultChartOptions}
                      />
                    </LazyChart>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
        >
          <motion.div custom={0} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg min-w-[280px] transition-all hover:shadow-xl p-0">
              <CardHeader className="mt-8 text-xl">
                <CardTitle>Medications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm pb-4">
                <div className="relative mb-4 mt-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search medications…"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {medsPageItems.map((med, idx) => (
                  <div
                    key={med.id}
                    className="p-4 rounded-lg border border-gray-200 bg-background text-foreground shadow-sm hover:shadow-lg transition-transform duration-300 cursor-pointer mb-4"
                    style={getStaggerStyle(idx)}
                    onClick={() => setViewingMed(med)}
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-foreground0">
                        💊 {safeDisplay(med.medication_name)}
                      </h3>
                    </div>
                    <div className="text-sm text-foreground space-y-1">
                      <p>
                        <strong>Dosage:</strong> {safeDisplay(med.dosage)}
                      </p>
                      <div className="flex items-center flex-wrap">
                        <p className="font-bold mr-1 inline">Schedule:</p>
                        <span className="inline-flex items-center gap-1">
                          <span>
                            {new Date(med.reminder_time).toLocaleDateString()}
                          </span>
                          <span>at</span>
                          <span>
                            {new Date(med.reminder_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </span>
                      </div>
                      <p>
                        <strong>Recurrence:</strong>{" "}
                        {safeDisplay(med.recurrence)}
                      </p>
                      <p>
                        <strong>Created:</strong>{" "}
                        {new Date(med.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditMedDialog(med);
                        }}
                        className="flex items-center hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 mr-1" /> View / Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteMedId(med.id);
                          setShowDeleteMedDialog(true);
                        }}
                        className="flex items-center hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between py-2">
                  <Button
                    size="sm"
                    onClick={() => setMedPage((p) => Math.max(p - 1, 1))}
                    disabled={medPage <= 1}
                    className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    <ChevronLeft />
                    Previous
                  </Button>

                  <span>
                    Page {medPage} of {medsTotalPages}
                  </span>

                  <Button
                    size="sm"
                    onClick={() =>
                      setMedPage((p) =>
                        p < Math.ceil(totalMeds / 30) ? p + 1 : p,
                      )
                    }
                    disabled={medPage >= Math.ceil(totalMeds / 30)}
                    className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={1} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg min-w-[280px] transition-all hover:shadow-xl p-0">
              <CardHeader className="text-xl mt-8">
                <CardTitle>Appointments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm pb-4">
                <div className="relative mb-4 mt-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments…"
                    value={apptSearch}
                    onChange={(e) => setApptSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {apptPageItems.map((appt, idx) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-lg border border-gray-200 bg-background shadow-sm hover:shadow-lg transition-transform duration-300 cursor-pointer mb-4"
                    style={getStaggerStyle(idx)}
                    onClick={() => setViewingAppt(appt)}
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        🗓️ {safeDisplay(appt.appointment_name)}
                      </h3>
                    </div>
                    <div className="mb-4 text-sm text-foreground flex flex-wrap items-center gap-2">
                      <p className="font-bold inline">Date:</p>
                      <p className="inline">
                        {new Date(appt.date).toLocaleDateString()}
                      </p>
                      <p className="font-bold inline ml-4">Time:</p>
                      <p className="inline">
                        {new Date(appt.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditApptDialog(appt);
                        }}
                        className="flex items-center px-3 py-1 hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 mr-1" /> View / Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteApptId(appt.id);
                          setShowDeleteApptDialog(true);
                        }}
                        className="flex items-center px-3 py-1 hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between py-2">
                  <Button
                    size="sm"
                    onClick={() => setApptPage((p) => Math.max(p - 1, 1))}
                    disabled={apptPage <= 1}
                    className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    <ChevronLeft />
                    Previous
                  </Button>

                  <span>
                    Page {apptPage} of {apptTotalPages}
                  </span>

                  <Button
                    size="sm"
                    onClick={() =>
                      setApptPage((p) =>
                        p < Math.ceil(totalAppointments / 50) ? p + 1 : p,
                      )
                    }
                    disabled={apptPage >= Math.ceil(totalAppointments / 50)}
                    className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={cardVariants}>
            <Card className="bg-card border border-border rounded-lg min-w-[280px] transition-all hover:shadow-xl p-0">
              <CardHeader className="mt-8 text-xl">
                <CardTitle>Health Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm pb-4 text-foreground">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search health logs…"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {logsPageItems.map((log, idx) => {
                  let vitalsData = null;
                  if (log.vitals) {
                    try {
                      vitalsData =
                        typeof log.vitals === "string"
                          ? JSON.parse(log.vitals)
                          : log.vitals;
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      vitalsData = null;
                    }
                  }
                  return (
                    <div
                      key={log.id}
                      className="p-6 rounded-xl border border-gray-200 bg-background shadow hover:shadow-xl transition-transform duration-300 cursor-pointer mb-6"
                      style={getStaggerStyle(idx)}
                      onClick={() => setViewingLog(log)}
                    >
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          Symptoms: {safeDisplay(log.symptom_type) || "N/A"}
                        </h3>
                      </div>

                      <div className="space-y-2 text-sm text-foreground">
                        <div>
                          <p className="mb-2">
                            <span className="font-bold">Severity:</span>{" "}
                            {log.severity !== undefined &&
                            log.severity !== null &&
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            log.severity !== ""
                              ? log.severity
                              : "N/A"}
                          </p>
                          <p className="mb-2">
                            <span className="font-bold">Mood:</span>{" "}
                            {safeDisplay(log.mood) || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold">Vitals:</p>
                          <div className="ml-4">
                            {(() => {
                              let vitalsObj = null;
                              if (log.vitals) {
                                try {
                                  vitalsObj =
                                    typeof log.vitals === "string"
                                      ? JSON.parse(log.vitals)
                                      : log.vitals;
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                } catch (error) {
                                  vitalsObj = null;
                                }
                              }
                              return vitalsObj ? (
                                <>
                                  <p className="mb-2">
                                    <span className="font-bold">
                                      - Heart Rate:
                                    </span>{" "}
                                    {vitalsObj.heartRate || "N/A"}
                                  </p>
                                  <p className="mb-2">
                                    <span className="font-bold">
                                      - Blood Pressure:
                                    </span>{" "}
                                    {vitalsObj.bloodPressure || "N/A"}
                                  </p>
                                </>
                              ) : (
                                <p>N/A</p>
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <p>
                            <span className="font-bold">
                              Medication Intake:
                            </span>{" "}
                            {safeDisplay(log.medication_intake) || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-bold">Notes:</span>{" "}
                            {safeDisplay(log.notes) || "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-wrap mt-0 gap-2">
                          <p className="text-sm">
                            <span className="font-bold">Start:</span>{" "}
                            {new Date(log.start_date).toLocaleDateString()}{" "}
                            {new Date(log.start_date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm">
                            <span className="font-bold">End:</span>{" "}
                            {log.end_date
                              ? new Date(log.end_date).toLocaleDateString() +
                                " " +
                                new Date(log.end_date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditLogDialog(log);
                          }}
                          className="flex items-center px-3 py-1 hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 mr-1" /> View / Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteLogId(log.id);
                            setShowDeleteLogDialog(true);
                          }}
                          className="flex items-center px-3 py-1 hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between py-2">
                  <Button
                    size="sm"
                    onClick={() => setLogPage((p) => Math.max(p - 1, 1))}
                    disabled={logPage <= 1}
                    className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    <ChevronLeft />
                    Previous
                  </Button>

                  <span>
                    Page {logPage} of {logsTotalPages}
                  </span>

                  <Button
                    size="sm"
                    onClick={() =>
                      setLogPage((p) =>
                        p < Math.ceil(totalLogs / 20) ? p + 1 : p,
                      )
                    }
                    disabled={logPage >= Math.ceil(totalLogs / 20)}
                    className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <Dialog open={addMedOpen} onOpenChange={setAddMedOpen}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Fill out all fields to add a new medication reminder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex justify-center mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScanOpen(true)}
                  className="cursor-pointer"
                >
                  Scan Barcode/QR Code
                </Button>
              </div>

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
                  Schedule (Date & Time)
                  <span className="ml-0 text-red-500">*</span>
                </Label>
                <div className="mb-2">
                  <Label className="text-xs">Date</Label>
                  <DatePicker
                    value={newMedDate}
                    onChange={setNewMedDate}
                    className="w-full"
                  />
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
                <Label className="inline-flex items-center gap-0.5">
                  Recurrence
                  <span className="ml-0 text-red-500">*</span>
                </Label>
                <Select
                  value={newMedRecurrence}
                  onValueChange={setNewMedRecurrence}
                >
                  <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Biweekly">Biweekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="As Needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setAddMedOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                onClick={handleAddMedication}
                disabled={!newMedName || !newMedDate}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addApptOpen} onOpenChange={setAddApptOpen}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Appointment</DialogTitle>
              <DialogDescription>
                Provide appointment info and date/time below.
              </DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setAddApptOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                onClick={handleAddAppointment}
                disabled={!newApptName || !newApptDate || !newApptTime}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addLogOpen} onOpenChange={setAddLogOpen}>
          <DialogContent className="max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Health Log</DialogTitle>
              <DialogDescription>
                Record symptoms, mood, vitals, or any other health info.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-0.5">
                  Symptom(s)
                  <span className="ml-0 text-red-500">*</span>
                </Label>
                <Input
                  value={hlSymptomType}
                  onChange={(e) => setHlSymptomType(e.target.value)}
                  placeholder="Separate multiple with commas"
                />
              </div>

              <div className="space-y-2">
                <Label className="inline-flex items-center gap-0.5">
                  Severity (0-10)
                  <span className="ml-0 text-red-500">*</span>
                </Label>
                <Slider
                  value={[hlSeverity]}
                  onValueChange={(value) => setHlSeverity(value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs">Current: {hlSeverity}</div>
              </div>

              <div className="space-y-2">
                <Label>Mood</Label>
                <Select value={hlMood} onValueChange={setHlMood}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Happy">Happy</SelectItem>
                    <SelectItem value="Sad">Sad</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Stressed">Stressed</SelectItem>
                    <SelectItem value="Tired">Tired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heart Rate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="300"
                    value={hlHeartRate}
                    onChange={(e) => setHlHeartRate(e.target.value)}
                    placeholder="e.g. 72"
                  />
                  <span className="text-sm">BPM</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Blood Pressure</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="300"
                    value={hlBloodPressureSys}
                    onChange={(e) => setHlBloodPressureSys(e.target.value)}
                    placeholder="Systolic"
                  />
                  <span>/</span>
                  <Input
                    type="number"
                    min="0"
                    max="300"
                    value={hlBloodPressureDia}
                    onChange={(e) => setHlBloodPressureDia(e.target.value)}
                    placeholder="Diastolic"
                  />
                  <span className="text-sm">mmHg</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medication Intake</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={hlMedIntakeNumber}
                    onChange={(e) => setHlMedIntakeNumber(e.target.value)}
                    placeholder="e.g. 200"
                  />
                  <Select
                    value={hlMedIntakeUnit}
                    onValueChange={setHlMedIntakeUnit}
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
                <Label>Notes</Label>
                <Textarea
                  value={hlNotes}
                  onChange={(e) => setHlNotes(e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>

              <div className="space-y-2">
                <Label className="inline-flex items-center gap-0.5">
                  Start Date
                  <span className="ml-0 text-red-500">*</span>
                </Label>
                <div className="mb-4">
                  <DatePicker
                    value={hlStartDatePicker}
                    onChange={setHlStartDatePicker}
                    className="w-full"
                  />
                </div>
                <Label>Start Time (24h)</Label>
                <CustomTimePicker
                  value={hlStartTimePicker}
                  onChange={setHlStartTimePicker}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <div className="mb-4">
                  <DatePicker
                    value={hlEndDatePicker}
                    onChange={setHlEndDatePicker}
                    className="w-full"
                  />
                </div>
                <Label>End Time (24h)</Label>
                <CustomTimePicker
                  value={hlEndTimePicker}
                  onChange={setHlEndTimePicker}
                />
              </div>
              {hlStartDatePicker &&
                hlEndDatePicker &&
                new Date(
                  `${format(hlEndDatePicker, "yyyy-MM-dd")}T${hlEndTimePicker}`,
                ) <=
                  new Date(
                    `${format(hlStartDatePicker, "yyyy-MM-dd")}T${hlStartTimePicker}`,
                  ) && (
                  <div className="text-red-500 text-sm">
                    End Date must be later than Start Date.
                  </div>
                )}
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setAddLogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                onClick={handleAddHealthLog}
                disabled={
                  !hlSymptomType ||
                  !hlStartDatePicker ||
                  (hlEndDatePicker &&
                    new Date(
                      `${format(hlEndDatePicker, "yyyy-MM-dd")}T${hlEndTimePicker}`,
                    ) <=
                      new Date(
                        `${format(hlStartDatePicker, "yyyy-MM-dd")}T${hlStartTimePicker}`,
                      ))
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {editingMed && (
          <Dialog
            open={Boolean(editingMed)}
            onOpenChange={() => setEditingMed(null)}
          >
            <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Medication</DialogTitle>
                <DialogDescription>
                  Update your medication details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Medication Name
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Input
                    value={editMedName}
                    onChange={(e) => setEditMedName(e.target.value)}
                  />
                </div>

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
                  <Label className="inline-flex items-center gap-0.5">
                    Schedule (Date & Time)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <div className="mb-2">
                    <Label className="text-xs">Date</Label>
                    <DatePicker
                      value={editMedDate}
                      onChange={setEditMedDate}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Time (24h)</Label>
                    <CustomTimePicker
                      value={editMedTimePicker}
                      onChange={setEditMedTimePicker}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Recurrence
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Select
                    value={editMedRecurrence}
                    onValueChange={setEditMedRecurrence}
                  >
                    <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Biweekly">Biweekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="As Needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setEditingMed(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="cursor-pointer"
                  onClick={handleUpdateMed}
                  disabled={!editMedName || !editMedDate}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {editingAppt && (
          <Dialog
            open={Boolean(editingAppt)}
            onOpenChange={() => setEditingAppt(null)}
          >
            <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Appointment</DialogTitle>
                <DialogDescription>
                  Update your appointment details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Appointment Info
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Input
                    value={editApptName}
                    onChange={(e) => setEditApptName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Date
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <DatePicker value={editApptDate} onChange={setEditApptDate} />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Time (24h)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <CustomTimePicker
                    value={editApptTime}
                    onChange={setEditApptTime}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setEditingAppt(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="cursor-pointer"
                  onClick={handleUpdateAppt}
                  disabled={!editApptName || !editApptDate || !editApptTime}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {editingLog && (
          <Dialog
            open={Boolean(editingLog)}
            onOpenChange={() => setEditingLog(null)}
          >
            <DialogContent className="max-w-xl w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Health Log</DialogTitle>
                <DialogDescription>
                  Update your health log details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Symptom(s)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Input
                    value={editSymptomType}
                    onChange={(e) => setEditSymptomType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Severity (0-10)
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <Slider
                    value={[editSeverity]}
                    onValueChange={(value) => setEditSeverity(value[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs">Current: {editSeverity}</div>
                </div>

                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select
                    value={editMood ?? undefined}
                    onValueChange={setEditMood}
                  >
                    <SelectTrigger className="w-full border border-input rounded px-2 py-1">
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Happy">Happy</SelectItem>
                      <SelectItem value="Sad">Sad</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                      <SelectItem value="Stressed">Stressed</SelectItem>
                      <SelectItem value="Tired">Tired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Heart Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="300"
                      value={editHeartRate}
                      onChange={(e) => setEditHeartRate(e.target.value)}
                    />
                    <span className="text-sm">BPM</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Blood Pressure</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="300"
                      value={editBloodPressureSys}
                      onChange={(e) => setEditBloodPressureSys(e.target.value)}
                      placeholder="Systolic"
                    />
                    <span>/</span>
                    <Input
                      type="number"
                      min="0"
                      max="300"
                      value={editBloodPressureDia}
                      onChange={(e) => setEditBloodPressureDia(e.target.value)}
                      placeholder="Diastolic"
                    />
                    <span className="text-sm">mmHg</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Medication Intake</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={editMedIntakeNumber}
                      onChange={(e) => setEditMedIntakeNumber(e.target.value)}
                    />
                    <Select
                      value={editMedIntakeUnit}
                      onValueChange={setEditMedIntakeUnit}
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
                  <Label>Notes</Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-0.5">
                    Start Date
                    <span className="ml-0 text-red-500">*</span>
                  </Label>
                  <div className="mb-2">
                    <DatePicker
                      value={editStartDatePicker}
                      onChange={setEditStartDatePicker}
                      className="w-full"
                    />
                  </div>
                  <Label className="text-xs">Start Time (24h)</Label>
                  <CustomTimePicker
                    value={editStartTimePicker}
                    onChange={setEditStartTimePicker}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="mb-2">
                    <DatePicker
                      value={editEndDatePicker}
                      onChange={setEditEndDatePicker}
                      className="w-full"
                    />
                  </div>
                  <Label className="text-xs">End Time (24h)</Label>
                  <CustomTimePicker
                    value={editEndTimePicker}
                    onChange={setEditEndTimePicker}
                  />
                </div>
                {editStartDatePicker &&
                  editEndDatePicker &&
                  new Date(
                    `${format(editEndDatePicker, "yyyy-MM-dd")}T${editEndTimePicker}`,
                  ) <=
                    new Date(
                      `${format(editStartDatePicker, "yyyy-MM-dd")}T${editStartTimePicker}`,
                    ) && (
                    <div className="text-red-500 text-sm">
                      End Date must be later than Start Date.
                    </div>
                  )}
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setEditingLog(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="cursor-pointer"
                  onClick={handleUpdateLog}
                  disabled={
                    !editSymptomType ||
                    !editStartDatePicker ||
                    (editEndDatePicker &&
                      new Date(
                        `${format(editEndDatePicker, "yyyy-MM-dd")}T${editEndTimePicker}`,
                      ) <=
                        new Date(
                          `${format(editStartDatePicker, "yyyy-MM-dd")}T${editStartTimePicker}`,
                        ))
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog
          open={showDeleteLogDialog}
          onOpenChange={(open) => !open && setShowDeleteLogDialog(false)}
        >
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle>Confirm Delete Health Log</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this health log?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowDeleteLogDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => {
                  if (deleteLogId) {
                    handleDeleteLog(deleteLogId);
                  }
                  setShowDeleteLogDialog(false);
                }}
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showDeleteMedDialog}
          onOpenChange={(open) => !open && setShowDeleteMedDialog(false)}
        >
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle>Confirm Delete Medication</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this medication reminder? This
                will remove all associated events.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowDeleteMedDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => {
                  if (deleteMedId) {
                    handleDeleteMedication(deleteMedId);
                  }
                  setShowDeleteMedDialog(false);
                }}
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showDeleteApptDialog}
          onOpenChange={(open) => !open && setShowDeleteApptDialog(false)}
        >
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle>Confirm Delete Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setShowDeleteApptDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => {
                  if (deleteApptId) {
                    handleDeleteAppointment(deleteApptId);
                  }
                  setShowDeleteApptDialog(false);
                }}
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {viewingMed && (
          <Dialog open onOpenChange={() => setViewingMed(null)}>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-600" />
                  Medication Details
                </DialogTitle>
                <DialogDescription className="text-foreground text-left">
                  A summary of this reminder.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-500" />
                  <span>
                    <strong>Name:</strong>{" "}
                    {safeDisplay(viewingMed.medication_name)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span>
                    <strong>Dosage:</strong> {safeDisplay(viewingMed.dosage)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                  <span>
                    <strong>When:</strong>{" "}
                    {new Date(viewingMed.reminder_time).toLocaleDateString()} at{" "}
                    {new Date(viewingMed.reminder_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-600" />
                  <span>
                    <strong>Recurrence:</strong>{" "}
                    {safeDisplay(viewingMed.recurrence)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <span>
                    <strong>Created:</strong>{" "}
                    {new Date(viewingMed.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setViewingMed(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {viewingAppt && (
          <Dialog open onOpenChange={() => setViewingAppt(null)}>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Appointment Details
                </DialogTitle>
                <DialogDescription className="text-foreground text-left">
                  A summary of this appointment.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <span>
                    <strong>Title:</strong>{" "}
                    {safeDisplay(viewingAppt.appointment_name)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-green-600" />
                  <span>
                    <strong>Date:</strong>{" "}
                    {new Date(viewingAppt.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span>
                    <strong>Time:</strong>{" "}
                    {new Date(viewingAppt.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <span>
                    <strong>Created:</strong>{" "}
                    {new Date(viewingAppt.date).toLocaleString()}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setViewingAppt(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {viewingLog && (
          <Dialog open onOpenChange={() => setViewingLog(null)}>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  Health Log Details
                </DialogTitle>
                <DialogDescription className="text-foreground text-left">
                  A summary of your selected entry.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-pink-500" />
                  <span>
                    <strong>Symptoms:</strong>{" "}
                    {safeDisplay(viewingLog.symptom_type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <span>
                    <strong>Severity:</strong> {viewingLog.severity ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-yellow-500" />
                  <span>
                    <strong>Mood:</strong> {safeDisplay(viewingLog.mood)}
                  </span>
                </div>
                {viewingLog.vitals && (
                  <>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <span>
                        <strong>Heart Rate:</strong>{" "}
                        {typeof viewingLog.vitals === "string"
                          ? JSON.parse(viewingLog.vitals).heartRate
                          : viewingLog.vitals.heartRate || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-green-600" />
                      <span>
                        <strong>Blood Pressure:</strong>{" "}
                        {typeof viewingLog.vitals === "string"
                          ? JSON.parse(viewingLog.vitals).bloodPressure
                          : viewingLog.vitals.bloodPressure || "N/A"}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-600" />
                  <span>
                    <strong>Intake:</strong>{" "}
                    {safeDisplay(viewingLog.medication_intake)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Edit3 className="w-5 h-5 text-gray-500" />
                  <span>
                    <strong>Notes:</strong> {safeDisplay(viewingLog.notes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-700" />
                  <span>
                    <strong>Start:</strong>{" "}
                    {new Date(viewingLog.start_date).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-700" />
                  <span>
                    <strong>End:</strong>{" "}
                    {viewingLog.end_date
                      ? new Date(viewingLog.end_date).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setViewingLog(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <BarcodeScanModal
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onConfirm={(info: MedInfo) => {
            // fill in the form
            setNewMedName(info.name);
            setNewMedDosage(info.dosage);
            setNewMedDosageUnit(info.unit || "mg");
            setScanOpen(false);
          }}
        />
      </motion.div>
    </>
  );
}
