import { google, drive_v3 } from "googleapis";
import prisma from "./prisma";
import type { Readable } from "stream";

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005").replace(/\/$/, "");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

export async function handleGoogleOAuthCallback(code: string) {
  const { ensureDatabaseSchema } = await import("./db-init");
  await ensureDatabaseSchema();

  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  const email = userInfo.data.email || "admin@photoplus.local";
  const name = userInfo.data.name || "Fotógrafo Admin";
  const picture = userInfo.data.picture || null;

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  const adminSession = await prisma.adminSession.upsert({
    where: { email },
    update: {
      name,
      picture,
      accessToken: tokens.access_token || undefined,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt,
    },
    create: {
      email,
      name,
      picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    },
  });

  return adminSession;
}

export async function getAuthenticatedDriveClient(): Promise<drive_v3.Drive> {
  const { ensureDatabaseSchema } = await import("./db-init");
  await ensureDatabaseSchema();

  const session = await prisma.adminSession.findFirst({
    where: {
      refreshToken: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!session || !session.refreshToken) {
    throw new Error("No hay una cuenta de Google Drive conectada. Por favor conecta tu cuenta de Google en el panel de administración.");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: session.accessToken || undefined,
    refresh_token: session.refreshToken,
    expiry_date: session.expiresAt ? session.expiresAt.getTime() : undefined,
  });

  // Listen for automatic token refresh to persist new access_token
  oauth2Client.on("tokens", async (newTokens) => {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: {
        accessToken: newTokens.access_token || undefined,
        refreshToken: newTokens.refresh_token || undefined,
        expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : undefined,
      },
    });
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

export function extractDriveFolderId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed;
}

export async function listDriveFolders() {
  const drive = await getAuthenticatedDriveClient();
  const folderList = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: "files(id, name, createdTime, modifiedTime, shared)",
    pageSize: 100,
    orderBy: "createdTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return folderList.data.files || [];
}

export async function listDriveImagesInFolder(folderId: string) {
  const drive = await getAuthenticatedDriveClient();

  // Valid Google Drive API query: query files in folder and filter images in JavaScript
  const query = `'${folderId}' in parents and trashed = false`;

  const files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    width?: number;
    height?: number;
    thumbnailLink?: string;
  }> = [];

  let currentToken: string | undefined = undefined;

  do {
    const listRes: { data: drive_v3.Schema$FileList } = await drive.files.list({
      q: query,
      fields: "nextPageToken, files(id, name, mimeType, size, imageMediaMetadata(width, height), thumbnailLink)",
      pageSize: 100,
      pageToken: currentToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: "name",
    });

    if (listRes.data.files) {
      for (const f of listRes.data.files) {
        if (f.id && f.name) {
          const isImage =
            (f.mimeType && f.mimeType.startsWith("image/")) ||
            /\.(jpe?g|png|webp|avif|heic|tiff?)$/i.test(f.name);

          if (isImage) {
            files.push({
              id: f.id,
              name: f.name,
              mimeType: f.mimeType || "image/jpeg",
              size: f.size ? parseInt(f.size, 10) : undefined,
              width: f.imageMediaMetadata?.width || undefined,
              height: f.imageMediaMetadata?.height || undefined,
              thumbnailLink: f.thumbnailLink || undefined,
            });
          }
        }
      }
    }

    currentToken = listRes.data.nextPageToken || undefined;
  } while (currentToken);

  return files;
}

export async function getDriveFileReadableStream(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
  name: string;
  size?: number;
}> {
  const drive = await getAuthenticatedDriveClient();

  // Get metadata
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size",
    supportsAllDrives: true,
  });

  // Get stream
  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );

  return {
    stream: response.data as unknown as Readable,
    mimeType: meta.data.mimeType || "image/jpeg",
    name: meta.data.name || "photo.jpg",
    size: meta.data.size ? parseInt(meta.data.size, 10) : undefined,
  };
}
