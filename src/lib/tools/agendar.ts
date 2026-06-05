export const agendarDefinition = {
  type: "function" as const,
  function: {
    name: "agendar",
    description: "Genera un link de agendamiento personalizado para que el lead reserve una llamada. Solo usar si calificar devolvió score >= 7.",
    parameters: {
      type: "object" as const,
      properties: {
        nombre: { type: "string", description: "Nombre del lead" },
        email: { type: "string", description: "Email del lead (opcional)" },
      },
      required: ["nombre"],
    },
  },
};

interface AgendarArgs {
  nombre: string;
  email?: string;
  conversationId?: number;
}

export async function agendar(args: AgendarArgs): Promise<Record<string, unknown>> {
  const baseUrl = process.env.CAL_BOOKING_URL;
  if (!baseUrl?.trim()) {
    return { ok: false, message: "Tool no configurada: falta CAL_BOOKING_URL" };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("name", args.nombre);
  if (args.email) url.searchParams.set("email", args.email);

  return {
    ok: true,
    link: url.toString(),
    message: `Envía este link al lead para agendar: ${url.toString()}`,
  };
}
