import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  extractDriveFolderId,
  listDriveFolders,
  listSubfoldersInFolder,
  listDriveImagesInFolder,
  getAuthenticatedDriveClient,
} from "@/lib/google-drive";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";

async function syncSingleFolder(
  rawFolderId: string,
  folderName?: string,
  folderCreatedTime?: string | null
) {
  const folderId = extractDriveFolderId(rawFolderId);
  const settings = await getStoreSettings();
  const photoPrice = settings.defaultPrice || 50.0;
  const drive = await getAuthenticatedDriveClient();

  // If folderName or createdTime wasn't passed, fetch from Drive metadata
  let name = folderName;
  let createdTimeStr = folderCreatedTime;

  if (!name || !createdTimeStr) {
    try {
      const meta = await drive.files.get({
        fileId: folderId,
        fields: "id, name, createdTime",
        supportsAllDrives: true,
      });
      name = meta.data.name || "Nuevo Álbum";
      createdTimeStr = meta.data.createdTime || null;
    } catch (err: unknown) {
      console.warn("Could not fetch metadata for folderId:", folderId, err);
      name = name || "Álbum de Google Drive";
    }
  }

  const folderDate = createdTimeStr ? new Date(createdTimeStr) : new Date();

  // Fetch images from this Drive folder
  const drivePhotos = await listDriveImagesInFolder(folderId);

  if (drivePhotos.length === 0) {
    return {
      success: false,
      folderId,
      name,
      message: `No se encontraron imágenes en la carpeta "${name}". Asegúrate de que contenga archivos JPG, PNG o WEBP.`,
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
    const { ensureDatabaseSchema } = await import("@/lib/db-init");
    await ensureDatabaseSchema();

    const body = await request.json().catch(() => ({}));
    const { folderId, folderName, createdTime, autoSyncAll, isRootFolderExplicit } = body;

    const settings = await getStoreSettings();

    // 1. Auto-sync from configured Root Folder or all root folders
    if (autoSyncAll) {
      const rootFolderId = settings.driveRootFolderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
      let targetFolders: Array<{ id?: string | null; name?: string | null; createdTime?: string | null }> = [];

      if (rootFolderId) {
        targetFolders = await listSubfoldersInFolder(rootFolderId);
      } else {
        targetFolders = await listDriveFolders();
      }

      const results = [];
      for (const f of targetFolders) {
        if (f.id && f.name) {
          try {
            const res = await syncSingleFolder(f.id, f.name, f.createdTime);
            results.push(res);
          } catch (folderErr) {
            console.error(`Error syncing folder ${f.name}:`, folderErr);
          }
        }
      }

      const validResults = results.filter((r) => r.success);
      const totalPhotos = validResults.reduce((acc, r) => acc + (r.totalPhotos || 0), 0);

      return NextResponse.json({
        success: true,
        autoSynced: true,
        totalAlbumsSynced: validResults.length,
        totalPhotos,
        results,
        message: `¡Sincronización completada! Se procesaron ${validResults.length} álbumes (${totalPhotos} fotos) con sus nombres y fechas originales.`,
      });
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "El ID o enlace de la carpeta de Google Drive es obligatorio" },
        { status: 400 }
      );
    }

    const cleanFolderId = extractDriveFolderId(folderId);

    // 2. Check if this folder contains subfolders (ROOT FOLDER PATTERN)
    const subfolders = await listSubfoldersInFolder(cleanFolderId);

    if (subfolders.length > 0 || isRootFolderExplicit) {
      // It is a ROOT FOLDER! Remember it in StoreSettings
      await prisma.storeSetting.upsert({
        where: { id: "main" },
        update: { driveRootFolderId: cleanFolderId },
        create: { driveRootFolderId: cleanFolderId },
      });

      if (subfolders.length === 0) {
        return NextResponse.json({
          error: "La carpeta raíz especificada no contiene subcarpetas con imágenes.",
        }, { status: 400 });
      }

      // Sync each subfolder as an independent album named after the subfolder
      const results = [];
      for (const sub of subfolders) {
        if (sub.id && sub.name) {
          try {
            const res = await syncSingleFolder(sub.id, sub.name, sub.createdTime);
            results.push(res);
          } catch (subErr) {
            console.error(`Error syncing subfolder ${sub.name}:`, subErr);
          }
        }
      }

      const validResults = results.filter((r) => r.success);
      const totalPhotos = validResults.reduce((acc, r) => acc + (r.totalPhotos || 0), 0);

      return NextResponse.json({
        success: true,
        isRootFolder: true,
        rootFolderId: cleanFolderId,
        subfolderCount: subfolders.length,
        totalAlbumsSynced: validResults.length,
        totalPhotos,
        results,
        message: `¡Carpeta raíz sincronizada! Se crearon/actualizaron ${validResults.length} álbumes individuales con el nombre de cada carpeta y su fecha original (${totalPhotos} fotografías en total).`,
      });
    }

    // 3. Single folder synchronization
    const result = await syncSingleFolder(cleanFolderId, folderName, createdTime);
    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "No se encontraron fotos en la carpeta especificada" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error syncing Drive folder:", error);
    const message = error instanceof Error ? error.message : "Error al sincronizar con Google Drive";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
