"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  agruparPorDia,
  etiquetaDia,
  actualizarGasto,
  eliminarGasto,
  type Gasto,
  type DraftGasto,
} from "@/lib/gastos";
import { CATEGORIAS, CATEGORIA_LABEL, type Categoria } from "@/lib/receipt";
import SearchGlyph from "./SearchGlyph";
import EllipsisGlyph from "./EllipsisGlyph";
import CamposGasto from "./CamposGasto";

function draftDeGasto(gasto: Gasto): DraftGasto {
  return {
    comercio: gasto.comercio,
    monto: String(gasto.monto),
    fecha: gasto.fecha,
    categoria: gasto.categoria,
    esRecurrente: gasto.esRecurrente,
  };
}

export default function HistorialExplorer({ gastos: gastosIniciales }: { gastos: Gasto[] }) {
  const [gastos, setGastos] = useState<Gasto[]>(gastosIniciales);
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "todas">("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [editando, setEditando] = useState<Gasto | null>(null);
  const [draftEdicion, setDraftEdicion] = useState<DraftGasto | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [eliminando, setEliminando] = useState<Gasto | null>(null);
  const [eliminandoEnCurso, setEliminandoEnCurso] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return gastos.filter((g) => {
      if (q && !g.comercio.toLowerCase().includes(q)) return false;
      if (categoria !== "todas" && g.categoria !== categoria) return false;
      if (desde && g.fecha < desde) return false;
      if (hasta && g.fecha > hasta) return false;
      return true;
    });
  }, [gastos, texto, categoria, desde, hasta]);

  const grupos = useMemo(() => agruparPorDia(filtrados), [filtrados]);
  const hayFiltrosActivos = texto.trim() !== "" || categoria !== "todas" || desde !== "" || hasta !== "";

  function limpiarFiltros() {
    setTexto("");
    setCategoria("todas");
    setDesde("");
    setHasta("");
  }

  function abrirEdicion(gasto: Gasto) {
    setMenuAbierto(null);
    setErrorAccion(null);
    setEditando(gasto);
    setDraftEdicion(draftDeGasto(gasto));
  }

  function cerrarEdicion() {
    setEditando(null);
    setDraftEdicion(null);
    setErrorAccion(null);
  }

  async function guardarEdicion(event: FormEvent) {
    event.preventDefault();
    if (!editando || !draftEdicion) return;

    const monto = Number(draftEdicion.monto.replace(",", "."));
    if (!draftEdicion.comercio.trim() || !Number.isFinite(monto) || monto <= 0) {
      setErrorAccion("Revisá el comercio y el monto antes de guardar.");
      return;
    }

    setGuardandoEdicion(true);
    setErrorAccion(null);
    try {
      const actualizado = await actualizarGasto(editando.id, {
        comercio: draftEdicion.comercio.trim(),
        monto,
        fecha: draftEdicion.fecha,
        categoria: draftEdicion.categoria,
        esRecurrente: draftEdicion.esRecurrente,
      });
      setGastos((prev) => prev.map((g) => (g.id === actualizado.id ? actualizado : g)));
      cerrarEdicion();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo guardar los cambios.");
    } finally {
      setGuardandoEdicion(false);
    }
  }

  function pedirEliminar(gasto: Gasto) {
    setMenuAbierto(null);
    setErrorAccion(null);
    setEliminando(gasto);
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    setEliminandoEnCurso(true);
    setErrorAccion(null);
    try {
      await eliminarGasto(eliminando.id);
      setGastos((prev) => prev.filter((g) => g.id !== eliminando.id));
      setEliminando(null);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo eliminar el gasto.");
    } finally {
      setEliminandoEnCurso(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto mt-6 flex w-full max-w-md flex-col gap-5">
      <label className="relative block">
        <SearchGlyph className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-dim" />
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por comercio…"
          className="w-full rounded-2xl border border-paper/15 bg-transparent py-3 pl-11 pr-4 font-body text-sm text-paper placeholder:text-paper-dim/60 outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-col gap-3">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria | "todas")}
          className="rounded-2xl border border-paper/15 bg-ink-soft px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-paper outline-none focus:border-accent [color-scheme:dark]"
        >
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABEL[c]}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">Desde</span>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              max={hasta || undefined}
              className="rounded-2xl border border-paper/15 bg-transparent px-3 py-2.5 font-mono text-xs text-paper outline-none focus:border-accent [color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">Hasta</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              min={desde || undefined}
              className="rounded-2xl border border-paper/15 bg-transparent px-3 py-2.5 font-mono text-xs text-paper outline-none focus:border-accent [color-scheme:dark]"
            />
          </label>
        </div>

        {hayFiltrosActivos && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"}
            </span>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="font-mono text-[10px] uppercase tracking-widest text-paper-dim underline-offset-4 hover:text-paper hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-display text-lg italic text-paper">Sin resultados</p>
          <p className="max-w-[26ch] font-body text-sm leading-relaxed text-paper-dim">
            No encontramos gastos que coincidan con esos filtros.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {grupos.map((grupo) => (
            <section key={grupo.fecha}>
              <div className="mb-3 flex items-baseline justify-between border-b border-paper/10 pb-2">
                <h2 className="font-display text-lg italic capitalize text-paper">
                  {etiquetaDia(grupo.fecha)}
                </h2>
                <span className="font-mono text-xs text-paper-dim">
                  ${grupo.total.toLocaleString("es-AR")}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {grupo.items.map((gasto) => (
                  <li
                    key={gasto.id}
                    className="relative flex items-center justify-between gap-3 rounded-2xl border border-paper/10 bg-ink-soft px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm text-paper">{gasto.comercio}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                        {CATEGORIA_LABEL[gasto.categoria]}
                        {gasto.esRecurrente ? " · Recurrente" : ""}
                      </p>
                    </div>
                    <div className="flex flex-none items-center gap-1">
                      <span className="font-mono text-sm text-paper">
                        ${gasto.monto.toLocaleString("es-AR")}
                      </span>
                      <button
                        type="button"
                        aria-label="Más acciones"
                        aria-expanded={menuAbierto === gasto.id}
                        onClick={() => setMenuAbierto(menuAbierto === gasto.id ? null : gasto.id)}
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-paper-dim transition-colors hover:text-paper"
                      >
                        <EllipsisGlyph className="h-4 w-4" />
                      </button>
                    </div>

                    {menuAbierto === gasto.id && (
                      <>
                        <button
                          type="button"
                          aria-hidden="true"
                          tabIndex={-1}
                          onClick={() => setMenuAbierto(null)}
                          className="fixed inset-0 z-30 cursor-default"
                        />
                        <div className="absolute right-4 top-full z-40 mt-1 w-36 overflow-hidden rounded-2xl border border-paper/15 bg-ink-soft shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(gasto)}
                            className="block w-full px-4 py-3 text-left font-body text-sm text-paper hover:bg-paper/5"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => pedirEliminar(gasto)}
                            className="block w-full border-t border-paper/10 px-4 py-3 text-left font-body text-sm text-accent hover:bg-paper/5"
                          >
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editando && draftEdicion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar gasto"
          className="animate-fade-in fixed inset-0 z-20 flex items-end justify-center bg-ink/70 backdrop-blur-sm"
        >
          <div className="animate-sheet-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-paper/10 bg-ink-soft px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-paper/15" />
            <form onSubmit={guardarEdicion} className="flex flex-col gap-5">
              <p className="font-display text-xl italic text-paper">Editar gasto</p>

              {errorAccion && (
                <p className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-paper">
                  {errorAccion}
                </p>
              )}

              <CamposGasto draft={draftEdicion} onChange={setDraftEdicion} />

              <div className="mt-1 flex gap-3">
                <button
                  type="button"
                  onClick={cerrarEdicion}
                  className="flex-1 rounded-full border border-paper/15 py-3.5 font-body text-sm font-medium text-paper transition-colors hover:bg-paper/5 active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 rounded-full bg-accent py-3.5 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {guardandoEdicion ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eliminando && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
          className="animate-fade-in fixed inset-0 z-20 flex items-center justify-center bg-ink/70 px-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl border border-paper/10 bg-ink-soft p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <p className="font-display text-xl italic text-paper">¿Eliminar este gasto?</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-paper-dim">
              ¿Seguro que querés eliminar <span className="text-paper">{eliminando.comercio}</span> por{" "}
              <span className="font-mono text-paper">${eliminando.monto.toLocaleString("es-AR")}</span>?
              Esta acción no se puede deshacer.
            </p>

            {errorAccion && (
              <p className="mt-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-paper">
                {errorAccion}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setEliminando(null)}
                className="flex-1 rounded-full border border-paper/15 py-3.5 font-body text-sm font-medium text-paper transition-colors hover:bg-paper/5 active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoEnCurso}
                onClick={confirmarEliminar}
                className="flex-1 rounded-full bg-accent py-3.5 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {eliminandoEnCurso ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
