import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getStoreSettings } from "@/lib/settings";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener configuración";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const updated = await prisma.storeSetting.upsert({
      where: { id: "main" },
      update: {
        storeName: data.storeName,
        storeTagline: data.storeTagline,
        defaultPrice: typeof data.defaultPrice === "number" ? data.defaultPrice : undefined,
        watermarkText: data.watermarkText,
        watermarkOpacity: typeof data.watermarkOpacity === "number" ? data.watermarkOpacity : undefined,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        instagramUrl: data.instagramUrl,
      },
      create: {
        id: "main",
        storeName: data.storeName || "PhotoPlus Studio",
        storeTagline: data.storeTagline || "Galería y venta de fotografías",
        defaultPrice: data.defaultPrice || 50.0,
        watermarkText: data.watermarkText || "PHOTOPLUS • MUESTRA",
        watermarkOpacity: data.watermarkOpacity || 0.35,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        instagramUrl: data.instagramUrl,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al guardar configuración";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
