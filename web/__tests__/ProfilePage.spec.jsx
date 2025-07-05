import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/pages/profile";

jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

jest.mock("@/lib/profile", () => ({
  getCurrentProfile: jest.fn(async () => ({
    id: "1",
    email: "me@mail.com",
    full_name: "John Doe",
    avatar_url: null,
    condition_tags: ["Asthma"],
    created_at: new Date().toISOString(),
  })),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("<ProfilePage />", () => {
  it("shows profile headline and opens edit dialog", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText(/your profile/i)).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole("button", { name: /edit profile/i }),
    );
    expect(
      await screen.findByRole("dialog", { name: /edit your profile/i }),
    ).toBeInTheDocument();

    const fnameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(fnameInput, { target: { value: "Jane Doe" } });
    expect(fnameInput).toHaveValue("Jane Doe");
  });
});
