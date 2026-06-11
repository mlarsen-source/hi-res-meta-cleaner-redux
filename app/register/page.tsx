"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";

export default function RegisterPage() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError((data as { error?: string }).error ?? "Registration failed");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const loginRes = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: form.email, password: form.password }),
    });

    setLoading(false);

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      setUser({ user_id: (loginData as { user_id: number }).user_id, email: form.email });
      router.push("/");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h1>
      <form onSubmit={onSubmit} className="space-y-4" data-testid="register-form">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              value={form.firstName}
              onChange={onChange("firstName")}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              data-testid="first-name-input"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              value={form.lastName}
              onChange={onChange("lastName")}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              data-testid="last-name-input"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={onChange("email")}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="email-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={onChange("password")}
            required
            minLength={8}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            data-testid="password-input"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" data-testid="register-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          data-testid="submit-button"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
