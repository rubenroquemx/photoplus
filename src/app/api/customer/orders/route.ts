import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: session.id },
          { customerEmail: session.email },
        ],
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            photo: {
              include: {
                album: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener compras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
