import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";
import { getPaginatedMedicationRemindersByUser } from "@/lib/medications";
import { Bell, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomTimePicker } from "@/components/ui/time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

interface Reminder {
  id: string;
  medication_name: string;
  dosage: string;
  reminder_time: string;
  recurrence: string;
  user_profile_id: string;
}

export default function MedicationReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMed, setEditingMed] = useState<Reminder | null>(null);
  const [editMedName, setEditMedName] = useState("");
  const [editMedDosage, setEditMedDosage] = useState("");
  const [editMedDosageUnit, setEditMedDosageUnit] = useState("mg");
  const [editMedDate, setEditMedDate] = useState<Date | undefined>(undefined);
  const [editMedTimePicker, setEditMedTimePicker] = useState("00:00");
  const [editMedRecurrence, setEditMedRecurrence] = useState("Daily");
  const [editMedCalendarSync, setEditMedCalendarSync] = useState("");
  const [medPage, setMedPage] = useState(1);
  const [totalMeds, setTotalMeds] = useState(0);

  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null);

  /**
   * Trigger a broadcast event to all connected clients
   *
   * @param eventName - The name of the event to broadcast.
   * @param message - The message to send with the event.
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

  useEffect(() => {
    fetchReminders();
  }, [medPage]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subscription: any;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel("medicationChanges")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          () => {
            console.log("Med INSERT received");
            fetchReminders();
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
            console.log("Med UPDATE received");
            fetchReminders();
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
            fetchReminders();
          },
        )
        .subscribe();
    }
    init();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchReminders() {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    try {
      const { data, count } = await getPaginatedMedicationRemindersByUser(
        userId,
        medPage,
        50,
      );
      const uiReminders: Reminder[] = data.map((r) => ({
        ...r,
        dosage: r.dosage ?? "",
        recurrence: r.recurrence ?? "",
      }));
      setReminders(uiReminders);
      setTotalMeds(count);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Failed to load medication reminders.");
    } finally {
      setLoading(false);
    }
  }

  function openEditMedDialog(med: Reminder) {
    setEditingMed(med);
    setEditMedName(med.medication_name);

    if (med.dosage) {
      // Assume dosage is stored as "number unit", e.g. "500 mg"
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
    setEditMedCalendarSync("");
  }

  async function handleUpdateMed() {
    if (!editingMed || !editMedDate) return;
    const dateString = format(editMedDate, "yyyy-MM-dd");
    const combined = `${dateString}T${editMedTimePicker}`;
    const localDate = new Date(combined);
    const isoString = localDate.toISOString();

    const { error } = await supabase
      .from("medication_reminders")
      .update({
        medication_name: editMedName,
        // Join the numeric dosage with unit (example: "500 mg")
        dosage: `${editMedDosage} ${editMedDosageUnit}`,
        reminder_time: isoString,
        recurrence: editMedRecurrence,
        calendar_sync_token: editMedCalendarSync,
      })
      .eq("id", editingMed.id);

    if (error) {
      console.error("Failed to update reminder:", error);
      toast.error("Failed to update reminder.");
    } else {
      await fetchReminders();
      setEditingMed(null);
      setEditMedName("");
      setEditMedDosage("");
      setEditMedDosageUnit("mg");
      setEditMedDate(undefined);
      setEditMedTimePicker("00:00");
      setEditMedRecurrence("Daily");
      setEditMedCalendarSync("");
      toast.success("Reminder updated successfully.");
      sendBroadcast(
        "med-update",
        `Medication reminder "${editMedName}" updated successfully.`,
      );
    }
  }

  function handleBellClick(reminder: Reminder) {
    const takeTime = format(new Date(reminder.reminder_time), "PPP, h:mm a");
    toast(
      `Reminder: Don't forget to take ${reminder.medication_name} at ${takeTime}!`,
    );
  }

  const totalPages = Math.ceil(totalMeds / 50);

  return (
    <>
      <Head>
        <title>SymptomSync | Medications</title>
        <meta
          name="description"
          content="Manage your medication reminders and never miss your dose."
        />
      </Head>

      <motion.div
        className="min-h-screen p-6 bg-gradient-to-r"
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
        <motion.header
          variants={slideInLeft}
          className="text-center md:text-left mb-8 p-2"
        >
          <h1 className="text-3xl font-bold text-foreground">Medications 💊</h1>
          <p className="text-foreground mt-2 text-center md:text-left">
            Here are all your medications. Remember to take your meds on time!
          </p>
        </motion.header>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin h-12 w-12 text-gray-600" />
          </div>
        ) : (
          <>
            <motion.div
              variants={cardContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {reminders.map((reminder) => (
                <motion.div
                  key={reminder.id}
                  variants={fadeInUp}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0px 8px 16px rgba(0,0,0,0.2)",
                  }}
                  className="bg-[#2F3C56] text-white p-6 rounded-xl shadow-lg flex justify-between items-start transition-transform"
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">
                      {reminder.medication_name}
                    </h2>
                    <p className="text-sm mb-2">
                      {format(new Date(reminder.reminder_time), "PPP, h:mm a")}
                    </p>
                    <p className="italic text-sm mb-2">
                      Dosage: {reminder.dosage || "N/A"}
                    </p>
                    <p className="text-sm">
                      Recurrence: {reminder.recurrence || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end text-white opacity-80">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remind"
                      onClick={() => handleBellClick(reminder)}
                      className="cursor-pointer hover:scale-110 transition-transform duration-300"
                    >
                      <Bell size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      onClick={() => openEditMedDialog(reminder)}
                      className="cursor-pointer hover:scale-110 transition-transform duration-300"
                    >
                      <Pencil size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-8 px-4">
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
                Page {medPage} of {totalPages}
              </span>

              <Button
                size="sm"
                onClick={() => setMedPage((p) => Math.min(p + 1, totalPages))}
                disabled={medPage >= totalPages}
                className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </>
        )}

        {/* Edit Medication Dialog */}
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
                  placeholder="Medication Name"
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
                    placeholder="Amount"
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
                  Recurrence<span className="ml-0 text-red-500">*</span>
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
      </motion.div>
    </>
  );
}
