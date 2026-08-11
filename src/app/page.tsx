import Link from "next/link";
import CaptureButton from "@/components/CaptureButton";
import HistoryGlyph from "@/components/HistoryGlyph";
import ChartGlyph from "@/components/ChartGlyph";

export default function Home() {
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-ink px-6">
      <div className="bg-grain" />
      <div className="bg-vignette" />

      <header className="relative z-10 flex items-center justify-between pt-[max(1.75rem,env(safe-area-inset-top))]">
        <p className="font-display text-3xl italic tracking-tight text-paper">
          gasto<span className="text-accent">.</span>
        </p>
        <div className="flex items-center gap-1.5">
          <Link
            href="/resumen"
            aria-label="Ver resumen"
            className="flex h-12 w-12 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
          >
            <ChartGlyph className="h-7 w-7" />
          </Link>
          <Link
            href="/historial"
            aria-label="Ver historial"
            className="flex h-12 w-12 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
          >
            <HistoryGlyph className="h-7 w-7" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <CaptureButton />
      </section>

      <footer className="relative z-10 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-dim/70">
          Un toque. Listo.
        </p>
      </footer>
    </main>
  );
}
