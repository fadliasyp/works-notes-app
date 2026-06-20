"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function GlobalPendingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startLoading() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsPending(true);

    timeoutRef.current = setTimeout(() => {
      setIsPending(false);
    }, 8000);
  }

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href) return;
      if (href.startsWith("#")) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const url = new URL(href, window.location.href);

      if (url.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);

      if (
        url.pathname === currentUrl.pathname &&
        url.search === currentUrl.search &&
        url.hash
      ) {
        return;
      }

      startLoading();
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;

      if (!form) return;

      startLoading();
    }

    window.addEventListener("click", handleClick, true);
    window.addEventListener("submit", handleSubmit, true);

    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("submit", handleSubmit, true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPending) return;

    const timer = setTimeout(() => {
      setIsPending(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [routeKey]);

  if (!isPending) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[2px]" />

      <div className="absolute bottom-5 left-1/2 w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-2xl shadow-slate-500/50 ring-1 ring-white/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Loader2 className="animate-spin" size={22} />
          </div>

          <div>
            <p className="text-white">Memproses...</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-300">
              Mohon tunggu sebentar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
