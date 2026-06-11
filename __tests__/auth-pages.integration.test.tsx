import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks ---
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockSetUser = vi.fn();
vi.mock("@/app/components/AuthProvider", () => ({
  useAuth: () => ({ setUser: mockSetUser, user: null, logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// --- Login page tests ---
describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("renders login form fields", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("submits credentials and redirects on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user_id: 1, email: "test@test.com" }),
    });

    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("email-input"), "test@test.com");
    await userEvent.type(screen.getByTestId("password-input"), "password123");
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(mockSetUser).toHaveBeenCalledWith({ user_id: 1, email: "test@test.com" });
  });

  it("shows error message on 401 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    await userEvent.type(screen.getByTestId("email-input"), "bad@test.com");
    await userEvent.type(screen.getByTestId("password-input"), "wrong");
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() =>
      expect(screen.getByTestId("login-error")).toHaveTextContent("Invalid credentials")
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// --- Register page tests ---
describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("renders register form", async () => {
    const RegisterPage = (await import("@/app/register/page")).default;
    render(<RegisterPage />);
    expect(screen.getByTestId("first-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("last-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
  });

  it("shows error on 409 duplicate email", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email already registered" }),
    });

    const RegisterPage = (await import("@/app/register/page")).default;
    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("first-name-input"), "Jane");
    await userEvent.type(screen.getByTestId("last-name-input"), "Doe");
    await userEvent.type(screen.getByTestId("email-input"), "dupe@test.com");
    await userEvent.type(screen.getByTestId("password-input"), "password123");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() =>
      expect(screen.getByTestId("register-error")).toHaveTextContent("Email already registered")
    );
  });

  it("auto-logins and redirects on successful registration", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user_id: 2 }) }) // register
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user_id: 2 }) }); // auto-login

    const RegisterPage = (await import("@/app/register/page")).default;
    render(<RegisterPage />);

    await userEvent.type(screen.getByTestId("first-name-input"), "John");
    await userEvent.type(screen.getByTestId("last-name-input"), "Doe");
    await userEvent.type(screen.getByTestId("email-input"), "new@test.com");
    await userEvent.type(screen.getByTestId("password-input"), "securepass");
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });
});
