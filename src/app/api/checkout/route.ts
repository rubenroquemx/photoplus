import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { photoIds, customerEmail, customerName, customerPhone } = await request.json();

    if (!customerEmail || !photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "Por favor proporciona un correo electrónico válido y al menos una foto." },
        { status: 400 }
      );
    }

    // Fetch verified photos from database
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        isAvailable: true,
      },
      include: {
        album: true,
      },
    });

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "Ninguna de las fotos seleccionadas está disponible." },
        { status: 400 }
      );
    }

    const total = photos.reduce((acc, p) => acc + p.price, 0);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `PP-${dateStr}-${randomSuffix}`;

    // Expires in 7 days after purchase
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check customer session or existing customer
    const { getCustomerSession } = await import("@/lib/customer-auth");
    const customerSession = await getCustomerSession();
    let customerId = customerSession?.id;

    if (!customerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: customerEmail.trim().toLowerCase() },
      });
      if (existingCustomer) customerId = existingCustomer.id;
    }

    // Create Order and Items in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customerId || null,
        customerEmail: customerEmail.trim().toLowerCase(),
        customerName: customerName ? customerName.trim() : null,
        customerPhone: customerPhone ? customerPhone.trim() : null,
        total,
        currency: "MXN",
        status: "PENDING",
        items: {
          create: photos.map((photo) => ({
            photoId: photo.id,
            price: photo.price,
            downloadToken: uuidv4(),
            downloadLimit: 10,
            expiresAt,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const isMock = !mpToken || mpToken.startsWith("TEST-TU-") || mpToken.includes("AQUI");

    if (isMock) {
      // In local development / demo mode, return link directly to order simulator or test confirmation
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        checkoutUrl: `/order/${order.id}?demo=true`,
        isDemo: true,
      });
    }

    // Create Mercado Pago Preference
    const preference = await createCheckoutPreference({
      orderId: order.id,
      orderNumber: order.orderNumber,
      payerEmail: order.customerEmail,
      payerName: order.customerName || undefined,
      items: photos.map((p) => ({
        id: p.id,
        title: `${p.name} - ${p.album.title}`,
        unit_price: p.price,
        quantity: 1,
        currency_id: "MXN",
      })),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.preferenceId },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      checkoutUrl: preference.initPoint || preference.sandboxInitPoint,
      preferenceId: preference.preferenceId,
      isDemo: false,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout:", error);
    const message = error instanceof Error ? error.message : "Error al procesar la orden de compra";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
