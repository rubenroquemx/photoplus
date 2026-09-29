import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            photo: {
              include: {
                album: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener la orden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow simulating payment approval in development / demo mode
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { action } = await request.json();

    if (action === "simulate_approval") {
      const order = await prisma.order.update({
        where: { id },
        data: {
          status: "APPROVED",
          mpPaymentId: `SIM-${Date.now()}`,
        },
      });

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar la orden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
