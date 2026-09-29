import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, setCustomerSession, clearCustomerSession } from "@/lib/customer-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const returnTo = searchParams.get("returnTo") || "/mi-cuenta";

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005").replace(/\/$/, "");

  // One-click demo login if Google OAuth keys aren't configured yet
  if (action === "demo_login") {
    const demoEmail = "cliente.demo@gmail.com";
    const customer = await prisma.customer.upsert({
      where: { email: demoEmail },
      update: {},
      create: {
        email: demoEmail,
        name: "Carlos Mendoza (Cliente Google Demo)",
        picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      },
    });

    // Link previous orders made with demoEmail
    await prisma.order.updateMany({
      where: {
        customerEmail: demoEmail,
        customerId: null,
      },
      data: {
        customerId: customer.id,
      },
    });

    await setCustomerSession(customer.id);
    return NextResponse.redirect(`${appUrl}${returnTo}`);
  }

  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, customer: null });
  }

  const [favoritesCount, ordersCount] = await Promise.all([
    prisma.favorite.count({ where: { customerId: session.id } }),
    prisma.order.count({ where: { customerId: session.id, status: "APPROVED" } }),
  ]);

  return NextResponse.json({
    authenticated: true,
    customer: session,
    favoritesCount,
    ordersCount,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, email, name } = await request.json();

    if (action === "logout") {
      await clearCustomerSession();
      return NextResponse.json({ success: true });
    }

    if (action === "demo_login") {
      const customerEmail = (email || "cliente.demo@gmail.com").trim().toLowerCase();
      const customer = await prisma.customer.upsert({
        where: { email: customerEmail },
        update: {},
        create: {
          email: customerEmail,
          name: name || "Carlos Mendoza (Cliente)",
        },
      });

      await setCustomerSession(customer.id);
      return NextResponse.json({ success: true, customer });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
