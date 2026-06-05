---
description: Despliega el kit en un VPS de Hostinger con EasyPanel y protege el panel con Cloudflare Access.
---

# /deploy — Despliegue en producción (Hostinger + EasyPanel + Cloudflare Access)

El despliegue usa **Nixpacks** (sin Docker manual) en EasyPanel sobre un VPS Ubuntu 24.04.

---

## Parte 0 — Repositorio GitHub (ANTES de subir nada)

1. Verifica: `git --version` y `gh auth status`.

2. Tres caminos:
   - **gh logueado**: `gh repo create <nombre-kit> --private --source=. --remote=origin --push`
   - **gh sin login**: `gh auth login` y luego el paso anterior.
   - **Sin gh CLI**: crea el repo manualmente en GitHub y usa un Personal Access Token fine-grained (Contents: Read and Write).

3. **El repositorio debe ser SIEMPRE PRIVADO** — contiene tu configuración de negocio.

4. Verificación de seguridad **OBLIGATORIA** antes del primer commit:
   - Ejecuta `git status --short`.
   - Confirma que **NO aparecen** `.env.local`, `data/`, `auth/` en la lista.
   - El `.gitignore` ya los excluye, pero verifica igualmente.
   - `.env.example` SÍ debe subirse (es una plantilla sin secretos).

---

## Parte 1 — VPS en Hostinger

1. Contrata un VPS **Ubuntu 24.04 con Docker preinstalado**.
   - Recomendado: **KVM 2** (~8 €/mes, 8 GB RAM, 2 vCPU).
   - El cuello de botella real son las **vCPU** (WebSocket + cifrado), no la RAM (~150 MB/agente).

2. Instala EasyPanel:
```bash
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```
   - EasyPanel queda en `http://<IP-del-VPS>:3000` (edición self-hosted Developer, GRATIS).

---

## Parte 2 — Crear la aplicación en EasyPanel

1. En EasyPanel: **Create → App**.
2. Source: **GitHub** → conecta tu cuenta → selecciona el repositorio privado → Branch: `main`.
3. Build Path: `/`
4. Builder: **Nixpacks** (autodetecta por `nixpacks.toml`).

---

## Parte 3 — Volúmenes persistentes (CRÍTICO — antes de Deploy)

Configura estos dos volúmenes ANTES de hacer el primer Deploy. Sin ellos:
- `/app/data` → se pierde la base de datos SQLite en cada redeploy.
- `/app/auth` → se pierde la sesión de WhatsApp en cada redeploy (deberás escanear el QR cada vez).

Esto es la **causa #1 de problemas en producción**. No omitir.

---

## Parte 4 — Variables de entorno en EasyPanel

Añade en EasyPanel → Environment:
- `OPENROUTER_API_KEY` = tu key real
- `OPENROUTER_MODEL` = `openai/gpt-4o-mini` (o el que elijas, nunca `:free`)
- `PORT` = 3000
- (Opcionales) `GOOGLE_SHEETS_WEBHOOK_URL`, `CAL_BOOKING_URL`, `LOG_LEVEL`

**Aviso de seguridad**: las variables se inyectan como `--build-arg` y pueden aparecer en TEXTO PLANO en el log de build de EasyPanel. Si compartes ese log, rota la key inmediatamente.

---

## Parte 5 — Deploy y primer QR

1. Haz clic en **Deploy**. El build tarda 3-5 minutos (compila `better-sqlite3` nativo + Next.js).
2. Abre el dominio que EasyPanel asignó a tu app.
3. Escanea el QR con WhatsApp.

---

## Parte 6 — Cloudflare Access (OBLIGATORIO — paso bloqueante)

**No dejes el panel público.** Cualquiera podría ver tus conversaciones de clientes.

1. Entra en **Cloudflare Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Application domain: `panel.tu-dominio.com` (o el subdominio que uses).
3. Policy: **Allow** → Include = **Emails** (lista tus emails autorizados) o **Emails ending in** (tu dominio corporativo).
4. Identity provider recomendado: **Email One-Time PIN** (sin configuración OAuth, funciona de inmediato).

Alternativa si usas `*.easypanel.host` sin dominio propio: Basic Auth en EasyPanel.

5. **Prueba SIEMPRE** en ventana de incógnito con un email NO autorizado → debe mostrar "Access denied".

---

## Redeploy automático

Cada `git push` a `main` dispara un redeploy en EasyPanel. Flujo normal:
1. `git add . && git commit -m "actualizar prompt"`
2. `git push`
3. EasyPanel redespliega en ~2-3 minutos.

---

## Nota sobre Nixpacks (futuro)

Nixpacks está actualmente en modo mantenimiento (Railway lanzó Railpack como sucesor). Si en 12-18 meses el build falla sin causa aparente, migra a un `Dockerfile` — EasyPanel lo soporta perfectamente. Esta nota es para que no te sorprenda si ocurre.
