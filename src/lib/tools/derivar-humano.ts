import { setMode } from "../db.js";

export const derivarHumanoDefinition = {
  type: "function" as const,
  function: {
    name: "derivarHumano",
    description: "Cambia la conversación a Modo Humano para que un operador la atienda. Usar cuando el lead pide precios específicos, casos complejos, quejas, o algo fuera de tu alcance.",
    parameters: {
      type: "object" as const,
      properties: {
        razon: { type: "string", description: "Por qué se deriva. Útil para el humano que retomará la conversación." },
      },
      required: ["razon"],
      // conversationId NO va en el schema; lo inyecta executeTool
    },
  },
};

interface DerivarHumanoArgs {
  razon: string;
  conversationId?: number;
}

export async function derivarHumano(args: DerivarHumanoArgs): Promise<Record<string, unknown>> {
  if (!args.conversationId) {
    return {
      ok: false,
      message: "No se pudo derivar: falta conversationId (bug del wrapper de tools)",
    };
  }

  setMode(args.conversationId, "HUMAN");

  return {
    ok: true,
    message: `Conversación derivada a HUMAN. Razón: ${args.razon}`,
    instruccion:
      "Responde al usuario con algo como: 'Te paso con una persona del equipo, te escribe enseguida.' No respondas más en esta conversación.",
  };
}
