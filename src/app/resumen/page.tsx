import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calcularPeriodo, type RangoTipo } from "@/lib/periodos";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/receipt";
import BackGlyph from "@/components/BackGlyph";
import HistoryGlyph from "@/components/HistoryGlyph";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ rango?: string; offset?: string }>;

function money(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

export default async function ResumenPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rango: RangoTipo = sp.rango === "mes" ? "mes" : "semana";
  const offset = Number.parseInt(sp.offset ?? "0", 10) || 0;

  const periodo = calcularPeriodo(rango, offset);

  const [actuales, anteriorAgg, porRecurrencia] = await Promise.all([
    prisma.gasto.groupBy({
      by: ["categoria"],
      where: { fecha: { gte: periodo.inicioKey, lte: periodo.finKey } },
      _sum: { monto: true },
    }),
    prisma.gasto.aggregate({
      _sum: { monto: true },
      where: { fecha: { gte: periodo.inicioAnteriorKey, lte: periodo.finAnteriorKey } },
    }),
    prisma.gasto.groupBy({
      by: ["esRecurrente"],
      where: { fecha: { gte: periodo.inicioKey, lte: periodo.finKey } },
      _sum: { monto: true },
    }),
  ]);

  const desglose = actuales
    .map((row) => ({
      categoria: row.categoria as Categoria,
      monto: row._sum.monto ?? 0,
    }))
    .sort((a, b) => b.monto - a.monto);

  const total = desglose.reduce((sum, item) => sum + item.monto, 0);
  const totalAnterior = anteriorAgg._sum.monto ?? 0;
  const maxMonto = desglose[0]?.monto ?? 0;
  const topCategoria = desglose[0];

  const totalFijo = porRecurrencia.find((r) => r.esRecurrente)?._sum.monto ?? 0;
  const totalVariable = porRecurrencia.find((r) => !r.esRecurrente)?._sum.monto ?? 0;
  const shareFijo = total > 0 ? (totalFijo / total) * 100 : 0;
  const shareVariable = total > 0 ? (totalVariable / total) * 100 : 0;

  let variacion: { texto: string; subiendo: boolean } | null = null;
  if (totalAnterior > 0) {
    const pct = ((total - totalAnterior) / totalAnterior) * 100;
    const signo = pct >= 0 ? "+" : "";
    variacion = {
      texto: `${signo}${Math.round(pct)}% vs. ${periodo.etiquetaAnterior}`,
      subiendo: pct >= 0,
    };
  } else if (total > 0) {
    variacion = { texto: `Nuevo vs. ${periodo.etiquetaAnterior}`, subiendo: true };
  }

  const rangoHref = (r: RangoTipo) => `/resumen?rango=${r}&offset=0`;
  const prevHref = `/resumen?rango=${rango}&offset=${offset - 1}`;
  const nextHref = `/resumen?rango=${rango}&offset=${offset + 1}`;

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
          Resumen<span className="text-accent">.</span>
        </p>
        <Link
          href="/historial"
          aria-label="Ver historial"
          className="flex h-9 w-9 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
        >
          <HistoryGlyph className="h-5 w-5" />
        </Link>
      </header>

      <div className="relative z-10 mx-auto mt-6 flex w-fit rounded-full border border-paper/15 p-1">
        {(["semana", "mes"] as const).map((r) => (
          <Link
            key={r}
            href={rangoHref(r)}
            className={`rounded-full px-5 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
              rango === r ? "bg-accent text-paper" : "text-paper-dim hover:text-paper"
            }`}
          >
            {r === "semana" ? "Semana" : "Mes"}
          </Link>
        ))}
      </div>

      <div className="relative z-10 mx-auto mt-4 flex w-fit items-center gap-4">
        <Link
          href={prevHref}
          aria-label="Período anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
        >
          <BackGlyph className="h-4 w-4" />
        </Link>
        <span className="min-w-[11ch] text-center font-mono text-xs uppercase tracking-widest text-paper-dim">
          {periodo.etiqueta}
        </span>
        {periodo.esActual ? (
          <span className="h-8 w-8" aria-hidden="true" />
        ) : (
          <Link
            href={nextHref}
            aria-label="Período siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
          >
            <BackGlyph className="h-4 w-4 rotate-180" />
          </Link>
        )}
      </div>

      {total === 0 ? (
        <div className="relative z-10 flex flex-col items-center gap-4 pt-16 text-center">
          <p className="font-display text-xl italic text-paper">Sin gastos en este período</p>
          <p className="max-w-[26ch] font-body text-sm leading-relaxed text-paper-dim">
            Todavía no registraste gastos {rango === "semana" ? "esta semana" : "este mes"}.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-full bg-accent px-6 py-3 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.97]"
          >
            Registrar gasto
          </Link>
        </div>
      ) : (
        <div className="relative z-10 mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-10">
          {/* Hero: total del período */}
          <div className="flex flex-col items-center text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper-dim">
              Total gastado
            </span>
            <span className="mt-2 font-mono text-[clamp(2.75rem,13vw,4.25rem)] font-bold leading-none text-paper">
              {money(total)}
            </span>
            {variacion && (
              <span
                className={`mt-3 rounded-full px-3 py-1 font-mono text-xs ${
                  variacion.subiendo ? "bg-accent-soft text-accent" : "bg-paper/10 text-paper-dim"
                }`}
              >
                {variacion.subiendo ? "▲" : "▼"} {variacion.texto}
              </span>
            )}
          </div>

          {/* Gastos fijos vs. variables */}
          <div className="w-full">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              Fijos vs. variables
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-paper/10 bg-ink-soft px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                  Gastos fijos
                </p>
                <p className="mt-1.5 font-mono text-xl font-bold text-paper">{money(totalFijo)}</p>
                <p className="mt-0.5 font-mono text-[10px] text-paper-dim">
                  {Math.round(shareFijo)}% del total
                </p>
              </div>
              <div className="rounded-2xl border border-paper/10 bg-ink-soft px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                  Gastos variables
                </p>
                <p className="mt-1.5 font-mono text-xl font-bold text-paper">{money(totalVariable)}</p>
                <p className="mt-0.5 font-mono text-[10px] text-paper-dim">
                  {Math.round(shareVariable)}% del total
                </p>
              </div>
            </div>
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-paper/8">
              <div className="h-full bg-accent" style={{ width: `${shareFijo}%` }} />
              <div className="h-full bg-paper/25" style={{ width: `${shareVariable}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> Fijos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-paper/25" /> Variables
              </span>
            </div>
          </div>

          {/* Categoría con mayor gasto */}
          {topCategoria && (
            <div className="w-full rounded-2xl border border-paper/10 bg-ink-soft px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                Gastaste más en
              </p>
              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <p className="font-display text-2xl italic text-paper">
                  {CATEGORIA_LABEL[topCategoria.categoria]}
                </p>
                <p className="font-mono text-sm text-paper">
                  {money(topCategoria.monto)}
                  <span className="ml-1.5 text-paper-dim">
                    · {Math.round((topCategoria.monto / total) * 100)}%
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Desglose por categoría */}
          <div className="w-full">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              Desglose por categoría
            </p>
            <div className="flex flex-col gap-4">
              {desglose.map((item) => {
                const share = total > 0 ? (item.monto / total) * 100 : 0;
                const largo = maxMonto > 0 ? (item.monto / maxMonto) * 100 : 0;
                const opacidad = maxMonto > 0 ? 0.42 + 0.58 * (item.monto / maxMonto) : 1;
                return (
                  <div key={item.categoria} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-body text-sm text-paper">
                        {CATEGORIA_LABEL[item.categoria]}
                      </span>
                      <span className="font-mono text-xs text-paper-dim">
                        {money(item.monto)} · {Math.round(share)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-paper/8">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${largo}%`, opacity: opacidad }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
