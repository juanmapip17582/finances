"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import CameraGlyph from "./CameraGlyph";
import CamposGasto from "./CamposGasto";
import { compressImageToJpeg } from "@/lib/image";
import {
  guardarGasto,
  GastoDuplicadoError,
  desgloseValido,
  type Gasto,
  type NuevoGasto,
  type DraftGasto,
} from "@/lib/gastos";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/receipt";

type Status = "idle" | "analyzing" | "review" | "saved";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): DraftGasto {
  return {
    comercio: "",
    monto: "",
    fecha: today(),
    categoria: "otros",
    esRecurrente: false,
    desglose: null,
  };
}

function formatearMonto(monto: number): string {
  return `$${monto.toLocaleString("es-AR")}`;
}

function formatearFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return fechaISO;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

export default function CaptureButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftGasto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedGasto, setSavedGasto] = useState<Gasto | null>(null);
  const [thud, setThud] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicado, setDuplicado] = useState<{ datos: NuevoGasto; parecido: Gasto } | null>(null);

  function handlePick() {
    inputRef.current?.click();
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setThud(true);
    window.setTimeout(() => setThud(false), 350);
    setErrorMessage(null);
    setDraft(null);
    setStatus("analyzing");

    try {
      const { base64, mediaType, dataUrl } = await compressImageToJpeg(file);
      setPreview(dataUrl);

      const res = await fetch("/api/extract-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });
      const data = await res.json();

      if (res.ok && data.receipt) {
        setDraft({
          comercio: data.receipt.comercio ?? "",
          monto: String(data.receipt.monto ?? ""),
          fecha: data.receipt.fecha ?? today(),
          categoria: (data.receipt.categoria as Categoria) ?? "otros",
          esRecurrente: false,
          desglose: null,
        });
      } else {
        setErrorMessage(data.error ?? "No se pudo analizar el recibo.");
        setDraft(emptyDraft());
      }
    } catch {
      setErrorMessage("No se pudo conectar con el servicio de IA. Completá los datos manualmente.");
      setDraft(emptyDraft());
    } finally {
      setStatus("review");
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;

    const monto = Number(draft.monto.replace(",", "."));
    if (!draft.comercio.trim() || !Number.isFinite(monto) || monto <= 0) {
      setErrorMessage("Revisá el comercio y el monto antes de guardar.");
      return;
    }
    if (draft.desglose && !desgloseValido(draft.desglose, draft.monto)) {
      setErrorMessage("La suma de las categorías no coincide con el monto total.");
      return;
    }

    await intentarGuardar({
      comercio: draft.comercio.trim(),
      monto,
      fecha: draft.fecha,
      categoria: draft.categoria,
      esRecurrente: draft.esRecurrente,
      desglose: draft.desglose?.map((f) => ({
        categoria: f.categoria,
        monto: Number(f.monto.replace(",", ".")),
      })),
    });
  }

  async function intentarGuardar(datos: NuevoGasto, forzar = false) {
    setErrorMessage(null);
    setSaving(true);
    try {
      const gasto = await guardarGasto(datos, { forzar });
      setDuplicado(null);
      setSavedGasto(gasto);
      setStatus("saved");
    } catch (err) {
      if (err instanceof GastoDuplicadoError) {
        setDuplicado({ datos, parecido: err.parecido });
      } else {
        setErrorMessage(err instanceof Error ? err.message : "No se pudo guardar el gasto.");
      }
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setPreview(null);
    setDraft(null);
    setErrorMessage(null);
    setSavedGasto(null);
    setDuplicado(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleManualEntry() {
    setPreview(null);
    setErrorMessage(null);
    setSavedGasto(null);
    setDuplicado(null);
    setDraft(emptyDraft());
    setStatus("review");
  }

  const sheetOpen = status !== "idle";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative flex h-[66vw] w-[66vw] max-h-[316px] max-w-[316px] items-center justify-center">
        <span
          aria-hidden
          className="animate-ring-pulse absolute h-[63vw] w-[63vw] max-h-[300px] max-w-[300px] rounded-full border border-accent/25"
        />
        <button
          type="button"
          onClick={handlePick}
          className={`group relative flex h-[50vw] w-[50vw] max-h-[240px] max-w-[240px] flex-col items-center justify-center gap-3 rounded-full bg-accent text-paper shadow-[0_0_0_6px_var(--color-accent-soft),0_18px_40px_-16px_rgba(255,70,32,0.35)] transition-transform duration-150 ease-out active:scale-[0.95] ${
            thud ? "animate-stamp-press" : ""
          }`}
        >
          <CameraGlyph className="h-11 w-11 transition-transform duration-200 group-active:scale-90" />
          <span className="font-body text-[13px] font-semibold uppercase tracking-[0.14em]">
            Registrar gasto
          </span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <p className="max-w-[24ch] text-balance font-body text-sm leading-relaxed text-paper-dim">
          Sacá una foto del recibo o subí una imagen desde tu galería.
        </p>
        <button
          type="button"
          onClick={handleManualEntry}
          className="rounded-full border border-paper/20 bg-paper/5 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-paper-dim transition-colors hover:border-paper/35 hover:bg-paper/10 hover:text-paper active:scale-[0.97]"
        >
          Agregar sin foto
        </button>
      </div>

      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Registrar gasto"
          className="animate-fade-in fixed inset-0 z-20 flex items-end justify-center bg-ink/70 backdrop-blur-sm"
        >
          <div className="animate-sheet-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-paper/10 bg-ink-soft px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-paper/15" />

            {status === "analyzing" && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                {preview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={preview}
                    alt="Recibo capturado"
                    className="h-24 w-24 rounded-2xl object-cover opacity-60 ring-1 ring-paper/10"
                  />
                )}
                <div className="flex items-center gap-2 text-paper">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/25 border-t-accent" />
                  <span className="font-display text-lg italic">Analizando recibo…</span>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">
                  Leyendo comercio, monto y fecha
                </p>
              </div>
            )}

            {status === "review" && draft && duplicado && (
              <div className="flex flex-col gap-5 text-center">
                <p className="font-display text-xl italic text-paper">¿Gasto repetido?</p>
                <p className="font-body text-sm leading-relaxed text-paper-dim">
                  Ya registraste un gasto parecido:{" "}
                  <span className="text-paper">{duplicado.parecido.comercio}</span> por{" "}
                  <span className="font-mono text-paper">{formatearMonto(duplicado.parecido.monto)}</span>{" "}
                  el <span className="text-paper">{formatearFecha(duplicado.parecido.fecha)}</span>. ¿Querés
                  guardarlo de todos modos?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDuplicado(null)}
                    className="flex-1 rounded-full border border-paper/15 py-3.5 font-body text-sm font-medium text-paper transition-colors hover:bg-paper/5 active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => intentarGuardar(duplicado.datos, true)}
                    className="flex-1 rounded-full bg-accent py-3.5 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {saving ? "Guardando…" : "Guardar de todas formas"}
                  </button>
                </div>
              </div>
            )}

            {status === "review" && draft && !duplicado && (
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  {preview && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={preview}
                      alt="Recibo capturado"
                      className="h-16 w-16 flex-none rounded-2xl object-cover ring-1 ring-paper/10"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-xl italic text-paper">
                      {preview ? "Confirmá los datos" : "Cargá los datos"}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-paper-dim">
                      {preview ? "Corregí lo que haga falta" : "Completá el comercio y el monto"}
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <p className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-paper">
                    {errorMessage}
                  </p>
                )}

                <CamposGasto draft={draft} onChange={setDraft} />

                <div className="mt-1 flex gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-full border border-paper/15 py-3.5 font-body text-sm font-medium text-paper transition-colors hover:bg-paper/5 active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || (draft.desglose !== null && !desgloseValido(draft.desglose, draft.monto))}
                    className="flex-1 rounded-full bg-accent py-3.5 font-body text-sm font-semibold text-paper transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {saving ? "Guardando…" : "Guardar gasto"}
                  </button>
                </div>
              </form>
            )}

            {status === "saved" && savedGasto && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-paper">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
                    <path
                      d="M5 12.5l4.5 4.5L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-xl italic text-paper">Gasto registrado</p>
                  <p className="mt-1 font-mono text-sm text-paper-dim">
                    ${savedGasto.monto.toLocaleString("es-AR")} · {savedGasto.comercio}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-paper-dim/70">
                    {CATEGORIA_LABEL[savedGasto.categoria]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 w-full rounded-full border border-paper/15 py-3.5 font-body text-sm font-medium text-paper transition-colors hover:bg-paper/5 active:scale-[0.98]"
                >
                  Registrar otro gasto
                </button>
                <Link
                  href="/historial"
                  className="font-mono text-[11px] uppercase tracking-widest text-paper-dim underline-offset-4 hover:text-paper hover:underline"
                >
                  Ver historial
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
