import { cookies } from "next/headers";
import prisma from "./prisma";

const ADMIN_COOKIE_NAME = "photoplus_admin_auth";
const CUSTOMER_COOKIE_NAME = "photoplus_customer_session";

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const configured = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  if (!configured.trim()) {
    // If not explicitly set in env, any connected Drive account in AdminSession is considered admin
    return true;
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

  // 1. Direct admin cookie check
  if (token && token === adminSecret) {
    return true;
  }

  // 2. Check if user is logged in via Google Customer session and is the designated Admin Email
  const customerId = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  try {
    const { ensureDatabaseSchema } = await import("./db-init");
    await ensureDatabaseSchema();

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { email: true },
      });

      if (customer && isAuthorizedAdminEmail(customer.email)) {
        return true;
      }
    }

    // 3. Check if there's a connected Admin Google Drive session
    const adminSession = await prisma.adminSession.findFirst({
      where: { refreshToken: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { email: true },
    });

    if (adminSession && isAuthorizedAdminEmail(adminSession.email)) {
      if (token === adminSecret) return true;
    }
  } catch (err) {
    console.error("Error verifying admin authentication from DB:", err);
  }

  return false;
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
