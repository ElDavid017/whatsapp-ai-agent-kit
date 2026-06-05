export const calificarDefinition = {
  type: "function" as const,
  function: {
    name: "calificar",
    description: "Califica al lead según criterios clave. Devuelve un score del 0 al 10 y si califica para agendar llamada (score >= 7).",
    parameters: {
      type: "object" as const,
      properties: {
        tieneNegocioActivo: { type: "boolean", description: "¿Tiene un negocio activo funcionando?" },
        facturaMasDe5kMes: { type: "boolean", description: "¿Factura más de 5.000€/mes?" },
        dolorEncajaConPropuesta: { type: "boolean", description: "¿Su dolor o necesidad encaja con lo que ofrecemos?" },
        urgenciaAlta: { type: "boolean", description: "¿Tiene urgencia alta para resolver su problema?" },
        presupuestoConfirmado: { type: "boolean", description: "¿Ha confirmado que tiene presupuesto disponible?" },
      },
      required: [],
    },
  },
};

interface CalificarArgs {
  tieneNegocioActivo?: boolean;
  facturaMasDe5kMes?: boolean;
  dolorEncajaConPropuesta?: boolean;
  urgenciaAlta?: boolean;
  presupuestoConfirmado?: boolean;
  conversationId?: number;
}

export async function calificar(args: CalificarArgs): Promise<Record<string, unknown>> {
  // TODO: los pesos son orientativos para agencia/freelance — ajusta según tu negocio
  let score = 0;
  if (args.tieneNegocioActivo) score += 3;
  if (args.facturaMasDe5kMes) score += 3;
  if (args.dolorEncajaConPropuesta) score += 2;
  if (args.urgenciaAlta) score += 1;
  if (args.presupuestoConfirmado) score += 1;

  const califica = score >= 7;
  return {
    ok: true,
    score,
    califica,
    mensaje: califica
      ? "Lead cualificado. Procede a agendar llamada."
      : "Lead NO cualificado. Responde cordialmente sin agendar.",
  };
}
