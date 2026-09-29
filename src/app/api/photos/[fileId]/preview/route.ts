import { NextRequest } from "next/server";
import { getDriveFileReadableStream } from "@/lib/google-drive";
import { applyWatermarkToImage, streamToBuffer } from "@/lib/watermark";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import sharp from "sharp";

async function generateSampleImageBuffer(title: string, width = 1200, height = 800): Promise<Buffer> {
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#4c0519" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGrad)" />
    <circle cx="${width / 2}" cy="${height / 2 - 40}" r="${Math.min(width, height) * 0.18}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4" />
    <path d="M ${width / 2 - 40} ${height / 2 - 40} L ${width / 2 + 40} ${height / 2 - 40} M ${width / 2} ${height / 2 - 80} L ${width / 2} ${height / 2}" stroke="rgba(255,255,255,0.3)" stroke-width="4" />
    <text x="50%" y="${height / 2 + 60}" font-family="sans-serif" font-size="28" font-weight="900" fill="rgba(255,255,255,0.85)" text-anchor="middle" letter-spacing="1px">
      ${title}
    </text>
    <text x="50%" y="${height / 2 + 100}" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="middle">
      Resolución Original: 6000 × 4000 px
    </text>
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg().toBuffer();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId) {
    return new Response("ID de foto no proporcionado", { status: 400 });
  }

  try {
    const photo = await prisma.photo.findUnique({
      where: { driveFileId: fileId },
      include: { album: true },
    });

    const settings = await getStoreSettings();
    const watermarkText = photo?.album?.watermarkText || settings.watermarkText || "PHOTOPLUS • MUESTRA";
    const opacity = settings.watermarkOpacity || 0.35;

    let rawBuffer: Buffer;

    if (fileId.startsWith("demo-")) {
      // Demo placeholder
      rawBuffer = await generateSampleImageBuffer(photo?.name || "Foto de Demostración");
    } else {
      try {
        const driveFile = await getDriveFileReadableStream(fileId);
        rawBuffer = await streamToBuffer(driveFile.stream);
      } catch (driveErr) {
        console.warn(`Fallback to mock for ${fileId} because Google Drive threw:`, driveErr);
        rawBuffer = await generateSampleImageBuffer(photo?.name || "Foto de Prueba");
      }
    }

    // Apply watermark and resize to preview dimension
    const { buffer, contentType } = await applyWatermarkToImage(rawBuffer, {
      text: watermarkText,
      opacity,
      maxWidth: 1400,
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: unknown) {
    console.error(`Error generating preview for file ${fileId}:`, error);
    return new Response("No se pudo generar la vista previa de la foto", { status: 500 });
  }
}
