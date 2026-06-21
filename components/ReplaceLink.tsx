"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type ReplaceLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

export function ReplaceLink({ href, className, children }: ReplaceLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        router.replace(href, { scroll: false });
      }}
    >
      {children}
    </Link>
  );
}
