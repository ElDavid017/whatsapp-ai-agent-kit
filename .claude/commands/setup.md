---
description: Primera instalación del kit. Instala dependencias, configura la API key de OpenRouter y conecta WhatsApp.
---

# /setup — Primera instalación

Ejecuta las siguientes fases en orden. No pases a la siguiente sin completar la anterior.

---

## Fase A — Validación silenciosa del sistema

Antes de preguntar nada, comprueba en silencio:

1. `node --version` → debe ser ≥ 20. Si no lo es, dile al usuario que instale Node 22 via nvm y detente.
2. `npm --version` → debe existir.
3. Espacio en disco: usa `fs.statfsSync(process.cwd())` para calcular MB libres. Si hay menos de 500 MB, advierte.
4. Detecta el SO con `process.platform` (para ajustar comandos en Windows).

Si todo OK, pasa a la Fase A.5 sin mencionar los checks.

---

## Fase A.5 — Saludo

- Si NO existe `data/messages.db` ni `auth/`: bienvenida como primera vez.
- Si ya existen: avisa de que el proyecto ya fue configurado y pregunta si quiere reinstalar o continuar.

---

## Fase B — Instalación de dependencias

1. Ejecuta `npm install`.
   - Si falla con `ERR_INVALID_ARG_TYPE`, `reify`, o `rollback`: NO es un problema de dependencias. Es `node_modules` corrupto. Borra `node_modules/` y reinstala. Ver `errores-sesion.md #13`.
   - En Windows con `better-sqlite3`: puede necesitar Visual Studio Build Tools. Si el error menciona `node-gyp` o `MSBuild`, ejecuta `npm rebuild better-sqlite3`.

2. Valida: ejecuta `npm run typecheck`. Si hay errores de TypeScript, muéstralos y detente.

3. Ejecuta `npm run build` (obligatorio: `start:all` usa `next start` en modo producción, no `dev`).

---

## Fase C — API Key de OpenRouter

1. Pregunta: "¿Tienes cuenta en OpenRouter? Si no, la creamos ahora en https://openrouter.ai"
2. Pide la API key: "Pega tu API key de OpenRouter (empieza por sk-or-v1-...)"
3. **NUNCA guardes la key sin validar.** Antes de escribir a `.env.local`, llama a `validateApiKey()` (importa `src/lib/openrouter.ts`).
   - Si devuelve `{ok: false}`: "La key parece inválida (error: X). Comprueba que la copiaste completa."
   - Si devuelve `{ok: true}`: continúa.
4. Crea o edita `.env.local`:
   - Si no existe: copia desde `.env.example`.
   - Sustituye la línea `OPENROUTER_API_KEY=` con el valor real.
   - **No borres ni modifiques otras variables** que ya existieran.
5. Pregunta por el modelo (opcional): sugiere `openai/gpt-4o-mini`. Si el usuario elige un modelo `:free`, recházalo con explicación.

---

## Fase D — Conexión WhatsApp

1. Arranca el bot y el panel: `npm run start:all` en background.
2. Di al usuario: "Abre http://localhost:3000 en tu navegador para escanear el QR."
3. Haz polling de la base de datos `data/messages.db` → tabla `connection_state` (id=1) cada 3 segundos, máximo 2 minutos:
   - `status = 'qr'` o `'connecting'` → sigue esperando (el QR está disponible en el panel).
   - `status = 'connected'` → ¡listo! Pasa a la Fase E.
   - Timeout (2 min) sin conectar → sugiere `npm run doctor` y revisa `errores-sesion.md`.
4. Fallback: si `start:all` falla, intenta `npm run start:bot` en un proceso y `npm run dev` en otro.

---

## Fase E — Prueba

1. Indica al usuario: "Escríbete desde **otro** móvil (no desde el número vinculado) con algo como 'hola'."
2. Explica por qué: los mensajes del propio número vinculado se ignoran intencionalmente.
3. Nota sobre WhatsApp 2025+: algunos números usan identificadores `@lid`. El kit los soporta nativamente.
4. Si el agente responde → ¡todo listo! Sugiere `/personaliza` para configurar el prompt del negocio.
