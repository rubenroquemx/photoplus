import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { customerId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        photo: {
          include: {
            album: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        id: f.id,
        photoId: f.photoId,
        createdAt: f.createdAt,
        photo: f.photo,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener favoritas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Debes iniciar sesión con Google para guardar tus fotos favoritas.", requireAuth: true },
      { status: 401 }
    );
  }

  try {
    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json({ error: "ID de foto requerido" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        customerId_photoId: {
          customerId: session.id,
          photoId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ isFavorite: false, message: "Foto eliminada de favoritas" });
    } else {
      await prisma.favorite.create({
        data: {
          customerId: session.id,
          photoId,
        },
      });
      return NextResponse.json({ isFavorite: true, message: "Foto guardada en tus favoritas" });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar favoritas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
