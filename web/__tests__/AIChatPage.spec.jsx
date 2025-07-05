/* eslint-disable testing-library/no-node-access */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AIChatPage from "@/pages/chat";
import { supabase } from "@/lib/supabaseClient";

// ─── mocks ──────────────────────────────────────────────────────────────
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

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/aiChat", () => ({
  chatWithHealthAI: jest.fn(async () => "Hello from AI!"),
}));

// ─── tests ──────────────────────────────────────────────────────────────
describe("<AIChatPage />", () => {
  beforeEach(() => {
    // pretend we are logged-in
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    // clear LS between tests
    localStorage.clear();
  });

  it("renders page header", async () => {
    render(<AIChatPage />);
    expect(
      await screen.findByText(/Your Health Assistant/i),
    ).toBeInTheDocument();
  });

  it("sends user message and shows AI reply", async () => {
    render(<AIChatPage />);
    const input = await screen.findByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: "Hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // user bubble
    expect(await screen.findByText("Hi")).toBeInTheDocument();
    // mocked AI reply
    await waitFor(() =>
      expect(screen.getByText("Hello from AI!")).toBeInTheDocument(),
    );
  });
});
