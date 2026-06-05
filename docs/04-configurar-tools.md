# 04 — Configurar las herramientas del agente

El agente tiene 4 herramientas. Dos requieren configuración externa, dos funcionan siempre.

## Herramientas siempre activas

### `calificar`
Evalúa al lead con 5 criterios booleanos y devuelve un score del 0 al 10. Si score ≥ 7, el agente puede agendar.

No requiere configuración. Los pesos están en `src/lib/tools/calificar.ts` (comentados con `// TODO` para que los ajustes).

### `derivarHumano`
Cambia la conversación a Modo Humano para que la atienda una persona. Se activa automáticamente cuando el lead pide precios específicos, plantea casos complejos, o la consulta está fuera de alcance.

No requiere configuración.

---

## Herramientas opcionales (requieren configuración)

### `guardarLead` — Google Sheets

Guarda datos del lead (nombre, teléfono, negocio, facturación, dolor) en una hoja de Google Sheets.

**Configuración:**

1. Abre Google Sheets y crea una hoja con estas columnas:
   `nombre | telefono | negocio | facturacion | dolor | fecha`

2. En Google Sheets → Extensiones → Apps Script, pega este código:
```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.appendRow([
    data.nombre, data.telefono, data.negocio,
    data.facturacion, data.dolor, data.fecha
  ]);
  return ContentService.createTextOutput('OK');
}
```

3. Despliega como **Web App** (acceso: cualquiera) y copia la URL.

4. Añade en `.env.local`:
```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/TU_ID/exec
```

5. Reinicia el bot.

---

### `agendar` — Cal.com o Calendly

Genera un link de agendamiento personalizado con el nombre del lead pre-rellenado.

**Configuración:**

1. Crea un tipo de evento en Cal.com o Calendly (ej: "Diagnóstico 30 min").

2. Copia la URL directa del evento:
   - Cal.com: `https://cal.com/tu-usuario/diagnostico`
   - Calendly: `https://calendly.com/tu-usuario/diagnostico`

3. Añade en `.env.local`:
```
CAL_BOOKING_URL=https://cal.com/tu-usuario/diagnostico
```

4. Reinicia el bot.

**Cómo funciona:** La herramienta añade `?name=NombreLead` al link. El lead abre el link y ya tiene su nombre rellenado.

---

## Verificar que las tools funcionan

Envía un mensaje al agente desde otro móvil que active la calificación y el agendamiento. Revisa los logs del bot (`npm run start:bot`) para ver si las tools se ejecutan correctamente.

Si una tool devuelve `{ok: false, message: "Tool no configurada..."}`, el modelo lo gestiona graciosamente (no falla, simplemente no ejecuta la acción).
