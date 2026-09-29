import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/mercadopago";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");
    const type = url.searchParams.get("type") || url.searchParams.get("topic");

    let paymentId = dataId;

    if (!paymentId) {
      try {
        const body = await request.json();
        if (body?.data?.id) {
          paymentId = body.data.id;
        } else if (body?.id) {
          paymentId = body.id;
        }
      } catch {
        // Body was not JSON, ignore
      }
    }

    if (!paymentId || (type && type !== "payment")) {
      return NextResponse.json({ received: true });
    }

    // Verify payment with Mercado Pago
    const payment = await getPaymentStatus(paymentId);

    if (payment.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
      });

      if (order) {
        let newStatus = order.status;
        if (payment.status === "approved") {
          newStatus = "APPROVED";
        } else if (payment.status === "rejected" || payment.status === "cancelled") {
          newStatus = "REJECTED";
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            mpPaymentId: String(payment.id),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error processing Mercado Pago webhook:", error);
    // Always return 200 to MP so it doesn't repeatedly retry failing webhooks
    return NextResponse.json({ received: true, error: "Processed with warning" });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Mercado Pago Webhook Endpoint Active" });
}
