import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const validEmail = process.env.ADMIN_EMAIL || "admin@domain.com";
    const validPassword = process.env.ADMIN_PASSWORD || "admin@123";
    const sessionToken =
      process.env.ADMIN_SESSION_TOKEN || "saada_admin_secure_auth_token_2026";

    // Validate credentials
    if (email?.trim().toLowerCase() !== validEmail.toLowerCase() || password !== validPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}

