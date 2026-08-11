import type { Categoria } from "./receipt";

export type FilaCategoria = {
  categoria: Categoria;
  monto: number;
};

export type Gasto = {
  id: number;
  comercio: string;
  monto: number;
  fecha: string;
  categoria: Categoria;
  esRecurrente: boolean;
  registradoEn: string;
  desglose: FilaCategoria[];
};

export type NuevoGasto = {
  comercio: string;
  monto: number;
  fecha: string;
  categoria: Categoria;
  esRecurrente: boolean;
  desglose?: FilaCategoria[];
};

export type FilaCategoriaDraft = {
  categoria: Categoria;
  monto: string;
};

export type DraftGasto = {
  comercio: string;
  monto: string;
  fecha: string;
  categoria: Categoria;
  esRecurrente: boolean;
  /** null = categoría única (como antes); array = dividido en varias categorías. */
  desglose: FilaCategoriaDraft[] | null;
};

/** La categoría con mayor monto dentro de un desglose — se usa como `categoria` del gasto para listas/filtros simples. */
export function categoriaPrincipal(desglose: FilaCategoria[]): Categoria {
  return desglose.reduce((mayor, fila) => (fila.monto > mayor.monto ? fila : mayor)).categoria;
}

/** monto total menos lo ya asignado en las filas del desglose (positivo = falta asignar, negativo = sobra). */
export function restanteDesglose(desglose: FilaCategoriaDraft[], montoTotal: string): number {
  const total = Number(montoTotal.replace(",", ".")) || 0;
  const asignado = desglose.reduce((sum, fila) => sum + (Number(fila.monto.replace(",", ".")) || 0), 0);
  return total - asignado;
}

/** Un desglose es válido para guardar si tiene filas y su suma coincide (±1 centavo) con el monto total. */
export function desgloseValido(desglose: FilaCategoriaDraft[], montoTotal: string): boolean {
  return desglose.length > 0 && Math.abs(restanteDesglose(desglose, montoTotal)) < 0.01;
}

export class GastoDuplicadoError extends Error {
  parecido: Gasto;

  constructor(parecido: Gasto) {
    super("Ya existe un gasto parecido.");
    this.name = "GastoDuplicadoError";
    this.parecido = parecido;
  }
}

export async function guardarGasto(gasto: NuevoGasto, opciones?: { forzar?: boolean }): Promise<Gasto> {
  const res = await fetch("/api/gastos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...gasto, forzar: opciones?.forzar ?? false }),
  });

  const data = await res.json().catch(() => null);

  if (res.status === 409 && data?.duplicate) {
    throw new GastoDuplicadoError(data.match as Gasto);
  }
  if (!res.ok || !data) {
    throw new Error(data?.error ?? "No se pudo guardar el gasto.");
  }
  return data.gasto as Gasto;
}

export async function actualizarGasto(id: number, gasto: NuevoGasto): Promise<Gasto> {
  const res = await fetch(`/api/gastos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gasto),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.error ?? "No se pudo guardar los cambios.");
  }
  return data.gasto as Gasto;
}

export async function eliminarGasto(id: number): Promise<void> {
  const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "No se pudo eliminar el gasto.");
  }
}

export type GrupoDeGastos = {
  fecha: string;
  items: Gasto[];
  total: number;
};

export function agruparPorDia(gastos: Gasto[]): GrupoDeGastos[] {
  const grupos = new Map<string, Gasto[]>();
  for (const gasto of gastos) {
    const items = grupos.get(gasto.fecha) ?? [];
    items.push(gasto);
    grupos.set(gasto.fecha, items);
  }

  return [...grupos.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([fecha, items]) => ({
      fecha,
      items,
      total: items.reduce((sum, item) => sum + item.monto, 0),
    }));
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function etiquetaDia(fechaISO: string): string {
  const hoy = localDateKey(new Date());
  const ayer = localDateKey(new Date(Date.now() - 86_400_000));
  if (fechaISO === hoy) return "Hoy";
  if (fechaISO === ayer) return "Ayer";

  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return fechaISO;

  const fecha = new Date(y, m - 1, d);
  const etiqueta = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
}
