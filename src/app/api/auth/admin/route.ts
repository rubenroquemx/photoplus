import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, setAdminSession, clearAdminSession } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const isAuth = await isAdminAuthenticated();
  const session = await prisma.adminSession.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      email: true,
      name: true,
      picture: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    authenticated: isAuth,
    driveConnected: !!session,
    account: session,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { password, action } = await request.json();

    if (action === "logout") {
      await clearAdminSession();
      return NextResponse.json({ success: true, message: "Sesión cerrada" });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD || "adminphotoplus";

    if (password === expectedPassword) {
      await setAdminSession();
      return NextResponse.json({ success: true, message: "Acceso concedido" });
    }

    return NextResponse.json(
      { success: false, error: "Contraseña incorrecta" },
      { status: 401 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error de autenticación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
