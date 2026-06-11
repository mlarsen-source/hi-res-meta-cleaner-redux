import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/lib/db/models";
import { hashPassword } from "@/app/lib/auth/hashPassword";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { firstName, lastName, email, password } = body as {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    password?: unknown;
  };

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (typeof email !== "string" || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const password_hash = await hashPassword(password as string);
    const newUser = await User.create({
      email: String(email),
      password_hash,
      first_name: String(firstName),
      last_name: String(lastName),
    });

    return NextResponse.json(
      {
        user_id: newUser.user_id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "SequelizeUniqueConstraintError"
    ) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    throw err;
  }
}
