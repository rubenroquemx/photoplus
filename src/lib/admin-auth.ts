import { cookies } from "next/headers";
import prisma from "./prisma";

const ADMIN_COOKIE_NAME = "photoplus_admin_auth";

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const configured = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  if (!configured.trim()) {
    // If ADMIN_EMAIL is not explicitly configured, deny access for safety
    return false;
  }

  const allowedEmails = configured
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const adminSecret = process.env.ADMIN_SESSION_SECRET || "photoplus_super_secret_key_change_in_production_12345";

  // Strict check: Must have the specific admin session cookie
  if (!token || token !== adminSecret) {
    return false;
  }

  // Ensure DB schema exists
  try {
    const { ensureDatabaseSchema } = await import("./db-init");
    await ensureDatabaseSchema();
  } catch (err) {
    console.error("Error ensuring schema:", err);
  }

  return true;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const adminSecret = process.env.ADMIN_SESSION_SECRET || "photoplus_super_secret_key_change_in_production_12345";
  const isHttps = (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://");

  cookieStore.set(ADMIN_COOKIE_NAME, adminSecret, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
