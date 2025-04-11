import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import {
  MedicationReminder,
  getMedicationRemindersByUser,
  createMedicationReminder,
  updateMedicationReminder,
  deleteMedicationReminder,
} from "@/lib/medications";
import {
  AppointmentReminder,
  getAppointmentRemindersByUser,
  createAppointmentReminder,
  updateAppointmentReminder,
  deleteAppointmentReminder,
} from "@/lib/appointmentReminders";
import {
  HealthLog,
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

// Import Framer Motion for animations
import { motion } from "framer-motion";

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

// Framer Motion variants
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

/**
 * Returns a friendly greeting based on the current hour of the day.
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
 * @param val - The string or null/undefined value to display.
 * @returns A safe display string.
 */
function safeDisplay(val: string | null | undefined): string {
  return val && val.trim() !== "" ? val : "N/A";
}

/**
 * Function to animate a counter from 0 to a given value.
 * @param param0 - The value to animate to and the duration of the animation.
 * @returns A span element containing the animated number.
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
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<AppointmentReminder[]>([]);
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
  const [newMedTime, setNewMedTime] = useState("");
  const [newMedRecurrence, setNewMedRecurrence] = useState("Daily");
  const [newMedCalendarSync, setNewMedCalendarSync] = useState("");
  const [newApptName, setNewApptName] = useState("");
  const [newApptDate, setNewApptDate] = useState("");
  const [newApptTime, setNewApptTime] = useState("");
  const [hlSymptomType, setHlSymptomType] = useState("");
  const [hlSeverity, setHlSeverity] = useState<number>(0);
  const [hlMood, setHlMood] = useState("");
  const [hlHeartRate, setHlHeartRate] = useState("");
  const [hlBloodPressureSys, setHlBloodPressureSys] = useState("");
  const [hlBloodPressureDia, setHlBloodPressureDia] = useState("");
  const [hlMedIntakeNumber, setHlMedIntakeNumber] = useState("");
  const [hlMedIntakeUnit, setHlMedIntakeUnit] = useState("mg");
  const [hlNotes, setHlNotes] = useState("");
  const [hlStartDate, setHlStartDate] = useState("");
  const [hlEndDate, setHlEndDate] = useState("");
  const [editingMed, setEditingMed] = useState<MedicationReminder | null>(null);
  const [editMedName, setEditMedName] = useState("");
  const [editMedDosage, setEditMedDosage] = useState("");
  const [editMedDosageUnit, setEditMedDosageUnit] = useState("mg");
  const [editMedTime, setEditMedTime] = useState("");
  const [editMedRecurrence, setEditMedRecurrence] = useState("Daily");
  const [editMedCalendarSync, setEditMedCalendarSync] = useState("");
  const [editingAppt, setEditingAppt] = useState<AppointmentReminder | null>(
    null,
  );
  const [editApptName, setEditApptName] = useState("");
  const [editApptDate, setEditApptDate] = useState("");
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
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRefs: any[] = [];
  const router = useRouter();

  useEffect(() => {
    async function checkUserAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      }
    }
    checkUserAuth();
  }, [router]);

  /**
   * This function fetches all data for the user, including medications, appointments, and health logs
   * @param uid - The user ID.
   */
  async function fetchAllData(uid: string) {
    const [meds, appts, userLogs] = await Promise.all([
      getMedicationRemindersByUser(uid),
      getAppointmentRemindersByUser(uid),
      getHealthLogsByUser(uid),
    ]);

    setMedications(meds);
    setAppointments(appts);
    setLogs(userLogs);
    setTotalMeds(meds.length);
    setTotalAppointments(appts.length);
    setTotalLogs(userLogs.length);
  }

  /**
   * Supabase Realtime: Listens for changes in the database (in terms of medication,
   * appointments, and health logs) and updates the state accordingly.
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

      const medsChannel = supabase
        .channel("medicationChanges")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.push(medsChannel);

      const apptsChannel = supabase
        .channel("appointmentChanges")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointment_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.push(apptsChannel);

      const logsChannel = supabase
        .channel("healthLogChanges")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "health_logs",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchAllData(user.id);
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
   * Adds a new medication reminder for the user.
   */
  async function handleAddMedication() {
    if (!userId || !newMedName || !newMedTime) return;
    try {
      const localDate = new Date(newMedTime);
      const isoString = localDate.toISOString();

      const combinedDosage = newMedDosage
        ? `${newMedDosage} ${newMedDosageUnit}`
        : "";

      await createMedicationReminder({
        user_profile_id: userId,
        medication_name: newMedName,
        dosage: combinedDosage || null,
        reminder_time: isoString,
        recurrence: newMedRecurrence || null,
        calendar_sync_token: newMedCalendarSync || null,
      });

      await fetchAllData(userId);

      setNewMedName("");
      setNewMedDosage("");
      setNewMedDosageUnit("mg");
      setNewMedTime("");
      setNewMedRecurrence("Daily");
      setNewMedCalendarSync("");
      setAddMedOpen(false);
    } catch (err) {
      console.error("Error creating medication:", err);
    }
  }

  /**
   * Adds a new appointment reminder for the user.
   */
  async function handleAddAppointment() {
    if (!userId || !newApptName || !newApptDate) return;
    try {
      const dateTimeString = newApptTime
        ? `${newApptDate}T${newApptTime}`
        : newApptDate;
      const localDate = new Date(dateTimeString);
      const isoString = localDate.toISOString();

      await createAppointmentReminder({
        user_profile_id: userId,
        appointment_name: newApptName,
        date: isoString,
      });

      await fetchAllData(userId);

      setNewApptName("");
      setNewApptDate("");
      setNewApptTime("");
      setAddApptOpen(false);
    } catch (err) {
      console.error("Error creating appointment:", err);
    }
  }

  /**
   * Adds a new health log for the user.
   */
  async function handleAddHealthLog() {
    if (!userId) return;

    try {
      const localStart = hlStartDate ? new Date(hlStartDate) : new Date();
      const startISO = localStart.toISOString();
      const localEnd = hlEndDate ? new Date(hlEndDate) : new Date();
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
      setHlStartDate("");
      setHlEndDate("");
      setAddLogOpen(false);
    } catch (err) {
      console.error("Error creating health log:", err);
    }
  }

  /**
   * Opens the edit dialog for a medication reminder.
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

    setEditMedTime(med.reminder_time);
    setEditMedRecurrence(med.recurrence ?? "Daily");
    setEditMedCalendarSync(med.calendar_sync_token ?? "");
  }

  /**
   * Handles the update of a medication reminder.
   */
  async function handleUpdateMed() {
    if (!editingMed || !userId) return;
    try {
      const localDate = new Date(editMedTime);
      const isoString = localDate.toISOString();

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

      await fetchAllData(userId);
      setEditingMed(null);
    } catch (err) {
      console.error("Error updating medication:", err);
    }
  }

  /**
   * Opens the edit dialog for an appointment reminder.
   */
  function openEditApptDialog(appt: AppointmentReminder) {
    setEditingAppt(appt);
    setEditApptName(appt.appointment_name);

    const d = new Date(appt.date);
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = d.toTimeString().slice(0, 5);
    setEditApptDate(dateStr);
    setEditApptTime(timeStr);
  }

  /**
   * Handles the update of an appointment reminder.
   */
  async function handleUpdateAppt() {
    if (!editingAppt || !userId) return;
    try {
      const dateTimeString = editApptTime
        ? `${editApptDate}T${editApptTime}`
        : editApptDate;
      const localDate = new Date(dateTimeString);
      const isoString = localDate.toISOString();

      await updateAppointmentReminder(editingAppt.id, {
        appointment_name: editApptName,
        date: isoString,
      });

      await fetchAllData(userId);
      setEditingAppt(null);
    } catch (err) {
      console.error("Error updating appointment:", err);
    }
  }

  /**
   * Opens the edit dialog for a health log.
   */
  function openEditLogDialog(log: HealthLog) {
    setEditingLog(log);
    setEditSymptomType(log.symptom_type ?? "");
    setEditSeverity(log.severity ?? 0);
    setEditMood(log.mood ?? "");
    setEditNotes(log.notes ?? "");
    setEditStartDate(log.start_date);
    setEditEndDate(log.end_date ?? "");

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
   * Handles updating a health log in the database.
   */
  async function handleUpdateLog() {
    if (!editingLog || !userId) return;
    try {
      const localStart = new Date(editStartDate);
      const startISO = localStart.toISOString();
      const localEnd = editEndDate ? new Date(editEndDate) : new Date();
      const endISO = localEnd.toISOString();

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

      await fetchAllData(userId);
      setEditingLog(null);
    } catch (err) {
      console.error("Error updating health log:", err);
    }
  }

  /**
   * Deletes a medication reminder.
   */
  async function handleDeleteMedication(id: string) {
    if (!userId) return;
    try {
      await deleteMedicationReminder(id);
      await fetchAllData(userId);
    } catch (err) {
      console.error("Error deleting medication:", err);
    }
  }

  /**
   * Deletes an appointment reminder.
   */
  async function handleDeleteAppointment(id: string) {
    if (!userId) return;
    try {
      await deleteAppointmentReminder(id);
      await fetchAllData(userId);
    } catch (err) {
      console.error("Error deleting appointment:", err);
    }
  }

  /**
   * Deletes a health log.
   */
  async function handleDeleteLog(id: string) {
    if (!userId) return;
    try {
      await deleteHealthLog(id);
      await fetchAllData(userId);
    } catch (err) {
      console.error("Error deleting health log:", err);
    }
  }

  const { greeting, emoji } = getGreetingParts();

  // Color palette
  const colorSet = [
    "#4361EE",
    "#F97F51",
    "#EAD637",
    "#4CD137",
    "#FF577F",
    "#9A6AFF",
  ];

  // Sort logs by start_date for chart
  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
  const severityLabels = sortedLogs.map((log) => log.start_date.split("T")[0]);
  const severityData = sortedLogs.map((log) => log.severity ?? 0);

  const severityLineData = {
    labels: severityLabels,
    datasets: [
      {
        label: "Symptom Severity",
        data: severityData,
        borderColor: colorSet[0],
        backgroundColor: colorSet[0],
        tension: 0.2,
        fill: false,
      },
    ],
  };

  const apptsCountMap: Record<string, number> = {};
  appointments.forEach((appt) => {
    const day = new Date(appt.date).toISOString().split("T")[0];
    apptsCountMap[day] = (apptsCountMap[day] || 0) + 1;
  });
  const apptLabels = Object.keys(apptsCountMap).sort();
  const apptValues = apptLabels.map((day) => apptsCountMap[day]);
  const appointmentsBarData = {
    labels: apptLabels,
    datasets: [
      {
        label: "Appointments / Day",
        data: apptValues,
        backgroundColor: colorSet[1],
        borderColor: colorSet[1],
        borderWidth: 1,
      },
    ],
  };

  const symptomFreqMap: Record<string, number> = {};
  logs.forEach((log) => {
    const symStr = log.symptom_type || "";
    const splitted = symStr.split(",").map((s) => s.trim());
    splitted.forEach((s) => {
      if (!s) return;
      symptomFreqMap[s] = (symptomFreqMap[s] || 0) + 1;
    });
  });
  const doughnutLabels = Object.keys(symptomFreqMap);
  const doughnutValues = doughnutLabels.map((k) => symptomFreqMap[k]);
  const symptomDoughnutData = {
    labels: doughnutLabels,
    datasets: [
      {
        label: "Symptom Distribution",
        data: doughnutValues,
        backgroundColor: doughnutLabels.map(
          (_, idx) => colorSet[idx % colorSet.length],
        ),
      },
    ],
  };

  const moodCountMap: Record<string, number> = {};
  logs.forEach((log) => {
    const mood = log.mood || "";
    const lower = mood.toLowerCase();
    if (!lower) return;
    moodCountMap[lower] = (moodCountMap[lower] || 0) + 1;
  });
  const moodLabels = Object.keys(moodCountMap);
  const moodValues = moodLabels.map((m) => moodCountMap[m]);
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

  const severityCountMap: Record<string, number> = {};
  logs.forEach((log) => {
    const s = log.severity ?? 0;
    severityCountMap[s] = (severityCountMap[s] || 0) + 1;
  });
  const polarSeverityLabels = Object.keys(severityCountMap).sort();
  const polarSeverityValues = polarSeverityLabels.map(
    (key) => severityCountMap[key],
  );
  const severityPolarData = {
    labels: polarSeverityLabels.map((lab) => `Severity ${lab}`),
    datasets: [
      {
        label: "Severity Distribution",
        data: polarSeverityValues,
        backgroundColor: polarSeverityValues.map(
          (_, idx) => colorSet[idx % colorSet.length],
        ),
      },
    ],
  };

  const apptHourMap: Record<number, number> = {};
  appointments.forEach((appt) => {
    const hour = new Date(appt.date).getHours();
    apptHourMap[hour] = (apptHourMap[hour] || 0) + 1;
  });
  const hourLabels = Array.from({ length: 24 }, (_, i) => i);
  const hourValues = hourLabels.map((hr) => apptHourMap[hr] || 0);
  const appointmentsHourBarData = {
    labels: hourLabels.map((hr) => `${hr}:00`),
    datasets: [
      {
        label: "Appointments / Hour",
        data: hourValues,
        backgroundColor: colorSet[3],
        borderColor: colorSet[3],
        borderWidth: 1,
      },
    ],
  };

  const recurrenceFreqMap: Record<string, number> = {};
  medications.forEach((m) => {
    const rec = m.recurrence || "N/A";
    recurrenceFreqMap[rec] = (recurrenceFreqMap[rec] || 0) + 1;
  });
  const recurrenceLabels = Object.keys(recurrenceFreqMap);
  const recurrenceValues = recurrenceLabels.map((k) => recurrenceFreqMap[k]);
  const medicationRecurrenceData = {
    labels: recurrenceLabels,
    datasets: [
      {
        label: "Medications by Recurrence",
        data: recurrenceValues,
        backgroundColor: recurrenceLabels.map(
          (_, idx) => colorSet[idx % colorSet.length],
        ),
      },
    ],
  };

  const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const getStaggerStyle = (index: number) => ({
    animationDelay: `${0.1 + index * 0.05}s`,
  });

  return (
    <>
      <Head>
        <title>SymptomSync | Home</title>
        <meta name="description" content="Your personal health dashboard." />
      </Head>

      {/* Wrap the entire page in a motion.div with containerVariants */}
      <motion.div
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 md:p-8 flex-1 overflow-y-auto space-y-8"
      >
        {/* Top heading, subheading */}
        <motion.div variants={slideInLeft}>
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {userName} {emoji}!
          </h1>
          <motion.p
            variants={fadeInUp}
            className="text-sm md:text-base text-muted-foreground"
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
            Add Medication
          </Button>
          <Button
            variant="default"
            onClick={() => setAddApptOpen(true)}
            className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          >
            Add Appointment
          </Button>
          <Button
            variant="default"
            onClick={() => setAddLogOpen(true)}
            className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          >
            Add Health Log
          </Button>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ animationDelay: "0.5s" }}
        >
          {[
            { label: "Total Medications", value: totalMeds },
            { label: "Total Appointments", value: totalAppointments },
            { label: "Total Health Logs", value: totalLogs },
          ].map((stat, idx) => (
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
          ))}
        </div>

        <div style={{ animationDelay: "0.7s" }}>
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
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ animationDelay: "0.9s" }}
        >
          <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
            <CardHeader>
              <CardTitle>Appointments / Day</CardTitle>
            </CardHeader>
            <CardContent className="relative w-full h-full">
              {apptLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No appointments found.
                </p>
              ) : (
                <div className="w-full h-[250px]">
                  <Bar
                    data={appointmentsBarData}
                    options={defaultChartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>

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
                  <Doughnut
                    data={symptomDoughnutData}
                    options={defaultChartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>

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
                  <Radar data={moodRadarData} options={defaultChartOptions} />
                </div>
              )}
            </CardContent>
          </Card>

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
                  <PolarArea
                    data={severityPolarData}
                    options={defaultChartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
            <CardHeader>
              <CardTitle>Appointments / Hour</CardTitle>
            </CardHeader>
            <CardContent className="relative w-full h-full">
              {hourLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No appointment hours found.
                </p>
              ) : (
                <div className="w-full h-[250px]">
                  <Bar
                    data={appointmentsHourBarData}
                    options={defaultChartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-lg pt-4 min-w-[280px] h-auto min-h-[330px] transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-101">
            <CardHeader>
              <CardTitle>Medications / Recurrence</CardTitle>
            </CardHeader>
            <CardContent className="relative w-full h-full">
              {recurrenceLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No medications to display.
                </p>
              ) : (
                <div className="w-full h-[250px]">
                  <Bar
                    data={medicationRecurrenceData}
                    options={defaultChartOptions}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{ animationDelay: "1.1s" }}
        >
          <Card className="bg-card border border-border rounded-lg min-w-[280px] transition-all hover:shadow-xl p-0 hover:-translate-y-1 hover:scale-101">
            <CardHeader className="mt-8">
              <CardTitle>Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {medications.length === 0 ? (
                <p className="text-muted-foreground">No medications yet.</p>
              ) : (
                medications.map((med, idx) => (
                  <div
                    key={med.id}
                    className="p-2 rounded-md w-full flex flex-col gap-1 shadow-sm"
                    style={getStaggerStyle(idx)}
                  >
                    <div className="font-medium">
                      {safeDisplay(med.medication_name)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dosage: {safeDisplay(med.dosage)}
                      <br />
                      Schedule: {new Date(med.reminder_time).toLocaleString()}
                      <br />
                      Recurrence: {safeDisplay(med.recurrence)}
                      <br />
                      {/* Calendar Sync: {safeDisplay(med.calendar_sync_token)} */}
                      <br />
                      Created: {new Date(med.created_at).toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => openEditMedDialog(med)}
                        className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        View / Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteMedication(med.id)}
                        className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-lg min-w-[280px] transition-all hover:shadow-xl p-0 hover:-translate-y-1 hover:scale-101">
            <CardHeader className="mt-8">
              <CardTitle>Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {appointments.length === 0 ? (
                <p className="text-muted-foreground">No appointments yet.</p>
              ) : (
                appointments.map((appt, idx) => (
                  <div
                    key={appt.id}
                    className="p-2 rounded-md w-full flex flex-col gap-1 shadow-sm"
                    style={getStaggerStyle(idx)}
                  >
                    <div className="font-medium">
                      {safeDisplay(appt.appointment_name)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Date: {new Date(appt.date).toLocaleDateString()} @{" "}
                      {new Date(appt.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => openEditApptDialog(appt)}
                        className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        View / Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-lg min-w-[280px] transition-all hover:shadow-xl p-0 hover:-translate-y-1 hover:scale-101">
            <CardHeader className="mt-8">
              <CardTitle>Health Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No health logs yet.</p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-md w-full flex flex-col gap-1 shadow-sm"
                    style={getStaggerStyle(idx)}
                  >
                    <div className="font-medium">
                      Symptoms: {safeDisplay(log.symptom_type)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Severity: {log.severity ?? 0}
                      <br />
                      Mood: {safeDisplay(log.mood)}
                      <br />
                      {(() => {
                        if (typeof log.vitals === "string") {
                          return `Vitals: ${log.vitals}`;
                        }
                        if (typeof log.vitals === "object") {
                          return `Vitals: ${JSON.stringify(log.vitals)}`;
                        }
                        return "Vitals: N/A";
                      })()}
                      <br />
                      Medication Intake: {safeDisplay(log.medication_intake)}
                      <br />
                      Notes: {safeDisplay(log.notes)}
                      <br />
                      Start: {new Date(log.start_date).toLocaleString()}
                      <br />
                      End:{" "}
                      {log.end_date
                        ? new Date(log.end_date).toLocaleString()
                        : "N/A"}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => openEditLogDialog(log)}
                        className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        View / Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteLog(log.id)}
                        className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={addMedOpen} onOpenChange={setAddMedOpen}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Fill out all fields to add a new medication reminder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Medication Name</Label>
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
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="e.g. 200"
                  />
                  <select
                    className="border border-input rounded px-2 py-1"
                    value={newMedDosageUnit}
                    onChange={(e) => setNewMedDosageUnit(e.target.value)}
                  >
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schedule (Date & Time)</Label>
                <Input
                  type="datetime-local"
                  value={newMedTime}
                  onChange={(e) => setNewMedTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Recurrence</Label>
                <select
                  className="border border-input rounded px-2 py-1"
                  value={newMedRecurrence}
                  onChange={(e) => setNewMedRecurrence(e.target.value)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Biweekly">Biweekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="As Needed">As Needed</option>
                </select>
              </div>

              {/* <div className="space-y-2">
                <Label>Calendar Sync Token (Optional)</Label>
                <Input
                  value={newMedCalendarSync}
                  onChange={(e) => setNewMedCalendarSync(e.target.value)}
                  placeholder="If applicable"
                />
              </div> */}
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
                <Label>Appointment Info</Label>
                <Input
                  value={newApptName}
                  onChange={(e) => setNewApptName(e.target.value)}
                  placeholder="e.g. Check-up with Dr. Smith"
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newApptDate}
                  onChange={(e) => setNewApptDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newApptTime}
                  onChange={(e) => setNewApptTime(e.target.value)}
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
                <Label>Symptom(s)</Label>
                <Input
                  value={hlSymptomType}
                  onChange={(e) => setHlSymptomType(e.target.value)}
                  placeholder="Separate multiple with commas"
                />
              </div>

              <div className="space-y-2">
                <Label>Severity (0-10)</Label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  className="w-full"
                  value={hlSeverity}
                  onChange={(e) => setHlSeverity(Number(e.target.value))}
                />
                <div className="text-xs">Current: {hlSeverity}</div>
              </div>

              <div className="space-y-2">
                <Label>Mood</Label>
                <select
                  className="border border-input rounded px-2 py-1"
                  value={hlMood}
                  onChange={(e) => setHlMood(e.target.value)}
                >
                  <option value="">Select mood</option>
                  <option value="Happy">Happy</option>
                  <option value="Sad">Sad</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Stressed">Stressed</option>
                  <option value="Tired">Tired</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Heart Rate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
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
                    value={hlBloodPressureSys}
                    onChange={(e) => setHlBloodPressureSys(e.target.value)}
                    placeholder="Systolic"
                  />
                  <span>/</span>
                  <Input
                    type="number"
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
                    value={hlMedIntakeNumber}
                    onChange={(e) => setHlMedIntakeNumber(e.target.value)}
                    placeholder="e.g. 200"
                  />
                  <select
                    className="border border-input rounded px-2 py-1"
                    value={hlMedIntakeUnit}
                    onChange={(e) => setHlMedIntakeUnit(e.target.value)}
                  >
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                  </select>
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
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={hlStartDate}
                  onChange={(e) => setHlStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={hlEndDate}
                  onChange={(e) => setHlEndDate(e.target.value)}
                />
              </div>
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
                  Update all relevant fields.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Medication Name</Label>
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
                      value={editMedDosage}
                      onChange={(e) => setEditMedDosage(e.target.value)}
                    />
                    <select
                      className="border border-input rounded px-2 py-1"
                      value={editMedDosageUnit}
                      onChange={(e) => setEditMedDosageUnit(e.target.value)}
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schedule (Date & Time)</Label>
                  <Input
                    type="datetime-local"
                    value={editMedTime}
                    onChange={(e) => setEditMedTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <select
                    className="border border-input rounded px-2 py-1"
                    value={editMedRecurrence}
                    onChange={(e) => setEditMedRecurrence(e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Biweekly">Biweekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                </div>

                {/* <div className="space-y-2">
                  <Label>Calendar Sync Token</Label>
                  <Input
                    value={editMedCalendarSync}
                    onChange={(e) => setEditMedCalendarSync(e.target.value)}
                  />
                </div> */}
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
                  Update appointment details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Appointment Info</Label>
                  <Input
                    value={editApptName}
                    onChange={(e) => setEditApptName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editApptDate}
                    onChange={(e) => setEditApptDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={editApptTime}
                    onChange={(e) => setEditApptTime(e.target.value)}
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
                  Update all relevant fields.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Symptom(s)</Label>
                  <Input
                    value={editSymptomType}
                    onChange={(e) => setEditSymptomType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Severity (0-10)</Label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    className="w-full"
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(Number(e.target.value))}
                  />
                  <div className="text-xs">Current: {editSeverity}</div>
                </div>

                <div className="space-y-2">
                  <Label>Mood</Label>
                  <select
                    className="border border-input rounded px-2 py-1"
                    value={editMood}
                    onChange={(e) => setEditMood(e.target.value)}
                  >
                    <option value="">Select mood</option>
                    <option value="Happy">Happy</option>
                    <option value="Sad">Sad</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Stressed">Stressed</option>
                    <option value="Tired">Tired</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Heart Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
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
                      value={editBloodPressureSys}
                      onChange={(e) => setEditBloodPressureSys(e.target.value)}
                      placeholder="Systolic"
                    />
                    <span>/</span>
                    <Input
                      type="number"
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
                      value={editMedIntakeNumber}
                      onChange={(e) => setEditMedIntakeNumber(e.target.value)}
                    />
                    <select
                      className="border border-input rounded px-2 py-1"
                      value={editMedIntakeUnit}
                      onChange={(e) => setEditMedIntakeUnit(e.target.value)}
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
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
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                </div>
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
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>
    </>
  );
}
