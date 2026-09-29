import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json({ albums });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener álbumes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id, isPublished, defaultPrice, title, description, watermarkText } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID del álbum requerido" }, { status: 400 });
    }

    const updated = await prisma.album.update({
      where: { id },
      data: {
        isPublished: typeof isPublished === "boolean" ? isPublished : undefined,
        defaultPrice: typeof defaultPrice === "number" ? defaultPrice : undefined,
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        watermarkText: watermarkText !== undefined ? watermarkText : undefined,
      },
    });

    // If defaultPrice changed, update photos in that album too
    if (typeof defaultPrice === "number") {
      await prisma.photo.updateMany({
        where: { albumId: id },
        data: { price: defaultPrice },
      });
    }

    return NextResponse.json({ success: true, album: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar álbum";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar álbum";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
