import { NextResponse } from "next/server";
import { AuthenticationError, RateLimitError, APIError, OpenAIError } from "openai";
import { getOpenAIClient } from "@/lib/openai";
import { ReceiptSchema } from "@/lib/receipt";

// Server-only: this file is a Next.js Route Handler, executed exclusively on
// the server. OPENAI_API_KEY is never sent to or read by the browser — the
// client only ever talks to this route, never to OpenAI directly.
export const runtime = "nodejs";

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXTRACTION_PROMPT = (today: string) => `Extraés datos de gastos a partir de la foto de un recibo o ticket de compra. Hoy es ${today}; usá esa fecha si el recibo no muestra una fecha legible. El monto debe ser el total final pagado, como número sin símbolo de moneda ni separadores de miles.

Importante sobre el formato de los números: estos son recibos colombianos, donde la coma y el punto se usan como separador de MILES, no de decimales. "15,500", "15.500" y "15500" representan el mismo valor: quince mil quinientos. Interpretá el monto como 15500 en los tres casos — no lo dividas por 1000 ni lo trates como si tuviera decimales.

Respondé únicamente con un objeto JSON con exactamente estos campos:
- "comercio": string, nombre del comercio o establecimiento tal como aparece en el recibo.
- "monto": number, monto total pagado (sin símbolo de moneda).
- "fecha": string, fecha de la compra en formato ISO YYYY-MM-DD.
- "categoria": string, una de estas opciones exactas: "comida", "transporte", "entretenimiento", "servicios", "otros".

No incluyas ningún otro texto, explicación ni markdown: solo el objeto JSON.`;

export async function POST(request: Request) {
  let body: { image?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const { image, mediaType } = body;
  if (!image || !mediaType) {
    return NextResponse.json({ error: "Falta la imagen del recibo." }, { status: 400 });
  }
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_PROMPT(today) },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${image}` } },
            { type: "text", text: "Extraé el comercio, monto, fecha y categoría de este recibo." },
          ],
        },
      ],
    });

    const choice = completion.choices[0];

    if (choice?.message.refusal) {
      return NextResponse.json(
        { error: "No se pudo analizar esta imagen. Probá con otra foto o cargá los datos manualmente." },
        { status: 422 }
      );
    }

    const raw = choice?.message.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No se pudieron extraer los datos del recibo. Cargalos manualmente." },
        { status: 422 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "No se pudieron extraer los datos del recibo. Cargalos manualmente." },
        { status: 422 }
      );
    }

    const result = ReceiptSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        { error: "No se pudieron extraer los datos del recibo. Cargalos manualmente." },
        { status: 422 }
      );
    }

    return NextResponse.json({ receipt: result.data });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: "La clave de API de OpenAI es inválida." }, { status: 500 });
    }
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Probá de nuevo en unos segundos." },
        { status: 429 }
      );
    }
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: "Error al contactar el servicio de IA. Probá de nuevo." },
        { status: 502 }
      );
    }
    if (error instanceof OpenAIError && error.message.includes("Missing credentials")) {
      return NextResponse.json(
        {
          error:
            "Falta configurar OPENAI_API_KEY en el servidor. Agregala en .env.local y reiniciá la app.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Error inesperado analizando el recibo." }, { status: 500 });
  }
}
