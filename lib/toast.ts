export type ToastType = "success" | "error" | "info";

export function withToast(path: string, type: ToastType, message: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}toast=${type}&message=${encodeURIComponent(
    message,
  )}`;
}
