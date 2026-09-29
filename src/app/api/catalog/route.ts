import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("albumId");

  try {
    const settings = await getStoreSettings();

    const albums = await prisma.album.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        photosCount: true,
        defaultPrice: true,
        coverPhotoDriveId: true,
      },
    });

    const whereClause: { isAvailable: boolean; album?: { isPublished: boolean }; albumId?: string } = {
      isAvailable: true,
      album: { isPublished: true },
    };

    if (albumId && albumId !== "all") {
      whereClause.albumId = albumId;
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        album: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      take: 200,
    });

    return NextResponse.json({
      settings,
      albums,
      photos,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener catálogo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
