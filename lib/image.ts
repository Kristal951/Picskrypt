const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const PASS_THROUGH_BYTES = 3 * 1024 * 1024;
const TARGET_BYTES = 4 * 1024 * 1024; 

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

export async function resizeToSquareJpeg(
  file: File,
  size = 512,
  quality = 0.9,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  const blob = await toBlob(canvas, quality);
  if (!blob) throw new Error("Could not encode image");
  return blob;
}

export interface PreparedImage {
  file: File;
  width: number; 
  height: number;
  originalSize: number;
}

export async function prepareImage(
  file: File,
  maxDimension = 2560,
): Promise<PreparedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file); 
  } catch {
    if (ACCEPTED_TYPES.includes(file.type) && file.size <= TARGET_BYTES) {
      return { file, width: 0, height: 0, originalSize: file.size };
    }
    throw new Error("We couldn't read that image. Try a JPG or PNG.");
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  if (scale === 1 && file.size <= PASS_THROUGH_BYTES) {
    bitmap.close();
    return { file, width, height, originalSize: file.size };
  }

  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Your browser can't process images.");
  }

  ctx.fillStyle = "#ffffff"; 
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let blob: Blob | null = null;
  for (const quality of [0.88, 0.8, 0.7, 0.6]) {
    blob = await toBlob(canvas, quality);
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  if (!blob) throw new Error("We couldn't process that image. Try a different one.");

  if (scale === 1 && blob.size >= file.size && file.size <= TARGET_BYTES) {
    return { file, width, height, originalSize: file.size };
  }

  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return {
    file: new File([blob], `${name}.jpg`, { type: "image/jpeg" }),
    width: w,
    height: h,
    originalSize: file.size,
  };
}