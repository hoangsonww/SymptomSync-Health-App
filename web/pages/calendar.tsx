import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
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
import { Trash2, Edit3, CheckSquare, XSquare } from "lucide-react";
import Head from "next/head";

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
 * Takes a medication reminder and expands it into multiple calendar events based on its recurrence.
 *
 * @param med - The medication reminder object.
 * @param horizonDays - The number of days to expand the events into the future.
 * @returns - An array of calendar events.
 */
function expandMedication(
  med: MedicationReminder,
  horizonDays = 90,
): CalendarEvent[] {
  const baseTime = new Date(med.reminder_time);
  const events: CalendarEvent[] = [];

  if (!med.recurrence || med.recurrence.toLowerCase() === "as needed") {
    events.push({
      id: `med-${med.id}`,
      title: `Med: ${med.medication_name}`,
      start: new Date(med.reminder_time),
      end: new Date(med.reminder_time),
      type: "medication",
    });
    return events;
  }

  const endPoint = addDays(baseTime, horizonDays);

  let deltaDays = 1;
  if (med.recurrence.toLowerCase() === "weekly") {
    deltaDays = 7;
  } else if (med.recurrence.toLowerCase() === "biweekly") {
    deltaDays = 14;
  } else if (med.recurrence.toLowerCase() === "monthly") {
    // no need to change deltaDays
  }

  let index = 0;

  if (med.recurrence.toLowerCase() === "monthly") {
    let current = new Date(baseTime);
    while (current <= endPoint) {
      events.push({
        id: `med-${med.id}-${index}`,
        title: `Med: ${med.medication_name}`,
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
        title: `Med: ${med.medication_name}`,
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
  const [newApptDate, setNewApptDate] = useState("");
  const [newApptTime, setNewApptTime] = useState("");
  const [newMedName, setNewMedName] = useState("");
  const [newMedTime, setNewMedTime] = useState("");
  const [newMedRecurrence, setNewMedRecurrence] = useState<null | string>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    new Set(),
  );

  /**
   * Supabase Realtime: Subscribe to changes in medication and appointment reminders
   * and update the UI immediately as changes occur.
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
            event: "*",
            schema: "public",
            table: "medication_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            if (isMounted) await fetchAllData(user.id);
          },
        )
        .subscribe();
      channelRefs.current.push(medsChannel);

      const apptsChannel = supabase
        .channel("apptsSub")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointment_reminders",
            filter: `user_profile_id=eq.${user.id}`,
          },
          async () => {
            if (isMounted) await fetchAllData(user.id);
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
   * Retrieve meds & appts => generate events array
   */
  async function fetchAllData(uid: string) {
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
        title: `Appt: ${a.appointment_name}`,
        start: startDate,
        end: endDate,
        type: "appointment",
      };
    });

    setEvents([...medEvents, ...apptEvents]);
  }

  function handleSelectSlot(slotInfo: { start: Date; end: Date }) {
    setSlotDate(slotInfo.start);
    setShowSelectTypeDialog(true);
  }

  /**
   * After picking "appointment" or "medication"
   */
  function onSelectType(type: "appointment" | "medication") {
    setAddType(type);
    if (slotDate) {
      const dateStr = format(slotDate, "yyyy-MM-dd");
      const timeStr = format(slotDate, "HH:mm");
      if (type === "appointment") {
        setNewApptDate(dateStr);
        setNewApptTime(timeStr);
      } else {
        setNewMedTime(`${dateStr}T${timeStr}`);
      }
    }
    setShowSelectTypeDialog(false);
    setShowAddDialog(true);
  }

  /**
   * Add Appointment
   */
  async function handleAddAppointment() {
    if (!userId || !newApptName || !newApptDate) return;
    try {
      const dateTime = newApptTime
        ? `${newApptDate}T${newApptTime}`
        : newApptDate;
      const created = await createAppointmentReminder({
        user_profile_id: userId,
        appointment_name: newApptName,
        date: dateTime,
      });

      const startDt = new Date(created.date);
      const endDt = new Date(created.date);
      endDt.setHours(endDt.getHours() + 1);
      setEvents((prev) => [
        ...prev,
        {
          id: `appt-${created.id}`,
          title: `Appt: ${created.appointment_name}`,
          start: startDt,
          end: endDt,
          type: "appointment",
        },
      ]);

      toast.success("Appointment created & displayed");
      setShowAddDialog(false);
      setNewApptName("");
      setNewApptDate("");
      setNewApptTime("");
    } catch (err) {
      toast.error("Error creating appointment");
      console.error(err);
    }
  }

  /**
   * Add Medication
   */
  async function handleAddMedication() {
    if (!userId || !newMedName || !newMedTime) return;
    try {
      const created = await createMedicationReminder({
        user_profile_id: userId,
        medication_name: newMedName,
        dosage: null,
        reminder_time: newMedTime,
        recurrence: newMedRecurrence,
        calendar_sync_token: null,
      });

      const repeated = expandMedication(created);
      setEvents((prev) => [...prev, ...repeated]);

      toast.success("Medication created & displayed");
      setShowAddDialog(false);
      setNewMedName("");
      setNewMedTime("");
      setNewMedRecurrence(null);
    } catch (err) {
      toast.error("Error creating medication");
      console.error(err);
    }
  }

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
    setEditTitle(ev.title.replace(/^Med: |^Appt: /, ""));
    const dt = ev.start;
    setEditDate(format(dt, "yyyy-MM-dd"));
    setEditTime(format(dt, "HH:mm"));
    setShowEventDialog(true);
  }

  function eventPropGetter(event: CalendarEvent) {
    if (selectedEventIds.has(event.id)) {
      return {
        style: {
          backgroundColor: "#FFAEBC",
          border: "2px solid #FF577F",
        },
      };
    }
    return {};
  }

  /**
   * Save event edits => if it's appointment or medication
   */
  async function handleSaveEventEdits() {
    if (!dialogEvent || !userId) return;
    const dateTime = editTime ? `${editDate}T${editTime}` : editDate;
    const newStart = new Date(dateTime);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [type, realId, _maybeIndex] = dialogEvent.id.split("-");
      if (type === "appt") {
        const updated = await updateAppointmentReminder(realId, {
          appointment_name: editTitle,
          date: newStart.toISOString(),
        });
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === dialogEvent.id) {
              const newEnd = new Date(updated.date);
              newEnd.setHours(newEnd.getHours() + 1);
              return {
                ...e,
                title: `Appt: ${updated.appointment_name}`,
                start: new Date(updated.date),
                end: newEnd,
              };
            }
            return e;
          }),
        );
        toast.success("Appointment updated");
      } else {
        const updated = await updateMedicationReminder(realId, {
          medication_name: editTitle,
          reminder_time: newStart.toISOString(),
        });

        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === dialogEvent.id) {
              return {
                ...e,
                title: `Med: ${updated.medication_name}`,
                start: new Date(updated.reminder_time),
                end: new Date(updated.reminder_time),
              };
            }
            return e;
          }),
        );
        toast.success("Medication updated");
      }
      setShowEventDialog(false);
    } catch (err) {
      toast.error("Error updating event");
      console.error(err);
    }
  }

  function handleDeleteSingle() {
    if (!dialogEvent) return;
    setDeleteTargetIds([dialogEvent.id]);
    setShowConfirmDeleteDialog(true);
  }

  function handleDeleteSelected() {
    if (selectedEventIds.size === 0) return;
    setDeleteTargetIds(Array.from(selectedEventIds));
    setShowConfirmDeleteDialog(true);
  }

  async function doDeleteEvents() {
    try {
      for (const eId of deleteTargetIds) {
        const [type, realId] = eId.split("-");
        if (type === "appt") {
          await deleteAppointmentReminder(realId);
        } else {
          await deleteMedicationReminder(realId);
        }
      }
      toast.success("Deleted events");
      setEvents((prev) =>
        prev.filter((evt) => !deleteTargetIds.includes(evt.id)),
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

  return (
    <>
      <Head>
        <title>SymptomSync | Calendar</title>
        <meta
          name="description"
          content="Manage your appointments & medications easily"
        />
      </Head>
      <div className="w-full h-screen p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div style={{ animationDelay: "0.1s" }}>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Calendar 📆</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your appointments & medications easily
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="hover:-translate-y-1 transition-transform duration-300"
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) setSelectedEventIds(new Set());
              }}
            >
              {selectMode ? (
                <>
                  <XSquare className="w-4 h-4 mr-1" />
                  Cancel Selection
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Select Multiple
                </>
              )}
            </Button>

            {selectMode && selectedEventIds.size > 0 && (
              <Button
                variant="destructive"
                className="hover:-translate-y-1 transition-transform duration-300"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete {selectedEventIds.size} Selected
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => {
              setAddType("appointment");
              setShowAddDialog(true);
            }}
            className="hover:-translate-y-1 transition-transform duration-300"
          >
            Add Appointment
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setAddType("medication");
              setShowAddDialog(true);
            }}
            className="hover:-translate-y-1 transition-transform duration-300"
          >
            Add Medication
          </Button>
        </div>

        <div
          className="bg-popover border border-border p-1 rounded-lg"
          style={{ height: "calc(100vh - 12rem)" }}
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["month", "week", "day", "agenda"]}
            style={{ height: "100%", width: "100%" }}
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
          />
        </div>

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
                onClick={() => setShowSelectTypeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => onSelectType("appointment")}
              >
                Appointment
              </Button>
              <Button
                variant="default"
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
            ) : (
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
                    value={newMedRecurrence || ""}
                    onChange={(e) => setNewMedRecurrence(e.target.value)}
                  >
                    <option value="">As Needed</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Biweekly">Biweekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              {addType === "appointment" ? (
                <Button variant="default" onClick={handleAddAppointment}>
                  Save
                </Button>
              ) : (
                <Button variant="default" onClick={handleAddMedication}>
                  Save
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>
                Edit or delete the event below.
              </DialogDescription>
            </DialogHeader>

            {dialogEvent && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>
                    {dialogEvent.type === "appointment"
                      ? "Appointment"
                      : "Medication"}{" "}
                    Title
                  </Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowEventDialog(false)}
              >
                Close
              </Button>
              {dialogEvent && (
                <>
                  <Button variant="default" onClick={handleSaveEventEdits}>
                    <Edit3 className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSingle}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
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
                event(s)?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowConfirmDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={doDeleteEvents}>
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
