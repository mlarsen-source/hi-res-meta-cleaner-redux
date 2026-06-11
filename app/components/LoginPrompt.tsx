import Link from "next/link";

export function LoginPrompt() {
  return (
    <div className="text-center py-16" data-testid="login-prompt">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Hi-Res Meta Cleaner</h2>
      <p className="text-gray-500 mb-6">
        Upload, edit, and export audio file metadata from one place.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/login"
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
