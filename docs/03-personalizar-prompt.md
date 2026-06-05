# 03 — Personalizar el prompt del agente

## Cómo el agente conoce tu negocio

El archivo `prompts/negocio.md` es el "manual de instrucciones" que el agente IA recibe antes de cada conversación. Sin él, el agente usa un prompt genérico.

## La forma más fácil: `/personaliza`

Escribe `/personaliza` en Claude Code. Te hace 6 preguntas y crea el archivo automáticamente.

## Editar manualmente

Copia `prompts/negocio.example.md` a `prompts/negocio.md` y edítalo:

```bash
cp prompts/negocio.example.md prompts/negocio.md
```

El formato requerido:

```markdown
---
nombre: Tu Negocio
actividad: Una frase
generado: 2025-01-15T10:00:00Z
---

# Datos del negocio

## Nombre
Tu Negocio

## A qué se dedica
Una frase clara sobre qué haces.

## Propuesta de valor
Qué te diferencia de la competencia.

## Preguntas de calificación al lead
- ¿Cuánto factura al mes tu negocio?
- ¿Tienes equipo o eres autónomo?

## Criterios de lead bueno vs malo
**BUENO:** Empresa con >5k€/mes, tiene presupuesto, urgencia real.

**MALO:** Autónomo recién empezado, busca solución gratuita.

## Acción cuando el lead encaja
Enviar link de Cal.com para agendar diagnóstico:
https://cal.com/tu-usuario/diagnostico
```

## Aplicar cambios

El prompt se lee del disco en cada conversación nueva, pero el sistema prompt del LLM se construye al inicio de cada `generateReply`. Los cambios se aplican al siguiente mensaje entrante.

Si modificas el archivo mientras el bot está corriendo, los cambios se aplican en el siguiente mensaje. No necesitas reiniciar (pero si usas `/personaliza`, escribe el flag `data/.restart` para que el bot recargue el estado).

## Los ejemplos en `prompts/ejemplos/`

Hay 3 ejemplos listos para usar como base:
- `agencia-ia.md` — agencia de automatización con IA
- `ecommerce.md` — tienda online de software
- `infoproducto.md` — vendedor de curso online

Copia el que más se parezca a tu negocio y adáptalo.
