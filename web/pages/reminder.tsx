import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bell, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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

  useEffect(() => {
    fetchReminders();
  }, []);

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

    setEditMedTime(med.reminder_time);
    setEditMedRecurrence(med.recurrence ?? "Daily");
    setEditMedCalendarSync("");
  }

  async function saveEditedReminder() {
    if (!editingMed) return;

    const { error } = await supabase
      .from("medication_reminders")
      .update({
        medication_name: editMedName,
        dosage: `${editMedDosage} ${editMedDosageUnit}`,
        reminder_time: editMedTime,
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Medication Reminder Schedule</h1>

      {loading ? (
        <p>Loading reminders...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="bg-[#2F3C56] text-white p-6 rounded-xl shadow flex justify-between items-start"
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
                {/* Bell Button */}
                <Button             // THE BELL BUTTON DOESN'T DO ANYTHING FOR NOW!!!
                  variant="ghost"
                  size="icon"
                  title="Remind">
                  <Bell size={16} />
                </Button>

                {/* Pencil Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Edit"
                  onClick={() => openEditMedDialog(reminder)}
                >
                  <Pencil size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editingMed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Reminder</h2>

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
              <Button onClick={() => setEditingMed(null)}>Cancel</Button>
              <Button onClick={saveEditedReminder}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

