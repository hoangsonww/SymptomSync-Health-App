import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithHealthAI } from "@/lib/aiChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  getMedicationRemindersByUser,
  createMedicationReminder,
  updateMedicationReminder,
  deleteMedicationReminder,
} from "@/lib/medications";
import {
  getAppointmentRemindersByUser,
  createAppointmentReminder,
  updateAppointmentReminder,
  deleteAppointmentReminder,
} from "@/lib/appointmentReminders";
import {
  getHealthLogsByUser,
  createHealthLog,
  updateHealthLog,
  deleteHealthLog,
} from "@/lib/healthLogs";
import { getCurrentProfile } from "@/lib/profile";
import { fetchUserFiles } from "@/lib/files";
import { toast } from "sonner";

type Role = "user" | "model";

type ChatMessage = {
  role: Role;
  text: string;
};

type ActionEntity = "appointment" | "medication" | "health_log";
type ActionIntent = "create" | "update" | "delete";
type ActionPayload = {
  entity: ActionEntity;
  intent: ActionIntent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
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
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
const bubbleVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// Custom markdown components - necessary for rendering the AI's responses
const markdownComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-2xl font-bold my-4 border-b-2 border-gray-200 pb-2"
      {...props}
    >
      {children}
    </h1>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-xl font-bold my-3 border-b border-gray-200 pb-1"
      {...props}
    >
      {children}
    </h2>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ children, ...props }: any) => (
    <h3 className="text-lg font-bold my-3" {...props}>
      {children}
    </h3>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h4: ({ children, ...props }: any) => (
    <h4 className="text-base font-bold my-2" {...props}>
      {children}
    </h4>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h5: ({ children, ...props }: any) => (
    <h5 className="text-sm font-bold my-2" {...props}>
      {children}
    </h5>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h6: ({ children, ...props }: any) => (
    <h6 className="text-xs font-bold my-2" {...props}>
      {children}
    </h6>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ children, ...props }: any) => (
    <p className="mb-3 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3"
      {...props}
    >
      {children}
    </blockquote>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hr: ({ ...props }: any) => (
    <hr className="border-t border-gray-300 my-3" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ inline, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre
        className="bg-gray-100 text-gray-800 p-2 rounded text-sm font-mono overflow-x-auto my-3"
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3">
      <table
        className="min-w-full border-collapse border border-gray-300 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thead: ({ children, ...props }: any) => (
    <thead className="bg-gray-100 border-b border-gray-300" {...props}>
      {children}
    </thead>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tr: ({ children, ...props }: any) => (
    <tr className="border-b last:border-0" {...props}>
      {children}
    </tr>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  th: ({ children, ...props }: any) => (
    <th
      className="border border-gray-300 px-3 py-2 font-semibold text-left"
      {...props}
    >
      {children}
    </th>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  td: ({ children, ...props }: any) => (
    <td className="border border-gray-300 px-3 py-2 align-top" {...props}>
      {children}
    </td>
  ),
};

/**
 * (Unused helper retained for backward compatibility)
 * Function to get initial messages from local storage
 *
 * @returns Initial messages from local storage or an empty array
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getInitialMessages = (): ChatMessage[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("symptomSyncChat");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
  }
  return [];
};

// Been facing hydration issues for ages... So trying this workaround
// to ensure the component only mounts on the client side
// We don't need the entire chat to be server-rendered anyway...
const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
};

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(
    null,
  );
  const [applyingAction, setApplyingAction] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const hasSentMessageRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);
  const [latestMeds, setLatestMeds] = useState<
    Awaited<ReturnType<typeof getMedicationRemindersByUser>>
  >([]);
  const [latestAppts, setLatestAppts] = useState<
    Awaited<ReturnType<typeof getAppointmentRemindersByUser>>
  >([]);
  const [latestLogs, setLatestLogs] = useState<
    Awaited<ReturnType<typeof getHealthLogsByUser>>
  >([]);

  useEffect(() => {
    async function checkUserAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
      } else {
        setUserId(user.id);
      }
    }
    checkUserAuth();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`symptomSyncChat-${userId}`);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`symptomSyncChat-${userId}`, JSON.stringify(messages));
    if (hasSentMessageRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userId]);

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
   * This function handles sending the user's input to the AI and receiving a response
   *
   * @returns The AI's response to the user's input
   */
  async function handleSend() {
    if (!userInput.trim() || loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const [meds, appts, logs, profile, files] = await Promise.all([
        getMedicationRemindersByUser(user.id),
        getAppointmentRemindersByUser(user.id),
        getHealthLogsByUser(user.id),
        getCurrentProfile(),
        fetchUserFiles(user.id, 1),
      ]);
      setLatestMeds(meds);
      setLatestAppts(appts);
      setLatestLogs(logs);

      let userDataSummary = `Appointments:\n`;
      if (appts.length === 0) {
        userDataSummary += `- None\n`;
      } else {
        appts.forEach((a) => {
          const dateString = new Date(a.date).toLocaleString();
          userDataSummary += `- ${a.appointment_name} on ${dateString}\n`;
        });
      }
      userDataSummary += `\nMedications:\n`;
      if (meds.length === 0) {
        userDataSummary += `- None\n`;
      } else {
        meds.forEach((m) => {
          userDataSummary += `- ${m.medication_name}, dosage: ${
            m.dosage ?? "N/A"
          }, next time: ${new Date(
            m.reminder_time,
          ).toLocaleString()}, recurrence: ${m.recurrence ?? "N/A"}\n`;
        });
      }
      userDataSummary += `\nRecent Health Logs:\n`;
      if (logs.length === 0) {
        userDataSummary += `- None\n`;
      } else {
        const recent = logs.slice(-3);
        recent.forEach((l) => {
          userDataSummary += `- Symptom: ${l.symptom_type ?? "N/A"}, severity: ${
            l.severity ?? 0
          }, start: ${new Date(l.start_date).toLocaleString()}\n`;
        });
      }
      userDataSummary += `\nProfile:\n`;
      if (profile) {
        userDataSummary += `- Name: ${profile.full_name ?? "N/A"}\n`;
        userDataSummary += `- Conditions: ${
          profile.condition_tags?.join(", ") || "None"
        }\n`;
      } else {
        userDataSummary += `- No profile found.\n`;
      }

      const docSummaries = (files ?? []).slice(0, 5);
      userDataSummary += `\nRecent Documents:\n`;
      if (docSummaries.length === 0) {
        userDataSummary += `- None\n`;
      } else {
        docSummaries.forEach((f: any) => {
          const tags =
            Array.isArray(f.tags) && f.tags.length > 0
              ? f.tags.join(", ")
              : "no tags";
          userDataSummary += `- ${f.filename} (${f.file_type || "unknown"}, ${tags})\n`;
        });
      }

      const newUserMessage: ChatMessage = { role: "user", text: userInput };

      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);
      hasSentMessageRef.current = true;

      const newHistory = updatedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      if (newHistory.length === 0 || newHistory[0].role !== "user") {
        newHistory.splice(0, newHistory.length, {
          role: "user",
          parts: [{ text: userInput }],
        });
      }

      const aiResponse = await chatWithHealthAI(
        newHistory,
        userInput,
        undefined,
        userDataSummary,
      );
      setAiError(null);

      const parsedAction = parseAction(aiResponse);
      if (parsedAction) {
        setPendingAction(parsedAction);
      } else {
        // Fallback: try to derive a health log action from the user's request if the AI forgot the action block
        const derived = deriveHealthLogFromInput(userInput);
        if (derived) {
          setPendingAction(derived);
        }
      }

      setMessages((prev) => [...prev, { role: "model", text: aiResponse }]);
      setUserInput("");
    } catch (err) {
      console.error(err);
      let friendly = "AI is unavailable. Please try again soon.";
      if (err instanceof Error) {
        if (err.message.includes("429")) {
          friendly =
            "AI hit a rate limit. Please retry in a few seconds or check quota.";
        } else {
          friendly = err.message;
        }
      }
      setAiError(friendly);
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  }

  const parseAction = (response: string): ActionPayload | null => {
    const match = response.match(/```symptomsync-action\s*([\s\S]*?)```/);
    const candidate = match ? match[1] : null;
    const tryParse = (raw: string | null) => {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          (parsed.entity === "appointment" ||
            parsed.entity === "medication" ||
            parsed.entity === "health_log") &&
          ["create", "update", "delete"].includes(parsed.intent)
        ) {
          return parsed as ActionPayload;
        }
      } catch (err) {
        return null;
      }
      return null;
    };

    const fencedParsed = tryParse(candidate);
    if (fencedParsed) return fencedParsed;

    // Fallback: attempt to parse a bare JSON blob if AI forgot the code fence
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const fallbackParsed = tryParse(jsonMatch[0]);
      if (fallbackParsed) return fallbackParsed;
    }

    return null;
  };

  const deriveHealthLogFromInput = (input: string): ActionPayload | null => {
    const lower = input.toLowerCase();
    const mentionsLog =
      lower.includes("health log") ||
      lower.includes("log") ||
      lower.includes("record");
    // Quick heuristic: if it mentions log/symptom or contains severity-like numbers, try to build a health log action
    if (!mentionsLog && !/\b\d{1,2}\b/.test(lower)) return null;

    const parts = input
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const symptomCandidate = parts[0] || input.split(" ")[0];
    const severityMatch = input.match(/\b(10|[1-9])\b/);
    const severity = severityMatch ? Number(severityMatch[1]) : null;
    const datePart =
      parts.find((p) =>
        p.match(/today|tomorrow|tmr|yesterday|\d{4}-\d{2}-\d{2}|am|pm|:/i),
      ) || null;
    const notesParts = parts
      .slice(1)
      .filter((p) => p !== severityMatch?.[0] && p !== datePart);
    if (!symptomCandidate) return null;

    return {
      entity: "health_log",
      intent: "create",
      data: {
        symptom_type: symptomCandidate,
        severity: severity ?? undefined,
        start_date: datePart ?? undefined,
        notes: notesParts.length ? notesParts.join(", ") : undefined,
      },
    };
  };

  const parseDateTime = (value: string | undefined | null) => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    const lower = trimmed.toLowerCase();

    const baseDateFromKeyword = () => {
      const today = new Date();
      if (lower.startsWith("tomorrow") || lower.startsWith("tmr")) {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return d;
      }
      if (lower.startsWith("yesterday")) {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return d;
      }
      if (lower.startsWith("today") || lower.startsWith("tonight")) {
        return today;
      }
      return null;
    };

    const tryCombine = (date: Date, timePart: string) => {
      const comboStr = `${date.toDateString()} ${timePart}`.trim();
      const dt = new Date(comboStr);
      return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
    };

    const keywordDate = baseDateFromKeyword();
    if (keywordDate) {
      const timePart = trimmed
        .replace(/^today[, ]*/i, "")
        .replace(/^tonight[, ]*/i, "")
        .replace(/^tomorrow[, ]*/i, "")
        .replace(/^tmr[, ]*/i, "")
        .replace(/^yesterday[, ]*/i, "")
        .trim();
      if (!timePart) return null; // require a time when using relative words
      const combined = tryCombine(keywordDate, timePart);
      if (combined) return combined;
    }

    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) {
      return direct.toISOString();
    }
    // Fallback: try using today's date with provided time (e.g., "7:00 PM")
    const today = new Date();
    const fallback = tryCombine(today, trimmed);
    return fallback;
  };

  const resolveAppointmentId = async (
    user: { id: string },
    data: Record<string, unknown>,
  ) => {
    if (typeof data.id === "string") return data.id;
    const appts = latestAppts.length
      ? latestAppts
      : await getAppointmentRemindersByUser(user.id);
    const name =
      typeof data.appointment_name === "string"
        ? data.appointment_name.toLowerCase()
        : "";
    const dateIso = parseDateTime(
      typeof data.date === "string" ? data.date : undefined,
    );
    const match = appts.find((a) => {
      const sameName = name && a.appointment_name.toLowerCase() === name;
      const sameDate =
        dateIso &&
        new Date(a.date).toISOString() === new Date(dateIso).toISOString();
      return sameName || sameDate;
    });
    return match?.id;
  };

  const resolveMedicationId = async (
    user: { id: string },
    data: Record<string, unknown>,
  ) => {
    if (typeof data.id === "string") return data.id;
    const meds = latestMeds.length
      ? latestMeds
      : await getMedicationRemindersByUser(user.id);
    const name =
      typeof data.medication_name === "string"
        ? data.medication_name.toLowerCase()
        : "";
    const timeIso = parseDateTime(
      typeof data.reminder_time === "string" ? data.reminder_time : undefined,
    );
    const match = meds.find((m) => {
      const sameName = name && m.medication_name.toLowerCase() === name;
      const sameTime =
        timeIso &&
        new Date(m.reminder_time).toISOString() ===
          new Date(timeIso).toISOString();
      return sameName || sameTime;
    });
    return match?.id;
  };

  const resolveHealthLogId = async (
    user: { id: string },
    data: Record<string, unknown>,
  ) => {
    if (typeof data.id === "string") return data.id;
    const logs = latestLogs.length
      ? latestLogs
      : await getHealthLogsByUser(user.id);
    const symptom =
      typeof data.symptom_type === "string"
        ? data.symptom_type.toLowerCase()
        : "";
    const startIso = parseDateTime(
      typeof data.start_date === "string" ? data.start_date : undefined,
    );
    const match = logs.find((l) => {
      const sameSymptom =
        symptom && (l.symptom_type ?? "").toLowerCase() === symptom;
      const sameStart =
        startIso &&
        new Date(l.start_date).toISOString() ===
          new Date(startIso).toISOString();
      return sameSymptom || sameStart;
    });
    return match?.id;
  };

  const applyAction = async () => {
    if (!pendingAction) return;
    setApplyingAction(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      if (pendingAction.entity === "appointment") {
        const data = pendingAction.data;
        if (pendingAction.intent === "create") {
          if (typeof data.appointment_name !== "string") {
            throw new Error("Appointment name is required to create.");
          }
          const dateIso = parseDateTime(
            typeof data.date === "string" ? data.date : undefined,
          );
          if (!dateIso) {
            throw new Error(
              "Valid appointment date/time is required to create. Please provide a time.",
            );
          }
          await createAppointmentReminder({
            user_profile_id: user.id,
            appointment_name: data.appointment_name,
            date: dateIso,
          });
          toast.success("Appointment created.");
        } else if (pendingAction.intent === "update") {
          const id = await resolveAppointmentId(user, data);
          if (!id) throw new Error("Unable to find appointment to update.");
          const updatePayload: {
            appointment_name?: string;
            date?: string;
          } = {};
          if (typeof data.appointment_name === "string") {
            updatePayload.appointment_name = data.appointment_name;
          }
          const dateIso = parseDateTime(
            typeof data.date === "string" ? data.date : undefined,
          );
          if (dateIso) updatePayload.date = dateIso;
          if (Object.keys(updatePayload).length === 0) {
            throw new Error("No valid fields to update.");
          }
          await updateAppointmentReminder(id, updatePayload);
          toast.success("Appointment updated.");
        } else if (pendingAction.intent === "delete") {
          const id = await resolveAppointmentId(user, data);
          if (!id) throw new Error("Unable to find appointment to delete.");
          await deleteAppointmentReminder(id);
          toast.success("Appointment deleted.");
        }
        const refreshed = await getAppointmentRemindersByUser(user.id);
        setLatestAppts(refreshed);
      } else if (pendingAction.entity === "medication") {
        const data = pendingAction.data;
        if (pendingAction.intent === "create") {
          if (typeof data.medication_name !== "string") {
            throw new Error("Medication name is required to create.");
          }
          const timeIso = parseDateTime(
            typeof data.reminder_time === "string"
              ? data.reminder_time
              : undefined,
          );
          if (!timeIso) {
            throw new Error("Valid reminder time is required to create.");
          }
          await createMedicationReminder({
            user_profile_id: user.id,
            medication_name: data.medication_name,
            reminder_time: timeIso,
            dosage:
              typeof data.dosage === "string" || data.dosage === null
                ? data.dosage
                : null,
            recurrence:
              typeof data.recurrence === "string" || data.recurrence === null
                ? data.recurrence
                : null,
          });
          toast.success("Medication reminder created.");
        } else if (pendingAction.intent === "update") {
          const id = await resolveMedicationId(user, data);
          if (!id) throw new Error("Unable to find medication to update.");
          const updatePayload: {
            medication_name?: string;
            reminder_time?: string;
            dosage?: string | null;
            recurrence?: string | null;
          } = {};
          if (typeof data.medication_name === "string") {
            updatePayload.medication_name = data.medication_name;
          }
          const timeIso = parseDateTime(
            typeof data.reminder_time === "string"
              ? data.reminder_time
              : undefined,
          );
          if (timeIso) updatePayload.reminder_time = timeIso;
          if (typeof data.dosage === "string" || data.dosage === null) {
            updatePayload.dosage = data.dosage ?? null;
          }
          if (typeof data.recurrence === "string" || data.recurrence === null) {
            updatePayload.recurrence = data.recurrence ?? null;
          }
          if (Object.keys(updatePayload).length === 0) {
            throw new Error("No valid fields to update.");
          }
          await updateMedicationReminder(id, updatePayload);
          toast.success("Medication reminder updated.");
        } else if (pendingAction.intent === "delete") {
          const id = await resolveMedicationId(user, data);
          if (!id) throw new Error("Unable to find medication to delete.");
          await deleteMedicationReminder(id);
          toast.success("Medication reminder deleted.");
        }
        const refreshed = await getMedicationRemindersByUser(user.id);
        setLatestMeds(refreshed);
      } else if (pendingAction.entity === "health_log") {
        const data = pendingAction.data;
        if (pendingAction.intent === "create") {
          if (typeof data.symptom_type !== "string") {
            throw new Error("Symptom type is required to create a health log.");
          }
          const startIso = parseDateTime(
            typeof data.start_date === "string" ? data.start_date : undefined,
          );
          await createHealthLog({
            user_profile_id: user.id,
            symptom_type: data.symptom_type,
            severity:
              typeof data.severity === "number"
                ? data.severity
                : typeof data.severity === "string"
                  ? Number(data.severity)
                  : null,
            mood: typeof data.mood === "string" ? data.mood : null,
            medication_intake:
              typeof data.medication_intake === "string"
                ? data.medication_intake
                : null,
            notes: typeof data.notes === "string" ? data.notes : null,
            start_date: startIso ?? new Date().toISOString(),
          });
          toast.success("Health log created.");
        } else if (pendingAction.intent === "update") {
          const id = await resolveHealthLogId(user, data);
          if (!id) throw new Error("Unable to find health log to update.");
          const updatePayload: {
            symptom_type?: string | null;
            severity?: number | null;
            mood?: string | null;
            medication_intake?: string | null;
            notes?: string | null;
            start_date?: string;
          } = {};
          if (typeof data.symptom_type === "string") {
            updatePayload.symptom_type = data.symptom_type;
          }
          if (typeof data.severity === "number") {
            updatePayload.severity = data.severity;
          } else if (typeof data.severity === "string") {
            const num = Number(data.severity);
            if (!Number.isNaN(num)) updatePayload.severity = num;
          }
          if (typeof data.mood === "string") {
            updatePayload.mood = data.mood;
          }
          if (typeof data.medication_intake === "string") {
            updatePayload.medication_intake = data.medication_intake;
          }
          if (typeof data.notes === "string") {
            updatePayload.notes = data.notes;
          }
          const startIso = parseDateTime(
            typeof data.start_date === "string" ? data.start_date : undefined,
          );
          if (startIso) updatePayload.start_date = startIso;
          if (Object.keys(updatePayload).length === 0) {
            throw new Error("No valid fields to update.");
          }
          await updateHealthLog(id, updatePayload);
          toast.success("Health log updated.");
        } else if (pendingAction.intent === "delete") {
          const id = await resolveHealthLogId(user, data);
          if (!id) throw new Error("Unable to find health log to delete.");
          await deleteHealthLog(id);
          toast.success("Health log deleted.");
        }
        const refreshed = await getHealthLogsByUser(user.id);
        setLatestLogs(refreshed);
      }

      setPendingAction(null);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to apply AI suggestion.",
      );
    } finally {
      setApplyingAction(false);
    }
  };

  /**
   * This function clears the chat messages in UI and local storage
   */
  const handleClear = () => {
    setMessages([]);
    if (userId) {
      localStorage.removeItem(`symptomSyncChat-${userId}`);
    }
    hasSentMessageRef.current = false;
  };

  /**
   * Animated dots for loading state - like 1, 2, 3 dots...
   *
   * @returns Animated dots for loading state
   */
  const AnimatedDots: React.FC = () => {
    const [dots, setDots] = useState("");

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 500);
      return () => clearInterval(interval);
    }, []);

    return <span>{dots}</span>;
  };

  /**
   * Scroll to the bottom of the chat when new messages are added or on initial load
   * since the messages are loaded from local storage
   */
  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [messages]);

  return (
    <>
      <Head>
        <title>SymptomSync | AI Chat</title>
        <meta name="description" content="Chat with SymptomSync Assistant" />
      </Head>

      <ClientOnly>
        <motion.div
          className="h-screen bg-background text-foreground p-4 sm:p-6 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
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
          <div className="max-w-4xl mx-auto space-y-6 pt-2">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col md:flex-row justify-between items-center"
              >
                <motion.div variants={slideInLeft}>
                  <h1 className="text-3xl font-extrabold text-center md:text-left">
                    Your Health Assistant 👨‍⚕️
                  </h1>
                  <motion.p
                    variants={cardVariants}
                    className="text-foreground mt-2 text-center md:text-left"
                  >
                    Ask our AI anything about your health. It’s like having a
                    doctor in your pocket!
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>

            {messages.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 hover:scale-102 transition-transform cursor-pointer"
                  onClick={handleClear}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Conversation
                </Button>
              </div>
            )}

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="p-4 sm:p-6 flex flex-col h-[70vh] rounded-xl shadow-2xl">
                <div className="flex-1 overflow-y-auto mb-4">
                  {pendingAction ? (
                    <div className="h-full flex flex-col gap-4 bg-muted/50 border border-primary/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-lg font-semibold">
                            AI Suggested Change
                          </p>
                          <div className="flex gap-2 items-center">
                            <span className="uppercase tracking-wide text-[11px] bg-primary text-primary-foreground px-2 py-1 rounded">
                              {pendingAction.intent}
                            </span>
                            <span className="capitalize text-sm font-medium text-primary">
                              {pendingAction.entity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Review and confirm before applying.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingAction(null)}
                        >
                          Dismiss
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                        {Object.entries(pendingAction.data).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-col gap-1 border border-primary/20 rounded-lg px-3 py-2 bg-background shadow-sm"
                            >
                              <span className="text-xs font-bold uppercase tracking-wide text-primary">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-sm font-medium text-foreground break-words">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={applyAction}
                          disabled={applyingAction}
                          className="cursor-pointer"
                        >
                          {applyingAction ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Apply change
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPendingAction(null)}
                          className="cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 && !loading && (
                        <div className="text-center text-gray-500 my-8">
                          <p>Type something to begin!</p>
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            variants={bubbleVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -10 }}
                            className={`mb-2 flex ${
                              msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`
                            rounded-lg p-2 pb-0 shadow 
                            ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }
                            max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg
                            overflow-x-auto hover:shadow-lg transition-shadow duration-300
                          `}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {loading && (
                        <motion.div
                          variants={bubbleVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -10 }}
                          className="flex justify-start mb-2"
                        >
                          <div className="bg-muted text-muted-foreground p-2 rounded-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow overflow-x-auto flex items-center gap-2">
                            <Loader2 className="animate-spin w-5 h-5" />
                            <span>
                              Thinking
                              <AnimatedDots />
                            </span>
                          </div>
                        </motion.div>
                      )}

                      <div ref={scrollRef} />
                    </>
                  )}
                </div>

                {aiError && (
                  <div className="mb-3">
                    <Card className="p-3 bg-destructive/10 border border-destructive/30 text-destructive">
                      <p className="text-sm font-semibold">AI issue</p>
                      <p className="text-sm">{aiError}</p>
                    </Card>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message…"
                    className="flex-1"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </ClientOnly>
    </>
  );
}
