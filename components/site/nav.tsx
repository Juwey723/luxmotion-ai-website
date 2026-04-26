"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-md supports-backdrop-filter:bg-background/55"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:h-[72px] lg:px-10">
        <Link
          href="/"
          className="font-serif-italic text-gold-gradient text-2xl tracking-tight md:text-[28px]"
          aria-label="LuxMotion AI — home"
        >
          LuxMotion AI
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.slice(0, 2).map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
          <NavLink href="/sample" label="Free Sample" badge="FREE" />
          {NAV_LINKS.slice(2).map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        <Link
          href="/order/basic"
          className="inline-flex h-9 items-center rounded-full bg-gold px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-deepest transition-colors hover:bg-gold-light md:h-10 md:px-5 md:text-[12px]"
        >
          Order Now
        </Link>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-gold"
    >
      {label}
      {badge && (
        <span className="rounded-sm border border-gold/55 bg-gold/10 px-1.5 py-px text-[8.5px] font-semibold uppercase tracking-[0.22em] text-gold-light transition-colors group-hover:border-gold group-hover:bg-gold/20">
          {badge}
        </span>
      )}
    </Link>
  );
}
