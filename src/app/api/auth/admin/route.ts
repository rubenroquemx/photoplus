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
    session = await prisma.adminSession.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        email: true,
        name: true,
        picture: true,
        updatedAt: true,
      },
    });
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
