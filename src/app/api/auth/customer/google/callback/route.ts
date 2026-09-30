import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/google-drive";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { setCustomerSession } from "@/lib/customer-auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateStr = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005").replace(/\/$/, "");

  let returnTo = "/mi-cuenta";
  if (stateStr) {
    try {
      const stateObj = JSON.parse(stateStr);
      if (stateObj.returnTo) returnTo = stateObj.returnTo;
    } catch {
      // Ignore json parse error
    }
  }

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/?auth_error=${encodeURIComponent(error || "Cancelado por el usuario")}`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      throw new Error("No se pudo obtener el correo de Google");
    }

    const email = userInfo.data.email.trim().toLowerCase();
    const name = userInfo.data.name || "Cliente";
    const picture = userInfo.data.picture || null;

    const { ensureDatabaseSchema } = await import("@/lib/db-init");
    await ensureDatabaseSchema();

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: { email },
      update: { name, picture },
      create: { email, name, picture },
    });

    // Link any existing orders made with this email
    await prisma.order.updateMany({
      where: {
        customerEmail: email,
        customerId: null,
      },
      data: {
        customerId: customer.id,
      },
    });

    await setCustomerSession(customer.id);

    // If this customer email is also an authorized ADMIN_EMAIL, set admin session too!
    const { isAuthorizedAdminEmail, setAdminSession } = await import("@/lib/admin-auth");
    if (isAuthorizedAdminEmail(email)) {
      await setAdminSession();
    }

    return NextResponse.redirect(`${appUrl}${returnTo}`);
  } catch (err: unknown) {
    console.error("Error authenticating customer with Google:", err);
    const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
    return NextResponse.redirect(`${appUrl}/?auth_error=${encodeURIComponent(msg)}`);
  }
}
