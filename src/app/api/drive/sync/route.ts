import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listDriveFolders, listDriveImagesInFolder, getAuthenticatedDriveClient } from "@/lib/google-drive";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";

async function syncSingleFolder(
  folderId: string,
  folderName?: string,
  folderCreatedTime?: string | null
) {
  const settings = await getStoreSettings();
  const photoPrice = settings.defaultPrice || 50.0;
  const drive = await getAuthenticatedDriveClient();

  // If folderName or createdTime wasn't passed, fetch from Drive metadata
  let name = folderName;
  let createdTimeStr = folderCreatedTime;

  if (!name || !createdTimeStr) {
    const meta = await drive.files.get({
      fileId: folderId,
      fields: "id, name, createdTime",
    });
    name = meta.data.name || "Nuevo Álbum";
    createdTimeStr = meta.data.createdTime || null;
  }

  const folderDate = createdTimeStr ? new Date(createdTimeStr) : new Date();

  // Fetch images from this Drive folder
  const drivePhotos = await listDriveImagesInFolder(folderId);

  if (drivePhotos.length === 0) {
    return {
      success: false,
      folderId,
      name,
      message: "No se encontraron imágenes en esta carpeta",
    };
  }

  // Upsert Album with Drive folder's name, creation date, and store base price
  const album = await prisma.album.upsert({
    where: { driveFolderId: folderId },
    update: {
      title: name,
      defaultPrice: photoPrice,
      photosCount: drivePhotos.length,
      driveFolderCreatedTime: folderDate,
      createdAt: folderDate, // Exact date the folder was created in Drive
      lastSyncedAt: new Date(),
      coverPhotoDriveId: drivePhotos[0]?.id || null,
    },
    create: {
      driveFolderId: folderId,
      title: name,
      defaultPrice: photoPrice,
      currency: "MXN",
      photosCount: drivePhotos.length,
      driveFolderCreatedTime: folderDate,
      createdAt: folderDate,
      lastSyncedAt: new Date(),
      coverPhotoDriveId: drivePhotos[0]?.id || null,
    },
  });

  // Upsert each Photo with the base price
  for (const photo of drivePhotos) {
    await prisma.photo.upsert({
      where: { driveFileId: photo.id },
      update: {
        name: photo.name,
        mimeType: photo.mimeType,
        width: photo.width,
        height: photo.height,
        size: photo.size,
      },
      create: {
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
  }

  return {
    success: true,
    albumId: album.id,
    albumTitle: album.title,
    totalPhotos: drivePhotos.length,
    folderDate,
  };
}

export async function POST(request: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { folderId, folderName, createdTime, autoSyncAll } = await request.json();

    // Auto-sync all folders from Drive that are not yet imported or need sync
    if (autoSyncAll) {
      const allFolders = await listDriveFolders();
      const results = [];

      for (const f of allFolders) {
        if (f.id && f.name) {
          try {
            const res = await syncSingleFolder(f.id, f.name, f.createdTime);
            results.push(res);
          } catch (folderErr) {
            console.error(`Error syncing folder ${f.name}:`, folderErr);
          }
        }
      }

      return NextResponse.json({
        success: true,
        autoSynced: true,
        results,
      });
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "El ID de la carpeta de Drive es obligatorio" },
        { status: 400 }
      );
    }

    const result = await syncSingleFolder(folderId, folderName, createdTime);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error syncing Drive folder:", error);
    const message = error instanceof Error ? error.message : "Error al sincronizar con Google Drive";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
