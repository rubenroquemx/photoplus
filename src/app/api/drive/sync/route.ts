import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listDriveImagesInFolder } from "@/lib/google-drive";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { folderId, title, description, price, watermarkText } = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: "El ID de la carpeta de Drive es obligatorio" },
        { status: 400 }
      );
    }

    const settings = await getStoreSettings();
    const photoPrice = typeof price === "number" && price > 0 ? price : settings.defaultPrice;

    // Fetch images from Google Drive
    const drivePhotos = await listDriveImagesInFolder(folderId);

    if (drivePhotos.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron imágenes válidas (.jpg, .jpeg, .png, .webp) en esta carpeta de Google Drive." },
        { status: 400 }
      );
    }

    // Upsert Album
    const album = await prisma.album.upsert({
      where: { driveFolderId: folderId },
      update: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        defaultPrice: photoPrice,
        watermarkText: watermarkText || undefined,
        photosCount: drivePhotos.length,
        lastSyncedAt: new Date(),
        coverPhotoDriveId: drivePhotos[0]?.id || null,
      },
      create: {
        driveFolderId: folderId,
        title: title || "Nuevo Álbum",
        description: description || null,
        defaultPrice: photoPrice,
        watermarkText: watermarkText || null,
        photosCount: drivePhotos.length,
        lastSyncedAt: new Date(),
        coverPhotoDriveId: drivePhotos[0]?.id || null,
      },
    });

    // Upsert each Photo
    let createdCount = 0;
    let updatedCount = 0;

    for (const photo of drivePhotos) {
      const existing = await prisma.photo.findUnique({
        where: { driveFileId: photo.id },
      });

      if (existing) {
        await prisma.photo.update({
          where: { id: existing.id },
          data: {
            name: photo.name,
            mimeType: photo.mimeType,
            width: photo.width,
            height: photo.height,
            size: photo.size,
          },
        });
        updatedCount++;
      } else {
        await prisma.photo.create({
          data: {
            albumId: album.id,
            driveFileId: photo.id,
            name: photo.name,
            mimeType: photo.mimeType,
            price: photoPrice,
            width: photo.width,
            height: photo.height,
            size: photo.size,
          },
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      albumId: album.id,
      albumTitle: album.title,
      totalPhotos: drivePhotos.length,
      createdCount,
      updatedCount,
    });
  } catch (error: unknown) {
    console.error("Error syncing Drive folder:", error);
    const message = error instanceof Error ? error.message : "Error al sincronizar con Google Drive";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
