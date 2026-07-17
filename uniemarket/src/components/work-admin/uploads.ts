// Upload ảnh cho khu quản trị: validate + thu nhỏ về tối đa 1200px qua canvas
// trước khi tải lên để tiết kiệm dung lượng storage (gói miễn phí 1GB).
import { requireSupabase } from "@/lib/supabase";
import type { Lang } from "@/i18n";

const MAX_DIMENSION = 1200;
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

// Thông báo lỗi hiển thị qua toast — chọn theo ngôn ngữ do component truyền vào.
const MSG = {
  vi: {
    readFail: (name: string) => `Không đọc được file ảnh "${name}".`,
    notImage: (name: string) => `"${name}" không phải file ảnh (chỉ nhận PNG, JPG, WebP…).`,
    canvasUnsupported: "Trình duyệt không hỗ trợ xử lý ảnh (canvas).",
    compressFail: "Không nén được ảnh — hãy thử ảnh khác.",
    stillTooBig: (name: string) => `"${name}" vẫn lớn hơn 2MB sau khi nén — hãy chọn ảnh nhỏ hơn.`,
  },
  en: {
    readFail: (name: string) => `Couldn't read the image file "${name}".`,
    notImage: (name: string) => `"${name}" is not an image file (only PNG, JPG, WebP…).`,
    canvasUnsupported: "Your browser doesn't support image processing (canvas).",
    compressFail: "Couldn't compress the image — please try a different one.",
    stillTooBig: (name: string) =>
      `"${name}" is still larger than 2MB after compression — please pick a smaller image.`,
  },
};

function loadImage(file: File, lang: Lang): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(MSG[lang].readFail(file.name)));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Kiểm tra file là ảnh, thu nhỏ về tối đa 1200px (cạnh dài) và nén lại nếu cần.
 * Ném Error tiếng Việt nếu file không hợp lệ hoặc vẫn quá 2MB sau khi nén.
 */
export async function prepareImage(file: File, lang: Lang): Promise<File> {
  const msg = MSG[lang];
  if (!file.type.startsWith("image/")) {
    throw new Error(msg.notImage(file.name));
  }

  const img = await loadImage(file, lang);
  const maxSide = Math.max(img.naturalWidth, img.naturalHeight);

  // Ảnh đã nhỏ gọn — giữ nguyên file gốc.
  if (maxSide <= MAX_DIMENSION && file.size <= MAX_SIZE_BYTES) return file;

  const scale = Math.min(1, MAX_DIMENSION / maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(msg.canvasUnsupported);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob =
    (await toBlob(canvas, "image/webp", 0.85)) ?? (await toBlob(canvas, "image/jpeg", 0.85));
  if (!blob) throw new Error(msg.compressFail);
  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error(msg.stillTooBig(file.name));
  }

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "anh";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}

/**
 * Tải file lên bucket công khai `site-assets` (ảnh QR Momo, tài sản shop).
 * Chỉ admin ghi được (RLS). Trả về { path, publicUrl }.
 */
export async function uploadSiteAsset(file: File): Promise<{ path: string; publicUrl: string }> {
  const sb = requireSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `settings/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("site-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from("site-assets").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
