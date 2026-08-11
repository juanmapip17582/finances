import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/receipt";

export const runtime = "nodejs";

const ActualizarGastoSchema = z.object({
  comercio: z.string().trim().min(1, "Falta el comercio."),
  monto: z.number().finite().positive("El monto debe ser mayor a 0."),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  categoria: z.enum(CATEGORIAS),
  esRecurrente: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

function parseId(idParam: string): number | null {
  const id = Number.parseInt(idParam, 10);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = ActualizarGastoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  try {
    const gasto = await prisma.gasto.update({
      where: { id },
      data: { ...parsed.data, esRecurrente: parsed.data.esRecurrente ?? false },
    });
    return NextResponse.json({ gasto });
  } catch {
    return NextResponse.json({ error: "No se encontró el gasto." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  }

  try {
    await prisma.gasto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se encontró el gasto." }, { status: 404 });
  }
}
