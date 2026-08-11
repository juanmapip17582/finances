export type GastoExistente = {
  id: number;
  comercio: string;
  monto: number;
  fecha: string;
  categoria: string;
};

export type CandidatoGasto = {
  comercio: string;
  monto: number;
  fecha: string;
};

const TOLERANCIA_MONTO = 0.05;
const TOLERANCIA_DIAS = 1;

function parseFecha(fechaISO: string): Date {
  const [y, m, d] = fechaISO.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diferenciaEnDias(a: string, b: string): number {
  const msPorDia = 86_400_000;
  return Math.abs(parseFecha(a).getTime() - parseFecha(b).getTime()) / msPorDia;
}

function dentroDeLaToleranciaDeMonto(a: number, b: number): boolean {
  const base = Math.max(Math.abs(a), Math.abs(b));
  if (base === 0) return a === b;
  return Math.abs(a - b) / base <= TOLERANCIA_MONTO;
}

/** Ventana [min, max] de claves de fecha (YYYY-MM-DD) a ±`dias` de `fechaISO`, para acotar la consulta a la base. */
export function rangoDeFechasCercanas(fechaISO: string, dias = TOLERANCIA_DIAS): { min: string; max: string } {
  const fecha = parseFecha(fechaISO);
  const min = new Date(fecha);
  min.setDate(min.getDate() - dias);
  const max = new Date(fecha);
  max.setDate(max.getDate() + dias);
  return { min: toKey(min), max: toKey(max) };
}

/**
 * Busca, entre `existentes`, un gasto con el mismo comercio, fecha a lo sumo a
 * un día de diferencia, y monto dentro de un 5% — pensado para detectar el
 * mismo ticket escaneado dos veces con pequeñas diferencias de OCR.
 */
export function encontrarGastoParecido<T extends GastoExistente>(
  candidato: CandidatoGasto,
  existentes: T[]
): T | null {
  const comercioNormalizado = candidato.comercio.trim().toLowerCase();

  const coincidencias = existentes.filter(
    (g) =>
      g.comercio.trim().toLowerCase() === comercioNormalizado &&
      diferenciaEnDias(g.fecha, candidato.fecha) <= TOLERANCIA_DIAS &&
      dentroDeLaToleranciaDeMonto(g.monto, candidato.monto)
  );

  if (coincidencias.length === 0) return null;

  coincidencias.sort(
    (a, b) => Math.abs(a.monto - candidato.monto) - Math.abs(b.monto - candidato.monto)
  );
  return coincidencias[0];
}
