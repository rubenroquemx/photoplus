import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db-init";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    return NextResponse.json({
      success: true,
      message: "Tablas de PostgreSQL verificadas y creadas correctamente.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al inicializar la base de datos";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
