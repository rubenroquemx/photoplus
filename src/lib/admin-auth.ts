import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "photoplus_admin_auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const adminSecret = process.env.ADMIN_SESSION_SECRET || "photoplus_super_secret_key_change_in_production_12345";

  return token === adminSecret;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const adminSecret = process.env.ADMIN_SESSION_SECRET || "photoplus_super_secret_key_change_in_production_12345";

  cookieStore.set(ADMIN_COOKIE_NAME, adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
