export type RangoTipo = "semana" | "mes";

export type Periodo = {
  inicioKey: string;
  finKey: string;
  inicioAnteriorKey: string;
  finAnteriorKey: string;
  etiqueta: string;
  etiquetaAnterior: string;
  esActual: boolean;
};

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatearRangoSemana(inicio: Date, fin: Date): string {
  const diaInicio = inicio.getDate();
  const diaFin = fin.getDate();
  if (inicio.getMonth() === fin.getMonth()) {
    const mes = capitalize(fin.toLocaleDateString("es-AR", { month: "long" }));
    return `${diaInicio} – ${diaFin} de ${mes}`;
  }
  const mesInicio = inicio.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
  const mesFin = fin.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
  return `${diaInicio} ${mesInicio} – ${diaFin} ${mesFin}`;
}

export function calcularPeriodo(tipo: RangoTipo, offset: number, ahora: Date = new Date()): Periodo {
  if (tipo === "mes") {
    const base = new Date(ahora.getFullYear(), ahora.getMonth() + offset, 1);
    const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
    const fin = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const inicioAnterior = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const finAnterior = new Date(base.getFullYear(), base.getMonth(), 0);

    return {
      inicioKey: toKey(inicio),
      finKey: toKey(fin),
      inicioAnteriorKey: toKey(inicioAnterior),
      finAnteriorKey: toKey(finAnterior),
      etiqueta: capitalize(inicio.toLocaleDateString("es-AR", { month: "long", year: "numeric" })),
      etiquetaAnterior: "el mes anterior",
      esActual: offset >= 0,
    };
  }

  const base = addDays(ahora, offset * 7);
  const inicio = startOfWeekMonday(base);
  const fin = addDays(inicio, 6);
  const inicioAnterior = addDays(inicio, -7);
  const finAnterior = addDays(fin, -7);

  return {
    inicioKey: toKey(inicio),
    finKey: toKey(fin),
    inicioAnteriorKey: toKey(inicioAnterior),
    finAnteriorKey: toKey(finAnterior),
    etiqueta: formatearRangoSemana(inicio, fin),
    etiquetaAnterior: "la semana anterior",
    esActual: offset >= 0,
  };
}
