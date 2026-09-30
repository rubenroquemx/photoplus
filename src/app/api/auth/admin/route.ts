import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, clearAdminSession } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { ensureDatabaseSchema } = await import("@/lib/db-init");
    await ensureDatabaseSchema();
  } catch (err) {
    console.error("Error in ensureDatabaseSchema:", err);
  }

  const isAuth = await isAdminAuthenticated();
  let session = null;
  try {
    const { isAuthorizedAdminEmail } = await import("@/lib/admin-auth");
    const configured = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
    const sessions = await prisma.adminSession.findMany({
      where: {
        OR: [
          { refreshToken: { not: null } },
          { accessToken: { not: null } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        email: true,
        name: true,
        picture: true,
        updatedAt: true,
      },
    });
    session = configured.trim()
      ? sessions.find((s) => isAuthorizedAdminEmail(s.email)) || null
      : sessions[0] || null;
  } catch (err) {
    console.error("Error fetching admin session:", err);
  }

  return NextResponse.json({
    authenticated: isAuth,
    driveConnected: !!session,
    account: session,
    adminEmail: process.env.ADMIN_EMAIL || null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "logout") {
      await clearAdminSession();
      return NextResponse.json({ success: true, message: "Sesión cerrada" });
    }

    return NextResponse.json(
      { success: false, error: "El acceso se realiza exclusivamente mediante Google Drive." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error de autenticación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
