/**
 * Resize an image File to fit within `maxDimension` (pixels) on its longest side,
 * re-encode as JPEG at the given quality, and return a new File.
 *
 * Falls back to the original file on any error or in non-browser environments.
 */
export async function resizeImage(
  file: File,
  maxDimension = 512,
  quality = 0.85,
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    // If the image is already small enough and already JPEG/WebP, skip work
    if (scale === 1 && (file.type === "image/jpeg" || file.type === "image/webp")) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("resizeImage failed, uploading original:", error);
    return file;
  }
}
