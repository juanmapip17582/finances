import { CATEGORIAS, CATEGORIA_LABEL, type Categoria } from "@/lib/receipt";
import type { DraftGasto } from "@/lib/gastos";

type CamposGastoProps = {
  draft: DraftGasto;
  onChange: (draft: DraftGasto) => void;
};

export default function CamposGasto({ draft, onChange }: CamposGastoProps) {
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

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">Categoría</span>
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
