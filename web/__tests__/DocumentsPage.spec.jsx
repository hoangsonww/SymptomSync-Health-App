import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocumentsPage from "@/pages/documents";

jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ count: 1 })) })),
      delete: jest.fn(() => ({ eq: jest.fn() })),
    })),
  },
}));

jest.mock("@/lib/files", () => ({
  fetchUserFiles: jest.fn(async () => [
    {
      id: "f1",
      filename: "lab-results.pdf",
      url: "http://example.com/lab.pdf",
      file_type: "application/pdf",
      uploaded_at: new Date().toISOString(),
      tags: ["blood"],
    },
  ]),
  uploadUserFile: jest.fn(async () => ({
    id: "new",
    filename: "new.pdf",
    url: "url",
    file_type: "application/pdf",
    uploaded_at: new Date().toISOString(),
  })),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("<DocumentsPage />", () => {
  it("renders table row with file name", async () => {
    render(<DocumentsPage />);
    expect(await screen.findByText(/lab-results.pdf/i)).toBeInTheDocument();
  });

  it("filters table via search box", async () => {
    render(<DocumentsPage />);
    const search = await screen.findByPlaceholderText(/search a document/i);
    fireEvent.change(search, { target: { value: "xyz" } });

    await waitFor(() =>
      expect(screen.queryByText(/lab-results.pdf/i)).not.toBeInTheDocument(),
    );
  });
});
