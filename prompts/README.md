# prompts/

Este directorio contiene el "cerebro" del agente IA.

## Archivos

| Archivo | Descripción |
|---|---|
| `negocio.md` | **El prompt activo de tu negocio.** Creado por `/personaliza`. Está en `.gitignore` (no se versiona). |
| `negocio.example.md` | Plantilla de ejemplo. Cópiala para empezar manualmente. |
| `ejemplos/agencia-ia.md` | Ejemplo completo: agencia de automatización con IA |
| `ejemplos/ecommerce.md` | Ejemplo completo: tienda online de software |
| `ejemplos/infoproducto.md` | Ejemplo completo: vendedor de curso online |

## Cómo el prompt llega al agente

`src/lib/system-prompt.ts` lee `prompts/negocio.md` al inicio de cada llamada al LLM. El contenido se inyecta como mensaje de sistema (rol `system`) antes del historial de la conversación.

Si `negocio.md` no existe, se usa un prompt genérico que dice al agente que no tiene negocio configurado.

## Formas de crear/cambiar `negocio.md`

**Opción 1 — Conversacional (recomendada):**
```
/personaliza
```
Claude Code te hace las preguntas y escribe el archivo.

**Opción 2 — Manual:**
Copia `negocio.example.md` a `negocio.md` y edítalo.

**Opción 3 — Basado en un ejemplo:**
Copia uno de los ejemplos de `ejemplos/` a `negocio.md` y adáptalo.

## Aplicar cambios

Los cambios en `negocio.md` se aplican en el siguiente mensaje entrante (el prompt se lee del disco en cada llamada). No necesitas reiniciar el bot, aunque si usas `/personaliza` escribirá el flag `data/.restart` para asegurarse.

## Formato requerido

El archivo debe tener exactamente estas 6 secciones H2:

1. `## Nombre`
2. `## A qué se dedica`
3. `## Propuesta de valor`
4. `## Preguntas de calificación al lead`
5. `## Criterios de lead bueno vs malo`
6. `## Acción cuando el lead encaja`

Si falta alguna, el agente puede no funcionar correctamente.
