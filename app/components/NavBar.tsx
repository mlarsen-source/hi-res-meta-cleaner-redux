"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <Link href="/" className="font-semibold text-gray-900 hover:text-blue-600">
        Hi-Res Meta Cleaner
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
              data-testid="logout-button"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
