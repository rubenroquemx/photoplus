import prisma from "./prisma";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

const INIT_SQL = `
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Album" (
    "id" TEXT NOT NULL,
    "driveFolderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverPhotoDriveId" TEXT,
    "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "watermarkText" TEXT,
    "photosCount" INTEGER NOT NULL DEFAULT 0,
    "driveFolderCreatedTime" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Photo" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProvider" TEXT NOT NULL DEFAULT 'MERCADO_PAGO',
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "downloadToken" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "downloadLimit" INTEGER NOT NULL DEFAULT 10,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StoreSetting" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "storeName" TEXT NOT NULL DEFAULT 'PhotoPlus Studio',
    "storeTagline" TEXT NOT NULL DEFAULT 'Galería y venta de fotografías de alta resolución',
    "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "watermarkText" TEXT NOT NULL DEFAULT 'PHOTOPLUS • MUESTRA',
    "watermarkOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.40,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "instagramUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_email_key" ON "AdminSession"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Favorite_customerId_idx" ON "Favorite"("customerId");
CREATE INDEX IF NOT EXISTS "Favorite_photoId_idx" ON "Favorite"("photoId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_customerId_photoId_key" ON "Favorite"("customerId", "photoId");
CREATE UNIQUE INDEX IF NOT EXISTS "Album_driveFolderId_key" ON "Album"("driveFolderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Photo_driveFileId_key" ON "Photo"("driveFileId");
CREATE INDEX IF NOT EXISTS "Photo_albumId_idx" ON "Photo"("albumId");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "OrderItem_downloadToken_key" ON "OrderItem"("downloadToken");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_photoId_idx" ON "OrderItem"("photoId");

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Favorite_customerId_fkey') THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Favorite_photoId_fkey') THEN
        ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Photo_albumId_fkey') THEN
        ALTER TABLE "Photo" ADD CONSTRAINT "Photo_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_customerId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_orderId_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_photoId_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
`;

export async function ensureDatabaseSchema(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("==> Verificando estructura de la base de datos PostgreSQL...");
      await prisma.$executeRawUnsafe(INIT_SQL);
      console.log("==> Estructura de base de datos verificada y lista.");
      isInitialized = true;
    } catch (err) {
      console.error("Error al inicializar tablas en PostgreSQL:", err);
      // Don't permanently lock as failed so it can retry on next request if needed
      initPromise = null;
    }
  })();

  return initPromise;
}
