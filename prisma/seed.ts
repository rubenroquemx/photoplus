import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando datos de demostración en PhotoPlus...");

  // 1. Store settings
  await prisma.storeSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      storeName: "Rubén Roque Photography",
      storeTagline: "Galería de eventos y sesiones exclusivas con entrega directa en alta resolución",
      defaultPrice: 65.0,
      currency: "MXN",
      watermarkText: "RUBEN ROQUE • MUESTRA",
      watermarkOpacity: 0.35,
    },
  });

  // 2. Demo Album 1
  const albumBoda = await prisma.album.upsert({
    where: { driveFolderId: "demo-folder-boda-2026" },
    update: {},
    create: {
      driveFolderId: "demo-folder-boda-2026",
      title: "Boda Valentina & Mateo",
      description: "Sesión completa de ceremonia y recepción en Hacienda San José",
      defaultPrice: 75.0,
      currency: "MXN",
      isPublished: true,
      watermarkText: "RUBEN ROQUE • BODA V&M",
      photosCount: 6,
      lastSyncedAt: new Date(),
      coverPhotoDriveId: "demo-photo-boda-1",
    },
  });

  const bodaPhotos = [
    { driveFileId: "demo-photo-boda-1", name: "Ceremonia_Entrada_001.jpg", price: 75.0, width: 6000, height: 4000 },
    { driveFileId: "demo-photo-boda-2", name: "Anillos_Detalle_042.jpg", price: 75.0, width: 6000, height: 4000 },
    { driveFileId: "demo-photo-boda-3", name: "Votos_Emocion_089.jpg", price: 75.0, width: 6000, height: 4000 },
    { driveFileId: "demo-photo-boda-4", name: "Vals_Principal_120.jpg", price: 75.0, width: 6000, height: 4000 },
    { driveFileId: "demo-photo-boda-5", name: "Retrato_Novios_Jardin_155.jpg", price: 75.0, width: 6000, height: 4000 },
    { driveFileId: "demo-photo-boda-6", name: "Fiesta_Brindis_210.jpg", price: 75.0, width: 6000, height: 4000 },
  ];

  for (const p of bodaPhotos) {
    await prisma.photo.upsert({
      where: { driveFileId: p.driveFileId },
      update: {},
      create: {
        albumId: albumBoda.id,
        driveFileId: p.driveFileId,
        name: p.name,
        price: p.price,
        width: p.width,
        height: p.height,
        mimeType: "image/jpeg",
        size: 8500000,
      },
    });
  }

  // 3. Demo Album 2
  const albumRetratos = await prisma.album.upsert({
    where: { driveFolderId: "demo-folder-retratos-2026" },
    update: {},
    create: {
      driveFolderId: "demo-folder-retratos-2026",
      title: "Sesión Editorial & Retratos Urbanos",
      description: "Retratos individuales en locaciones urbanas",
      defaultPrice: 50.0,
      currency: "MXN",
      isPublished: true,
      watermarkText: "RUBEN ROQUE • EDITORIAL",
      photosCount: 4,
      lastSyncedAt: new Date(),
      coverPhotoDriveId: "demo-photo-retrato-1",
    },
  });

  const retratoPhotos = [
    { driveFileId: "demo-photo-retrato-1", name: "Retrato_GoldenHour_01.jpg", price: 50.0, width: 4000, height: 6000 },
    { driveFileId: "demo-photo-retrato-2", name: "Editorial_Look_02.jpg", price: 50.0, width: 4000, height: 6000 },
    { driveFileId: "demo-photo-retrato-3", name: "Luces_Nocturnas_03.jpg", price: 50.0, width: 4000, height: 6000 },
    { driveFileId: "demo-photo-retrato-4", name: "Blanco_Y_Negro_Clasico_04.jpg", price: 50.0, width: 4000, height: 6000 },
  ];

  for (const p of retratoPhotos) {
    await prisma.photo.upsert({
      where: { driveFileId: p.driveFileId },
      update: {},
      create: {
        albumId: albumRetratos.id,
        driveFileId: p.driveFileId,
        name: p.name,
        price: p.price,
        width: p.width,
        height: p.height,
        mimeType: "image/jpeg",
        size: 6200000,
      },
    });
  }

  console.log("¡Sembrado completado con éxito!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
