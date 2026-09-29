import { NextRequest, NextResponse } from "next/server";
import { handleGoogleOAuthCallback } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/admin?error=${encodeURIComponent(error || "No se recibió código de autorización")}`);
  }

  try {
    await handleGoogleOAuthCallback(code);
    return NextResponse.redirect(`${appUrl}/admin?connected=true&msg=Google+Drive+conectado+exitosamente`);
  } catch (err: unknown) {
    console.error("Error exchanging Google code:", err);
    const message = err instanceof Error ? err.message : "Error autenticando con Google";
    return NextResponse.redirect(`${appUrl}/admin?error=${encodeURIComponent(message)}`);
  }
}
