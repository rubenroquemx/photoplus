import { NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/google-drive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/mi-cuenta";

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const isMock = !googleClientId || googleClientId.includes("TU_GOOGLE") || googleClientId.includes("AQUI");

  // In demo mode without configured Google credentials, allow instant one-click customer demo sign-in
  if (isMock) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005").replace(/\/$/, "");
    return NextResponse.redirect(`${appUrl}/api/auth/customer?action=demo_login&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: scopes,
    state: JSON.stringify({ role: "customer", returnTo }),
  });

  return NextResponse.redirect(authUrl);
}
