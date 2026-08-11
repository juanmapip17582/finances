import { z } from "zod";

export const CATEGORIAS = [
  "comida",
  "transporte",
  "entretenimiento",
  "servicios",
  "otros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const ReceiptSchema = z.object({
  comercio: z.string().describe("Nombre del comercio o establecimiento tal como aparece en el recibo."),
  monto: z.number().describe("Monto total pagado, como número (sin símbolo de moneda)."),
  fecha: z
    .string()
    .describe("Fecha de la compra en formato ISO YYYY-MM-DD. Si no aparece, usar la fecha de hoy."),
  categoria: z
    .enum(CATEGORIAS)
    .describe("Categoría del gasto que mejor describe la compra."),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  comida: "Comida",
  transporte: "Transporte",
  entretenimiento: "Entretenimiento",
  servicios: "Servicios",
  otros: "Otros",
};
