import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";
import { Bell, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
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
  const [editMedTime, setEditMedTime] = useState("");
  const [editMedRecurrence, setEditMedRecurrence] = useState("Daily");
  const [editMedCalendarSync, setEditMedCalendarSync] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchReminders();
  }, []);

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

  async function fetchReminders() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated");
      return;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from("medication_reminders")
      .select("*")
      .eq("user_profile_id", userId)
      .order("reminder_time", { ascending: true });

    if (error) {
      console.error("Error fetching reminders:", error);
    } else {
      setReminders(data);
    }
    setLoading(false);
  }

  function openEditMedDialog(med: Reminder) {
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

    const localDateTime = format(
      new Date(med.reminder_time),
      "yyyy-MM-dd'T'HH:mm",
    );
    setEditMedTime(localDateTime);

    setEditMedRecurrence(med.recurrence ?? "Daily");
    setEditMedCalendarSync("");
  }

  async function saveEditedReminder() {
    if (!editingMed) return;
    const localDate = new Date(editMedTime);
    const isoString = localDate.toISOString();

    const { error } = await supabase
      .from("medication_reminders")
      .update({
        medication_name: editMedName,
        dosage: `${editMedDosage} ${editMedDosageUnit}`,
        reminder_time: isoString,
        recurrence: editMedRecurrence,
        calendar_sync_token: editMedCalendarSync,
      })
      .eq("id", editingMed.id);

    if (error) {
      console.error("Failed to update reminder:", error);
    } else {
      await fetchReminders();
      setEditingMed(null);
    }
  }

  function handleBellClick(reminder: Reminder) {
    const takeTime = format(new Date(reminder.reminder_time), "PPP, h:mm a");
    toast(
      `Reminder: Don't forget to take ${reminder.medication_name} at ${takeTime}!`,
      {
        duration: 4000,
      },
    );
  }

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
        <motion.header
          variants={slideInLeft}
          className="text-center md:text-left mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800">
            Medication Schedule 💊
          </h1>
          <p className="text-muted-foreground mt-2 text-center md:text-left">
            Here are your medication reminders. Remember to take your meds on
            time!
          </p>
        </motion.header>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin h-12 w-12 text-gray-600" />
          </div>
        ) : (
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
                className="bg-[#2F3C56] text-white p-6 rounded-xl shadow-lg flex justify-between items-start cursor-pointer transition-transform"
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
                </div>

                <div className="flex flex-col gap-2 items-end text-white opacity-80">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remind"
                    onClick={() => handleBellClick(reminder)}
                    className="cursor-pointer"
                  >
                    <Bell size={16} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit"
                    onClick={() => openEditMedDialog(reminder)}
                    className="cursor-pointer"
                  >
                    <Pencil size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {editingMed && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Edit Reminder
              </h2>

              <Input
                type="text"
                value={editMedName}
                onChange={(e) => setEditMedName(e.target.value)}
                className="mb-3 w-full border rounded p-2"
                placeholder="Medication Name"
              />

              <Input
                type="text"
                value={editMedDosage}
                onChange={(e) => setEditMedDosage(e.target.value)}
                className="mb-3 w-full border rounded p-2"
                placeholder="Dosage"
              />

              <Input
                type="datetime-local"
                value={editMedTime}
                onChange={(e) => setEditMedTime(e.target.value)}
                className="mb-3 w-full border rounded p-2"
              />

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setEditingMed(null)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button onClick={saveEditedReminder} className="cursor-pointer">
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
