"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastToastRef = useRef("");

  useEffect(() => {
    const toastType = searchParams.get("toast");
    const message = searchParams.get("message");

    if (!toastType || !message) return;

    const toastKey = `${toastType}-${message}`;

    if (lastToastRef.current === toastKey) return;

    lastToastRef.current = toastKey;

    if (toastType === "success") {
      toast.success("Berhasil", {
        description: message,
      });
    } else if (toastType === "error") {
      toast.error("Gagal", {
        description: message,
      });
    } else {
      toast.info("Informasi", {
        description: message,
      });
    }

    const params = new URLSearchParams(searchParams.toString());

    params.delete("toast");
    params.delete("message");

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
