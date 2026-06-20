"use client";

import { Toaster } from "sonner";

export function SonnerProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand
      visibleToasts={3}
      duration={3000}
    />
  );
}
