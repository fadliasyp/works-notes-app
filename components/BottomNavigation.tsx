"use client";

import Link from "next/link";
import { Clock3, Store } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Daftar Tempat", icon: Store },
  { href: "/expiring-products", label: "Segera Expired", icon: Clock3 },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
      <nav
        aria-label="Navigasi utama"
        className="pointer-events-auto mx-auto grid max-w-md grid-cols-2 gap-2 rounded-[1.75rem] bg-slate-950 p-2 shadow-2xl shadow-slate-900/30 ring-1 ring-white/10"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-3 text-xs font-black transition sm:text-sm ${
                isActive
                  ? "bg-white text-slate-950 shadow-lg"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

