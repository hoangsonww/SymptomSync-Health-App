import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import HomePage from "@/pages/index";

/* Freeze timers so animations & Date.now() are deterministic */
const NOW = new Date("2025-01-01T10:00:00Z");
jest.useFakeTimers().setSystemTime(NOW);

/* ────────────  DEPENDENCY MOCKS  ──────────── */
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: new Proxy(
      {},
      {
        get: () => (props) => React.createElement("div", props, props.children),
      },
    ),
  };
});

jest.mock("react-chartjs-2", () => ({
  Line: () => <canvas data-testid="chart" />,
  Bar: () => <canvas data-testid="chart" />,
  Doughnut: () => <canvas data-testid="chart" />,
  Radar: () => <canvas data-testid="chart" />,
  PolarArea: () => <canvas data-testid="chart" />,
}));

jest.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ value, onChange }) => (
    <input
      data-testid="date-input"
      type="date"
      value={value ? format(value, "yyyy-MM-dd") : ""}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}));
jest.mock("@/components/ui/time-picker", () => ({
  CustomTimePicker: ({ value, onChange }) => (
    <input
      data-testid="time-input"
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", resolvedTheme: "light" }),
}));

jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "usr_1" } } }) },
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: () => undefined }) }),
    }),
    removeChannel: () => undefined,
  },
}));

const demoMed = {
  id: "med_1",
  user_profile_id: "usr_1",
  medication_name: "Ibuprofen",
  dosage: "200 mg",
  reminder_time: new Date("2025-01-02T09:00:00Z").toISOString(),
  recurrence: "Daily",
  calendar_sync_token: null,
  created_at: new Date("2025-01-01T09:00:00Z").toISOString(),
};

jest.mock("@/lib/medications", () => ({
  getPaginatedMedicationRemindersByUser: jest.fn(async () => ({
    data: [demoMed],
    count: 1,
  })),
  getMedicationRemindersByUser: jest.fn(async () => [demoMed]),
  createMedicationReminder: jest.fn(async () => ({})),
}));

jest.mock("@/lib/appointmentReminders", () => ({
  getPaginatedAppointmentRemindersByUser: jest.fn(async () => ({
    data: [],
    count: 0,
  })),
  getAppointmentRemindersByUser: jest.fn(async () => []),
}));

jest.mock("@/lib/healthLogs", () => ({
  getPaginatedHealthLogsByUser: jest.fn(async () => ({
    data: [],
    count: 0,
  })),
  getHealthLogsByUser: jest.fn(async () => []),
}));

/* ────────────  TEST SUITE  ──────────── */
describe("<HomePage />", () => {
  test("renders counters and adds a medication", async () => {
    render(<HomePage />);
    expect(
      await screen.findByRole("heading", { name: /total medications/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1")[0]).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    userEvent.click(screen.getByRole("button", { name: /add medication/i }));

    const nameInput = await screen.findByPlaceholderText(/e\.g\. ibuprofen/i);
    userEvent.type(nameInput, "Paracetamol");
    userEvent.type(screen.getByPlaceholderText(/e\.g\. 200/i), "500");
    userEvent.type(screen.getByTestId("date-input"), "2025-01-05");
    userEvent.type(screen.getByTestId("time-input"), "08:30");

    userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    const { createMedicationReminder } = require("@/lib/medications");
    await waitFor(() =>
      expect(createMedicationReminder).toHaveBeenCalledTimes(1),
    );

    const payload = createMedicationReminder.mock.calls[0][0];
    expect(payload.medication_name).toBe("Paracetamol");
    expect(payload.dosage).toBe("500 mg");
    expect(payload.recurrence).toBe("Daily");
  });
});
