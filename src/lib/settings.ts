import prisma from "./prisma";

export async function getStoreSettings() {
  const { ensureDatabaseSchema } = await import("./db-init");
  await ensureDatabaseSchema();

  let settings = await prisma.storeSetting.findUnique({
    where: { id: "main" },
  });

  if (!settings) {
    settings = await prisma.storeSetting.create({
      data: {
        id: "main",
        storeName: "PhotoPlus Studio",
        storeTagline: "Galería fotográfica y venta de fotos digitales de alta resolución",
        defaultPrice: 50.0,
        currency: "MXN",
        watermarkText: "PHOTOPLUS • MUESTRA",
        watermarkOpacity: 0.35,
      },
    });
  }

  return settings;
}
