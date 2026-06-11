import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Top-level mocks — Vitest hoists these regardless of nesting
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/app/hooks/useCollection", () => ({
  useCollection: vi.fn(),
}));
vi.mock("@/app/lib/client/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
}));

import { useAuth } from "@/app/components/AuthProvider";
import { useCollection } from "@/app/hooks/useCollection";
import HomePage from "@/app/page";

const mockUseAuth = vi.mocked(useAuth);
const mockUseCollection = vi.mocked(useCollection);

const defaultCollection = {
  files: [],
  loading: false,
  error: null,
  refresh: vi.fn(),
  updateFile: vi.fn(),
};

describe("Home page (signed out)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, setUser: vi.fn(), logout: vi.fn() });
    mockUseCollection.mockReturnValue(defaultCollection);
  });

  it("shows login prompt and no collection table", () => {
    render(<HomePage />);
    expect(screen.getByTestId("login-prompt")).toBeInTheDocument();
    expect(screen.queryByTestId("collection-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("drop-zone")).not.toBeInTheDocument();
  });
});

describe("Home page (signed in)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { user_id: 1, email: "test@test.com" },
      setUser: vi.fn(),
      logout: vi.fn(),
    });
    mockUseCollection.mockReturnValue(defaultCollection);
  });

  it("shows upload area when authenticated", () => {
    render(<HomePage />);
    expect(screen.getByTestId("drop-zone")).toBeInTheDocument();
    expect(screen.queryByTestId("login-prompt")).not.toBeInTheDocument();
  });

  it("shows empty collection message when no files", () => {
    render(<HomePage />);
    expect(screen.getByTestId("empty-collection")).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    mockUseCollection.mockReturnValue({
      files: [],
      loading: true,
      error: null,
      refresh: vi.fn(),
      updateFile: vi.fn(),
    });
    render(<HomePage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});
