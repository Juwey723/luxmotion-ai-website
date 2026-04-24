import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-ink-deepest">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-6 py-14 lg:flex-row lg:items-end lg:px-10">
        <div>
          <p className="font-serif-italic text-gold-gradient text-3xl tracking-tight">
            LuxMotion AI
          </p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
            Cinematic AI Ad Studio · 2026
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-8 gap-y-3"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-gold"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
