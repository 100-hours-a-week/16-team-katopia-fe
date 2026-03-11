export type EncodedImage = {
  blob: Blob;
  contentType: string;
  extension: string;
};

type ProcessImageOptions = {
  maxLongSide?: number;
  maxWidth?: number;
  quality?: number;
  outputType?: string;
  heicToJpegQuality?: number;
  heicErrorMessage?: string;
};

function getExtensionFromMime(contentType: string) {
  const normalized = contentType.toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) : "bin";
}

function isHeicLike(file: File) {
  const lower = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif")
  );
}

async function convertHeicToJpeg(file: File, quality: number): Promise<File> {
  const buffer = await file.arrayBuffer();
  const heicBlob = new Blob([buffer], {
    type: file.type || "image/heic",
  });
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: heicBlob,
    toType: "image/jpeg",
    quality,
  });

  const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
  const safeName = file.name.replace(/\.heic$|\.heif$/i, ".jpg");
  return new File([jpegBlob], safeName, { type: "image/jpeg" });
}

export async function processImageFile(
  file: File,
  options: ProcessImageOptions = {},
): Promise<EncodedImage> {
  const {
    maxLongSide,
    maxWidth,
    quality = 0.92,
    outputType = "image/webp",
    heicToJpegQuality = 0.92,
    heicErrorMessage = "HEIC 파일은 업로드할 수 없습니다. JPG/PNG로 변환해주세요.",
  } = options;

  let sourceFile = file;
  if (isHeicLike(file)) {
    try {
      sourceFile = await convertHeicToJpeg(file, heicToJpegQuality);
    } catch {
      throw new Error(heicErrorMessage);
    }
  }

  const bitmap = await createImageBitmap(sourceFile, {
    imageOrientation: "from-image",
  });

  const scaleByLongSide =
    typeof maxLongSide === "number"
      ? Math.min(1, maxLongSide / Math.max(bitmap.width, bitmap.height))
      : 1;
  const scaleByWidth =
    typeof maxWidth === "number" ? Math.min(1, maxWidth / bitmap.width) : 1;
  const scale = Math.min(scaleByLongSide, scaleByWidth);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("이미지 처리 실패");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("이미지 압축 실패"));
          return;
        }
        resolve(result);
      },
      outputType,
      quality,
    ),
  );

  const contentType = blob.type || outputType;
  return {
    blob,
    contentType,
    extension: getExtensionFromMime(contentType),
  };
}
