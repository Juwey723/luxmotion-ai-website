"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PORTFOLIO } from "@/lib/constants";
import { SectionHeader } from "@/components/site/services";
import { FadeIn } from "@/components/site/fade-in";

export function Portfolio() {
  const [active, setActive] = useState<(typeof PORTFOLIO)[number] | null>(null);

  return (
    <FadeIn id="portfolio" className="scroll-mt-nav border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <SectionHeader kicker="Portfolio" title="Selected work." />
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Hover to preview, tap to expand. Every clip below was generated from a
          single product link.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {PORTFOLIO.map((tile) => (
            <PortfolioTile
              key={tile.src}
              tile={tile}
              onOpen={() => setActive(tile)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md border border-gold/30 bg-ink-base p-2 sm:max-w-md">
          <DialogTitle className="sr-only">
            {active?.label ?? "Portfolio video"}
          </DialogTitle>
          {active && (
            <video
              src={active.src}
              controls
              autoPlay
              playsInline
              className="aspect-[9/16] w-full rounded-md bg-black object-cover"
            />
          )}
        </DialogContent>
      </Dialog>
    </FadeIn>
  );
}

function PortfolioTile({
  tile,
  onOpen,
}: {
  tile: (typeof PORTFOLIO)[number];
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    void v.play().catch(() => {});
  };
  const pause = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={play}
      onMouseLeave={pause}
      onFocus={play}
      onBlur={pause}
      aria-label={`Play ${tile.label} preview`}
      className="group relative aspect-[9/16] overflow-hidden rounded-md bg-ink-elevated ring-1 ring-border transition-all hover:ring-gold/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <video
        ref={videoRef}
        src={tile.src}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 text-left text-[11px] font-medium uppercase tracking-[0.22em] text-bone/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        {tile.label}
      </span>
    </button>
  );
}
