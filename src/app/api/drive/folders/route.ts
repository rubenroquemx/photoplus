import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listDriveFolders } from "@/lib/google-drive";

export async function GET() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const folders = await listDriveFolders();
    return NextResponse.json({ folders });
  } catch (error: unknown) {
    console.error("Error listing Drive folders:", error);
    const message = error instanceof Error ? error.message : "Error al obtener carpetas de Google Drive";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
