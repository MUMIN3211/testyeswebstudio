const FALLBACK_IMAGE = "/window.svg";

export function resolveProductImageUrl(imageUrl: string | null | undefined): string {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  return /^(https?:\/\/|data:image\/|\/)/.test(trimmed) ? trimmed : FALLBACK_IMAGE;
}
