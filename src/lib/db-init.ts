import prisma from "./prisma";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

const DDL_STATEMENTS = [
  `CREATE SCHEMA IF NOT EXISTS "public"`,

  `CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "picture" TEXT,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "StoreSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "storeName" TEXT NOT NULL DEFAULT 'PhotoPlus Studio',
    "storeTagline" TEXT NOT NULL DEFAULT 'Galería y venta de fotografías de alta resolución',
    "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "watermarkText" TEXT NOT NULL DEFAULT 'PHOTOPLUS • MUESTRA',
    "watermarkOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.40,
    "driveRootFolderId" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "instagramUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `ALTER TABLE "StoreSetting" ADD COLUMN IF NOT EXISTS "driveRootFolderId" TEXT`,

  `CREATE TABLE IF NOT EXISTS "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driveFolderId" TEXT NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "downloadToken" TEXT NOT NULL UNIQUE,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "downloadLimit" INTEGER NOT NULL DEFAULT 10,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS "Favorite_customerId_idx" ON "Favorite"("customerId")`,
  `CREATE INDEX IF NOT EXISTS "Favorite_photoId_idx" ON "Favorite"("photoId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_customerId_photoId_key" ON "Favorite"("customerId", "photoId")`,
  `CREATE INDEX IF NOT EXISTS "Photo_albumId_idx" ON "Photo"("albumId")`,
  `CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId")`,
  `CREATE INDEX IF NOT EXISTS "Order_customerEmail_idx" ON "Order"("customerEmail")`,
  `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId")`,
  `CREATE INDEX IF NOT EXISTS "OrderItem_photoId_idx" ON "OrderItem"("photoId")`,

  `INSERT INTO "StoreSetting" ("id", "storeName", "storeTagline", "defaultPrice", "currency", "watermarkText", "watermarkOpacity", "updatedAt")
   VALUES ('main', 'PhotoPlus Studio', 'Galería y venta de fotografías de alta resolución', 50.0, 'MXN', 'PHOTOPLUS • MUESTRA', 0.40, CURRENT_TIMESTAMP)
   ON CONFLICT ("id") DO NOTHING`,

  `DO $$ 
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
   END $$;`
];

export async function ensureDatabaseSchema(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("==> Verificando y asegurando tablas en PostgreSQL...");
      for (const statement of DDL_STATEMENTS) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (stmtErr) {
          console.warn("Notice on statement:", statement.slice(0, 40), stmtErr);
        }
      }
      console.log("==> ✅ Estructura de PostgreSQL completa.");
      isInitialized = true;
    } catch (err) {
      console.error("Error al inicializar tablas en PostgreSQL:", err);
      initPromise = null;
    }
  })();

  return initPromise;
}
