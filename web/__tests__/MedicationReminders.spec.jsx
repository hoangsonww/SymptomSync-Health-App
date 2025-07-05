import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import MedicationReminders from "@/pages/medications";

jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn(() => ({
      // used in update
      update: jest.fn(() => ({ eq: jest.fn() })),
    })),
  },
}));

jest.mock("@/lib/medications", () => ({
  getPaginatedMedicationRemindersByUser: jest.fn(async () => ({
    data: [
      {
        id: "r1",
        medication_name: "Aspirin",
        dosage: "500 mg",
        reminder_time: new Date().toISOString(),
        recurrence: "Daily",
        user_profile_id: "user-id",
      },
    ],
    count: 1,
  })),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("<MedicationReminders />", () => {
  it("renders list with a medication card", async () => {
    render(<MedicationReminders />);
    expect(await screen.findByText(/aspirin/i)).toBeInTheDocument();
  });

  it("shows pagination controls", async () => {
    render(<MedicationReminders />);
    expect(
      await screen.findByRole("button", { name: /next/i }),
    ).toBeInTheDocument();
  });
});
