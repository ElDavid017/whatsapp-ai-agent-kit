# Errores conocidos y soluciones

Registro de errores documentados durante el desarrollo. Consultar antes de improvisar.

---

## #1 — Código 405: versión de WhatsApp desactualizada

**Síntoma**: La conexión se cierra con código 405.
**Causa**: Baileys intenta conectar con una versión interna de WhatsApp que el servidor ya no acepta.
**Solución**: `fetchLatestBaileysVersion()` obtiene la versión actual del servidor al arrancar. El kit ya lo hace. Si persiste, actualiza `@whiskeysockets/baileys`.

---

## #2 — Código 440: connectionReplaced / browser fingerprint

**Síntoma**: Bucle de reconexiones con código 440.
**Causa**: Otro cliente se conectó con el mismo fingerprint, o el fingerprint no es un browser reconocido.
**Solución**: El kit usa `Browsers.macOS('Desktop')` + backoff de 15s (no 5s) para este código. Si sigue en loop, borra `auth/` y genera nuevo QR.

---

## #3 — Código 515: señal de pairing

**Síntoma**: Aparece código 515 en los logs.
**Causa**: NO es un error. Es la señal de que el pairing con WhatsApp se completó correctamente.
**Solución**: Ninguna. Ignorar.

---

## #4 — Bot no recibe mensajes de algunos contactos

**Síntoma**: El bot se conecta, pero ciertos números no generan respuesta.
**Causa**: Desde 2025, WhatsApp despliega identificadores `@lid` para algunos usuarios en lugar de `@s.whatsapp.net`.
**Solución**: El handler acepta ambos dominios. Si tienes una versión anterior del kit, añade `|| remoteJid.endsWith('@lid')` en la condición de filtro.

---

## #5 — `SQLITE_BUSY: database is locked`

**Síntoma**: Error durante `npm run build` o al arrancar múltiples procesos.
**Causa**: `next build` lanza ~10 workers que importan las rutas API simultáneamente.
**Solución**: `db.ts` usa inicialización perezosa (lazy). La conexión a SQLite solo se abre en la primera llamada real a una función, no al importar el módulo. Si ves este error, revisa que no hayas añadido código con side-effects al importar.

---

## #6 — Código 401: loggedOut

**Síntoma**: La sesión se cierra con código 401.
**Causa**: WhatsApp cerró sesión (vinculación revocada desde el móvil, o sesión caducada).
**Solución**: El bot NO reconecta automáticamente (correcto). Borra `auth/` manualmente o usa el botón Desconectar en el panel, y escanea el QR de nuevo.

---

## #7 — El panel web no muestra el QR aunque el bot arrancó

**Síntoma**: El bot genera QR en terminal pero el panel muestra spinner indefinidamente.
**Causa**: Race condition — el panel hizo la primera petición antes de que el bot escribiera en `connection_state`.
**Solución**: El endpoint `/api/connection/status` muestra el QR tanto con `status='qr'` como con `status='connecting'` (si hay `qr_string`). No quitar esa condición.

---

## #8 — `better-sqlite3` falla al compilar (Windows)

**Síntoma**: `npm install` falla con errores de `node-gyp` o `MSBuild`.
**Causa**: `better-sqlite3` requiere compilación nativa con C++ en Windows.
**Solución**: Instala Visual Studio Build Tools (componente "Desarrollo para el escritorio con C++"). Luego: `npm rebuild better-sqlite3`.

---

## #9 — Modelo `:free` → error 429

**Síntoma**: El agente falla con "429 Too Many Requests" o deja de responder.
**Causa**: Los modelos `:free` de OpenRouter están saturados y tienen límites muy bajos.
**Solución**: Cambiar `OPENROUTER_MODEL` en `.env.local` a un modelo de pago (ej. `openai/gpt-4o-mini`). El coste es mínimo (~0,001€/conversación).

---

## #10 — El agente responde pero la tool `guardarLead` no hace nada

**Síntoma**: El modelo llama a `guardarLead` pero no llega nada a Google Sheets.
**Causa**: `GOOGLE_SHEETS_WEBHOOK_URL` está vacía en `.env.local`.
**Solución**: La tool devuelve `{ok:false, message:"Tool no configurada..."}` y el modelo lo gestiona. Para activarla: sigue `docs/04-configurar-tools.md`.

---

## #11 — El panel muestra mensajes pero el bot no responde en modo IA

**Síntoma**: Los mensajes aparecen en el panel, modo es IA, pero no hay respuesta automática.
**Causa 1**: La conversación fue derivada a HUMAN por la tool `derivarHumano`. Verifica el modo en la UI.
**Causa 2**: `OPENROUTER_API_KEY` inválida o expirada. Ejecuta `npm run doctor`.
**Causa 3**: El modelo devuelve contenido vacío. Revisa los logs del bot.

---

## #12 — El build de Nixpacks falla con error de `*.tsbuildinfo`

**Síntoma**: El build falla en el paso de compilación con un error de TypeScript que no ocurre localmente.
**Causa**: El fichero `*.tsbuildinfo` (caché incremental de TypeScript) se subió al repositorio. Nixpacks lo interpreta como caché válida pero la ruta absoluta dentro es diferente.
**Solución**: Añadir `*.tsbuildinfo` al `.gitignore` y hacer commit. El `.gitignore` del kit ya lo incluye; verificar que no se haya eliminado.

---

## #13 — `npm install` falla con `ERR_INVALID_ARG_TYPE` o `rollback`

**Síntoma**: La instalación falla con errores de `reify`, `rollback`, o `ERR_INVALID_ARG_TYPE`.
**Causa**: `node_modules` corrupto de una instalación anterior fallida.
**Solución**: Borra `node_modules/` completamente y reinstala:
```bash
rimraf node_modules
npm install
```

---

## #14 — Mensajes duplicados en el panel

**Síntoma**: Los mensajes del operador aparecen duplicados (una vez al enviar, otra al polling).
**Causa**: La API `POST /api/messages/{id}` hace `insertMessage` inmediatamente (visible en DB), y el polling de mensajes lo recoge en el siguiente tick.
**Explicación**: Es comportamiento correcto. El mensaje se inserta en DB y se muestra al instante; el loop de outbox lo envía a WhatsApp en ~2s.

---

## #15 — WhatsApp pide QR cada vez que se redespliega en EasyPanel

**Síntoma**: En cada `git push`, al redeplegar, WhatsApp pide escanear el QR de nuevo.
**Causa**: El volumen `/app/auth` no está configurado en EasyPanel.
**Solución**: Configura el volumen persistente `/app/auth` en EasyPanel → Volumes ANTES del primer deploy. Ver `docs/06-deploy-hostinger.md`.
