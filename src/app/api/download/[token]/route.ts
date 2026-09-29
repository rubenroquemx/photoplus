import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getDriveFileReadableStream } from "@/lib/google-drive";
import { getCustomerSession } from "@/lib/customer-auth";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import sharp from "sharp";

async function generateCleanOriginalHiResBuffer(title: string): Promise<Buffer> {
  const width = 3840;
  const height = 2400;

  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hiResGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#3b0764" />
        <stop offset="100%" stop-color="#18181b" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#hiResGrad)" />
    <circle cx="${width / 2}" cy="${height / 2 - 120}" r="300" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="8" />
    <text x="50%" y="${height / 2 + 150}" font-family="sans-serif" font-size="72" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2px">
      ${title}
    </text>
    <text x="50%" y="${height / 2 + 250}" font-family="sans-serif" font-size="42" font-weight="600" fill="rgba(255,255,255,0.7)" text-anchor="middle">
      ARCHIVO ORIGINAL EN ALTA RESOLUCIÓN (3840 × 2400 px) - SIN MARCA DE AGUA
    </text>
    <text x="50%" y="${height / 2 + 330}" font-family="sans-serif" font-size="32" fill="rgba(255,255,255,0.5)" text-anchor="middle">
      Licencia de Uso Personal Adquirida con Éxito
    </text>
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 95 }).toBuffer();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return new Response("Token no proporcionado", { status: 400 });
  }

  try {
    const item = await prisma.orderItem.findUnique({
      where: { downloadToken: token },
      include: {
        photo: true,
        order: true,
      },
    });

    if (!item) {
      return new Response("Enlace de descarga no encontrado o inválido.", { status: 404 });
    }

    if (item.order.status !== "APPROVED") {
      return new Response(
        "Esta orden aún no ha sido acreditada. Por favor espera a que se complete el pago.",
        { status: 403 }
      );
    }

    // AUTHENTICATED DOWNLOAD SECURITY:
    // Only the customer who owns the order (or store admin) can download this photo!
    // Non-shareable link.
    const customerSession = await getCustomerSession();
    const isAdmin = await isAdminAuthenticated();

    const isOwner =
      customerSession &&
      (customerSession.id === item.order.customerId ||
        customerSession.email.toLowerCase() === item.order.customerEmail.toLowerCase());

    if (!isOwner && !isAdmin) {
      const buyerEmailMasked = item.order.customerEmail.replace(/(.{2})(.*)(?=@)/, (_gp1, gp2, gp3) => {
        return gp2 + "*".repeat(gp3.length);
      });

      return new Response(
        `Acceso Denegado: Este archivo es intransferible y no puede compartirse. Solo el titular de la compra (${buyerEmailMasked}) puede descargarlo desde su cuenta con sesión iniciada en Google.`,
        {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    if (new Date() > item.expiresAt) {
      return new Response(
        "Este enlace de descarga ha expirado (vigencia máxima de 7 días superada).",
        { status: 410 }
      );
    }

    if (item.downloadCount >= item.downloadLimit) {
      return new Response(
        `Has alcanzado el límite máximo de ${item.downloadLimit} descargas para esta fotografía.`,
        { status: 429 }
      );
    }

    // Increment download count
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { downloadCount: { increment: 1 } },
    });

    if (item.photo.driveFileId.startsWith("demo-")) {
      const demoBuffer = await generateCleanOriginalHiResBuffer(item.photo.name);
      return new Response(new Uint8Array(demoBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(item.photo.name)}"`,
          "Content-Length": String(demoBuffer.length),
          "Cache-Control": "private, no-transform, no-store",
        },
      });
    }

    // Stream original hi-res file directly from Google Drive
    const driveFile = await getDriveFileReadableStream(item.photo.driveFileId);

    const webStream = new ReadableStream({
      start(controller) {
        driveFile.stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        driveFile.stream.on("end", () => controller.close());
        driveFile.stream.on("error", (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", driveFile.mimeType || "image/jpeg");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(driveFile.name || item.photo.name)}"`
    );
    headers.set("Cache-Control", "private, no-transform, no-store");
    if (driveFile.size) {
      headers.set("Content-Length", String(driveFile.size));
    }

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Error streaming full resolution photo:", error);
    return new Response("Error al descargar el archivo de alta resolución desde Google Drive", {
      status: 500,
    });
  }
}
