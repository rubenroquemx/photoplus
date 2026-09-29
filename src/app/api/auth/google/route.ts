import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-drive";

export async function GET() {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error initiating Google OAuth";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
