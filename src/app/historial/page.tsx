import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Gasto } from "@/lib/gastos";
import type { Categoria } from "@/lib/receipt";
import BackGlyph from "@/components/BackGlyph";
import ChartGlyph from "@/components/ChartGlyph";
import HistorialExplorer from "@/components/HistorialExplorer";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const registros = await prisma.gasto.findMany({
    orderBy: [{ fecha: "desc" }, { registradoEn: "desc" }],
    include: { desglose: true },
  });

  const gastos: Gasto[] = registros.map((g) => ({
    id: g.id,
    comercio: g.comercio,
    monto: g.monto,
    fecha: g.fecha,
    categoria: g.categoria as Categoria,
    esRecurrente: g.esRecurrente,
    registradoEn: g.registradoEn.toISOString(),
    desglose: g.desglose.map((f) => ({ categoria: f.categoria as Categoria, monto: f.monto })),
  }));

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-ink px-6 pb-16">
      <div className="bg-grain" />
      <div className="bg-vignette" />

      <header className="relative z-10 flex items-center justify-between pt-[max(1.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
        >
          <BackGlyph className="h-5 w-5" />
        </Link>
        <p className="font-display text-lg italic tracking-tight text-paper">
          Historial<span className="text-accent">.</span>
        </p>
        <Link
          href="/resumen"
          aria-label="Ver resumen"
          className="flex h-9 w-9 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
        >
          <ChartGlyph className="h-5 w-5" />
        </Link>
      </header>

      {gastos.length === 0 ? (
        <div className="relative z-10 flex flex-col items-center gap-4 pt-28 text-center">
          <p className="font-display text-xl italic text-paper">Todavía no hay gastos</p>
          <p className="max-w-[26ch] font-body text-sm leading-relaxed text-paper-dim">
            Registrá tu primer gasto sacando una foto del recibo.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.97]"
          >
            Registrar gasto
          </Link>
        </div>
      ) : (
        <HistorialExplorer gastos={gastos} />
      )}
    </main>
  );
}
