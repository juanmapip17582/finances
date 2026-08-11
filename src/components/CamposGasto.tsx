import { CATEGORIAS, CATEGORIA_LABEL, type Categoria } from "@/lib/receipt";
import { restanteDesglose, type DraftGasto, type FilaCategoriaDraft } from "@/lib/gastos";

type CamposGastoProps = {
  draft: DraftGasto;
  onChange: (draft: DraftGasto) => void;
};

function formatearMonto(monto: number): string {
  return `$${Math.round(Math.abs(monto)).toLocaleString("es-AR")}`;
}

export default function CamposGasto({ draft, onChange }: CamposGastoProps) {
  const dividido = draft.desglose !== null;

  function activarDivision() {
    onChange({
      ...draft,
      desglose: [
        { categoria: draft.categoria, monto: "" },
        { categoria: "otros", monto: "" },
      ],
    });
  }

  function desactivarDivision() {
    onChange({ ...draft, desglose: null });
  }

  function actualizarFila(index: number, cambios: Partial<FilaCategoriaDraft>) {
    if (!draft.desglose) return;
    onChange({
      ...draft,
      desglose: draft.desglose.map((fila, i) => (i === index ? { ...fila, ...cambios } : fila)),
    });
  }

  function agregarFila() {
    if (!draft.desglose) return;
    onChange({ ...draft, desglose: [...draft.desglose, { categoria: "otros", monto: "" }] });
  }

  function quitarFila(index: number) {
    if (!draft.desglose || draft.desglose.length <= 1) return;
    onChange({ ...draft, desglose: draft.desglose.filter((_, i) => i !== index) });
  }

  const restante = dividido ? restanteDesglose(draft.desglose!, draft.monto) : 0;

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">Comercio</span>
        <input
          type="text"
          value={draft.comercio}
          onChange={(e) => onChange({ ...draft, comercio: e.target.value })}
          placeholder="Nombre del comercio"
          className="rounded-2xl border border-paper/15 bg-transparent px-4 py-3 font-body text-paper placeholder:text-paper-dim/60 outline-none focus:border-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">Monto</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={draft.monto}
            onChange={(e) => onChange({ ...draft, monto: e.target.value })}
            placeholder="0.00"
            className="rounded-2xl border border-paper/15 bg-transparent px-4 py-3 font-mono text-paper placeholder:text-paper-dim/60 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">Fecha</span>
          <input
            type="date"
            value={draft.fecha}
            onChange={(e) => onChange({ ...draft, fecha: e.target.value })}
            className="rounded-2xl border border-paper/15 bg-transparent px-4 py-3 font-mono text-sm text-paper outline-none focus:border-accent [color-scheme:dark]"
          />
        </label>
      </div>

      {!dividido ? (
        <div className="flex flex-col gap-1.5">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">
              Categoría
            </span>
            <select
              value={draft.categoria}
              onChange={(e) => onChange({ ...draft, categoria: e.target.value as Categoria })}
              className="rounded-2xl border border-paper/15 bg-ink-soft px-4 py-3 font-body text-paper outline-none focus:border-accent [color-scheme:dark]"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={activarDivision}
            className="self-start font-mono text-[11px] uppercase tracking-widest text-paper-dim underline-offset-4 hover:text-paper hover:underline"
          >
            Dividir en varias categorías
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">
              Categorías
            </span>
            <button
              type="button"
              onClick={desactivarDivision}
              className="font-mono text-[11px] uppercase tracking-widest text-paper-dim underline-offset-4 hover:text-paper hover:underline"
            >
              Usar una sola categoría
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {draft.desglose!.map((fila, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={fila.categoria}
                  onChange={(e) => actualizarFila(index, { categoria: e.target.value as Categoria })}
                  className="min-w-0 flex-1 rounded-2xl border border-paper/15 bg-ink-soft px-3 py-2.5 font-body text-sm text-paper outline-none focus:border-accent [color-scheme:dark]"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={fila.monto}
                  onChange={(e) => actualizarFila(index, { monto: e.target.value })}
                  placeholder="0.00"
                  className="w-24 flex-none rounded-2xl border border-paper/15 bg-transparent px-3 py-2.5 font-mono text-sm text-paper placeholder:text-paper-dim/60 outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => quitarFila(index)}
                  disabled={draft.desglose!.length <= 1}
                  aria-label="Quitar categoría"
                  className="flex h-10 w-8 flex-none items-center justify-center rounded-xl text-lg text-paper-dim transition-colors hover:text-paper disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarFila}
            className="self-start font-mono text-[11px] uppercase tracking-widest text-paper-dim underline-offset-4 hover:text-paper hover:underline"
          >
            + Agregar categoría
          </button>

          <p
            className={`font-mono text-xs ${
              Math.abs(restante) < 0.01 ? "text-accent" : "text-paper-dim"
            }`}
          >
            {Math.abs(restante) < 0.01
              ? "✓ Asignado por completo"
              : restante > 0
                ? `Falta asignar: ${formatearMonto(restante)}`
                : `Sobra: ${formatearMonto(restante)}`}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-paper/15 px-4 py-3">
        <div className="min-w-0">
          <p className="font-body text-sm text-paper">Es un gasto recurrente</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
            Suscripciones, servicios fijos
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.esRecurrente}
          aria-label="Es un gasto recurrente"
          onClick={() => onChange({ ...draft, esRecurrente: !draft.esRecurrente })}
          className={`relative h-7 w-12 flex-none overflow-hidden rounded-full border-0 p-0 transition-colors ${
            draft.esRecurrente ? "bg-accent" : "bg-paper/15"
          }`}
        >
          {/* Track is w-12 (48px) tall h-7 (28px); thumb is h-5 w-5 (20px) inset by
              left-1/top-1 (4px) on every side. Off sits at its base position (left-1);
              on translates by track − thumb − (2 × inset) = 48 − 20 − 8 = 20px
              (translate-x-5) so the thumb lands with the same 4px gap on the right. */}
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-paper transition-transform ${
              draft.esRecurrente ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </>
  );
}
