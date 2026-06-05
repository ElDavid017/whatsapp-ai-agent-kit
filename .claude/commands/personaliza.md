---
description: Configura el prompt del negocio del agente IA. Hace preguntas una a una y escribe prompts/negocio.md.
---

# /personaliza — Configurar el agente para tu negocio

El agente IA usa `prompts/negocio.md` para conocer el negocio. Este comando lo crea o actualiza conversando.

**Regla fundamental:** Haz UNA pregunta a la vez. Nunca las 6 de golpe.

---

## Paso 0 — Comprobar si ya existe negocio.md

Si `prompts/negocio.md` ya existe:
- Ofrece 3 opciones:
  1. Sobrescribir completamente (empezar de cero)
  2. Editar solo una sección
  3. Cancelar

Si elige "editar puntual": pregunta qué sección quiere cambiar y salta directamente a esa.

---

## Las 6 preguntas (UNA A LA VEZ)

Guarda internamente las respuestas con estas claves:

1. **nombre** → "¿Cómo se llama tu negocio o proyecto?"
2. **actividad** → "¿A qué se dedica exactamente? (en 1-2 frases)"
3. **propuesta_valor** → "¿Por qué elegirte a ti y no a otro? ¿Qué te hace diferente?"
4. **preguntas_calificacion** → "¿Qué 2-4 preguntas haría tu mejor comercial para saber si un lead encaja? (ej: ¿cuánto factura? ¿tiene equipo?)"
   - Si da menos de 2 preguntas: pide más. "¿Alguna pregunta más que use tu equipo de ventas?"
5. **criterios_lead** → "Descríbeme tu lead ideal y el que definitivamente NO encaja. (ej: BUENO: empresa con >5k/mes de facturación, MALO: autónomo recién empezado)"
6. **accion_lead** → "Cuando el lead encaja, ¿qué acción quieres que tome el agente? Opciones: a) Compartir link de Cal.com/Calendly, b) Mandar a una página de pago, c) Derivar a un humano del equipo"
   - Si elige Cal.com/Calendly: "Pega el link directo de tu agenda (ej: https://cal.com/tu-usuario/diagnostico)" → guarda en `CAL_BOOKING_URL` en `.env.local`.

---

## Paso final — Resumen y confirmación

Antes de escribir nada, muestra un resumen de los 6 puntos y pregunta: "¿Todo correcto? Escribo el fichero."

Si confirma:

1. Crea `prompts/negocio.md` con este formato exacto:
```markdown
---
nombre: {nombre}
actividad: {actividad}
generado: {ISO timestamp}
---

# Datos del negocio

## Nombre
{nombre}

## A qué se dedica
{actividad}

## Propuesta de valor
{propuesta_valor}

## Preguntas de calificación al lead
{preguntas_calificacion formateadas como lista}

## Criterios de lead bueno vs malo
**BUENO:** {criterios buenos}

**MALO:** {criterios malos}

## Acción cuando el lead encaja
{accion_lead — con link si aplica}
```

2. **Valida** que el fichero escrito contiene las 6 secciones H2.

3. Reinicia el bot escribiendo el flag `data/.restart` (el proceso del bot lo detecta y se reconecta generando nuevo QR con el prompt actualizado).

4. Informa al usuario: "El agente ya conoce tu negocio. El siguiente mensaje que recibas irá con tu prompt personalizado."
