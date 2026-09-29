import sharp from "sharp";
import { Readable } from "stream";

export interface WatermarkOptions {
  text?: string;
  subText?: string;
  opacity?: number;
  maxWidth?: number;
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Generates an SVG watermark overlay with repeated diagonal text
 * covering the entire photograph to prevent unauthorized screenshots or downloads.
 */
function createWatermarkSvg(
  width: number,
  height: number,
  text: string = "PHOTOPLUS • MUESTRA",
  opacity: number = 0.35
): Buffer {
  const fontSize = Math.max(24, Math.round(width / 24));
  const subFontSize = Math.max(14, Math.round(fontSize * 0.5));

  // Create an SVG with a grid pattern rotated at 35 degrees
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wm-pattern" width="${Math.round(width * 0.45)}" height="${Math.round(height * 0.35)}" patternTransform="rotate(-30 0 0)" patternUnits="userSpaceOnUse">
        <text 
          x="50%" 
          y="40%" 
          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" 
          font-size="${fontSize}" 
          font-weight="900" 
          fill="rgba(255, 255, 255, ${opacity})" 
          stroke="rgba(0, 0, 0, ${opacity * 0.7})" 
          stroke-width="1.5"
          text-anchor="middle"
          letter-spacing="2px"
        >
          ${escapeXml(text)}
        </text>
        <text 
          x="50%" 
          y="65%" 
          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" 
          font-size="${subFontSize}" 
          font-weight="600" 
          fill="rgba(255, 255, 255, ${opacity * 0.85})" 
          stroke="rgba(0, 0, 0, ${opacity * 0.5})" 
          stroke-width="1"
          text-anchor="middle"
          letter-spacing="1px"
        >
          PROHIBIDA SU REPRODUCCIÓN
        </text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm-pattern)" />
    <!-- Center prominent watermark banner -->
    <g transform="translate(${width / 2}, ${height / 2}) rotate(-25)">
      <rect 
        x="${-width * 0.35}" 
        y="${-fontSize * 1.5}" 
        width="${width * 0.7}" 
        height="${fontSize * 3}" 
        fill="rgba(0, 0, 0, 0.3)" 
        rx="8"
      />
      <text 
        x="0" 
        y="${fontSize * 0.35}" 
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" 
        font-size="${Math.round(fontSize * 1.2)}" 
        font-weight="900" 
        fill="rgba(255, 255, 255, 0.85)" 
        stroke="rgba(0,0,0, 0.8)" 
        stroke-width="2"
        text-anchor="middle"
        letter-spacing="3px"
      >
        ${escapeXml(text)}
      </text>
    </g>
  </svg>
  `;

  return Buffer.from(svg);
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

/**
 * Applies a watermark and resizes an image buffer for public web preview.
 */
export async function applyWatermarkToImage(
  inputBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  const {
    text = "PHOTOPLUS • MUESTRA",
    opacity = 0.35,
    maxWidth = 1400,
  } = options;

  let pipeline = sharp(inputBuffer).rotate(); // auto-rotate based on EXIF
  const metadata = await pipeline.metadata();

  const originalWidth = metadata.width || 1200;
  const originalHeight = metadata.height || 800;

  // Calculate resized dimensions
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxWidth) {
    targetWidth = maxWidth;
    targetHeight = Math.round((originalHeight * maxWidth) / originalWidth);
  }

  pipeline = pipeline.resize(targetWidth, targetHeight, {
    fit: "inside",
    withoutEnlargement: true,
  });

  const watermarkSvgBuffer = createWatermarkSvg(
    targetWidth,
    targetHeight,
    text,
    opacity
  );

  const watermarkedBuffer = await pipeline
    .composite([
      {
        input: watermarkSvgBuffer,
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 82, progressive: true })
    .toBuffer();

  return {
    buffer: watermarkedBuffer,
    contentType: "image/jpeg",
  };
}
