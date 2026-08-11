import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/receipt";
import { encontrarGastoParecido, rangoDeFechasCercanas } from "@/lib/duplicados";

export const runtime = "nodejs";

const NuevoGastoSchema = z.object({
  comercio: z.string().trim().min(1, "Falta el comercio."),
  monto: z.number().finite().positive("El monto debe ser mayor a 0."),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  categoria: z.enum(CATEGORIAS),
  esRecurrente: z.boolean().optional(),
  forzar: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = NuevoGastoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const { forzar, ...datos } = parsed.data;

  if (!forzar) {
    const { min, max } = rangoDeFechasCercanas(datos.fecha);
    const cercanos = await prisma.gasto.findMany({
      where: { fecha: { gte: min, lte: max } },
    });
    const parecido = encontrarGastoParecido(datos, cercanos);
    if (parecido) {
      return NextResponse.json({ duplicate: true, match: parecido }, { status: 409 });
    }
  }

  const gasto = await prisma.gasto.create({
    data: { ...datos, esRecurrente: datos.esRecurrente ?? false },
  });
  return NextResponse.json({ gasto }, { status: 201 });
}

export async function GET() {
  const gastos = await prisma.gasto.findMany({
    orderBy: [{ fecha: "desc" }, { registradoEn: "desc" }],
  });
  return NextResponse.json({ gastos });
}
