"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

type UnsavedChangesGuardProps = {
  title?: string;
  message?: string;
};

export function UnsavedChangesGuard({
  title = "Keluar dari halaman?",
  message = "Ada perubahan yang belum disimpan. Kalau keluar sekarang, perubahan bisa hilang.",
}: UnsavedChangesGuardProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const dirtyRef = useRef(false);
  const guardHistoryRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);
  const pendingBackRef = useRef(false);

  function activateGuard() {
    if (guardHistoryRef.current) return;

    window.history.pushState(
      {
        unsavedChangesGuard: true,
      },
      "",
      window.location.href,
    );

    guardHistoryRef.current = true;
  }

  function markDirty() {
    if (dirtyRef.current) return;

    dirtyRef.current = true;
    setIsDirty(true);
    activateGuard();
  }

  function stayOnPage() {
    setIsOpen(false);
    pendingHrefRef.current = null;
    pendingBackRef.current = false;

    if (dirtyRef.current && !guardHistoryRef.current) {
      activateGuard();
    }
  }

  function leavePage() {
    allowLeaveRef.current = true;
    dirtyRef.current = false;
    guardHistoryRef.current = false;
    setIsDirty(false);
    setIsOpen(false);

    const pendingHref = pendingHrefRef.current;
    const shouldGoBack = pendingBackRef.current;

    pendingHrefRef.current = null;
    pendingBackRef.current = false;

    if (pendingHref) {
      router.replace(pendingHref);
      return;
    }

    if (shouldGoBack) {
      window.history.back();
    }
  }

  useEffect(() => {
    function handleInput(event: Event) {
      const target = event.target as HTMLElement | null;

      if (!target) return;
      if (target.closest("[data-ignore-unsaved]")) return;

      const tagName = target.tagName.toLowerCase();

      if (!["input", "textarea", "select"].includes(tagName)) return;

      const input = target as HTMLInputElement;

      if (
        input.type === "hidden" ||
        input.type === "submit" ||
        input.type === "button"
      ) {
        return;
      }

      markDirty();
    }

    function handleSubmit() {
      allowLeaveRef.current = true;
      dirtyRef.current = false;
      setIsDirty(false);
    }

    function handleClick(event: MouseEvent) {
      if (!dirtyRef.current || allowLeaveRef.current) return;

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

      event.preventDefault();

      pendingHrefRef.current = `${url.pathname}${url.search}${url.hash}`;
      pendingBackRef.current = false;
      setIsOpen(true);
    }

    function handlePopState() {
      if (!dirtyRef.current || allowLeaveRef.current) return;

      guardHistoryRef.current = false;
      pendingHrefRef.current = null;
      pendingBackRef.current = true;
      setIsOpen(true);
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current || allowLeaveRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("input", handleInput, true);
    window.addEventListener("change", handleInput, true);
    window.addEventListener("submit", handleSubmit, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("input", handleInput, true);
      window.removeEventListener("change", handleInput, true);
      window.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

  if (!isDirty || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-slate-950/40 px-4 pb-5 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-900/30 ring-1 ring-slate-200">
        <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <AlertTriangle size={28} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">{title}</h2>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={stayOnPage}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Tutup popup"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={stayOnPage}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              Tetap di sini
            </button>

            <button
              type="button"
              onClick={leavePage}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
