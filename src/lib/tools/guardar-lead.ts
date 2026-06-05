export const guardarLeadDefinition = {
  type: "function" as const,
  function: {
    name: "guardarLead",
    description: "Guarda los datos de un lead en Google Sheets via webhook. Úsala en cuanto tengas nombre + teléfono + algún dato del negocio.",
    parameters: {
      type: "object" as const,
      properties: {
        nombre: { type: "string", description: "Nombre del lead" },
        telefono: { type: "string", description: "Teléfono del lead (formato internacional)" },
        negocio: { type: "string", description: "A qué se dedica" },
        facturacion: { type: "string", description: "Rango de facturación si lo ha dicho" },
        dolor: { type: "string", description: "Dolor o necesidad principal" },
      },
      required: ["nombre", "telefono"],
    },
  },
};

interface GuardarLeadArgs {
  nombre: string;
  telefono: string;
  negocio?: string;
  facturacion?: string;
  dolor?: string;
  conversationId?: number;
}

export async function guardarLead(args: GuardarLeadArgs): Promise<Record<string, unknown>> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl?.trim()) {
    return { ok: false, message: "Tool no configurada: falta GOOGLE_SHEETS_WEBHOOK_URL" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: args.nombre,
        telefono: args.telefono,
        negocio: args.negocio ?? "",
        facturacion: args.facturacion ?? "",
        dolor: args.dolor ?? "",
        fecha: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      return { ok: true, message: "Lead guardado en Google Sheets" };
    } else {
      return { ok: false, message: `Webhook respondió ${res.status}` };
    }
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
