# 06 — Despliegue en Hostinger VPS + EasyPanel

## Infraestructura recomendada

| Componente | Opción |
|---|---|
| VPS | Hostinger KVM 2 (~8 €/mes, 8 GB RAM, 2 vCPU, 100 GB SSD) |
| OS | Ubuntu 24.04 con Docker preinstalado |
| Panel de despliegue | EasyPanel (self-hosted, edición Developer — gratis) |
| Builder | Nixpacks (autodetectado, sin Dockerfile) |

El cuello de botella real son las **vCPU** (WebSocket cifrado), no la RAM (~150 MB por agente activo).

## Paso 1 — Preparar el repositorio

```bash
# Desde tu proyecto local
gh repo create whatsapp-ai-agent-kit --private --source=. --remote=origin --push
```

**Verificación de seguridad antes del push:**
```bash
git status --short
```
Confirma que NO aparecen `.env.local`, `data/`, `auth/`. El `.gitignore` ya los excluye.

`.env.example` SÍ se sube — es la plantilla sin secretos.

## Paso 2 — Contratar VPS Hostinger

1. Hostinger → VPS → KVM 2 → Ubuntu 24.04 (con Docker preinstalado).
2. Guarda la IP del VPS.

## Paso 3 — Instalar EasyPanel

Conéctate al VPS por SSH y ejecuta:

```bash
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

EasyPanel queda disponible en `http://<IP-del-VPS>:3000`.

## Paso 4 — Crear la aplicación

1. EasyPanel → **Create → App**
2. Source: **GitHub** → conecta tu cuenta → selecciona el repo → Branch: `main`
3. Build Path: `/`
4. Builder: **Nixpacks**

## Paso 5 — Volúmenes persistentes (CRÍTICO)

**Configura esto ANTES de hacer Deploy.** Sin estos volúmenes, perderás datos en cada redeploy.

En EasyPanel → tu app → **Mounts**:

| Container Path | Descripción |
|---|---|
| `/app/data` | Base de datos SQLite con todas las conversaciones |
| `/app/auth` | Sesión de WhatsApp (evita re-escanear QR en cada deploy) |

Estos son los volúmenes que más fallan en producción. No saltarte este paso.

## Paso 6 — Variables de entorno

En EasyPanel → tu app → **Environment**:

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=3000
LOG_LEVEL=info
```

**Atención:** Las variables aparecen en texto plano en los logs de build de EasyPanel. Si compartes esos logs, rota la API key.

## Paso 7 — Deploy

Haz clic en **Deploy**. El proceso dura 3-5 minutos:
1. Nixpacks instala Node 22 y dependencias del sistema (python3, gcc, gnumake para better-sqlite3).
2. `npm ci --include=dev` instala todas las dependencias.
3. `npm run build` genera el build de Next.js.
4. `npm run start:all` arranca bot + panel.

## Paso 8 — Primer QR en producción

1. Abre el dominio que EasyPanel asignó a tu app.
2. Escanea el QR con WhatsApp.
3. El estado pasa a `connected` y el panel carga.

## Paso 9 — Proteger con Cloudflare Access

**OBLIGATORIO antes de que el panel tenga conversaciones reales.** Ver `docs/05-cloudflare-access.md`.

## Redeploy automático

Cada `git push` a `main` dispara un redeploy automático en EasyPanel:

```bash
# Actualizar el agente
git add prompts/negocio.md
git commit -m "actualizar prompt del negocio"
git push
```

EasyPanel redespliega en ~2-3 minutos. Las conversaciones y la sesión de WhatsApp se mantienen gracias a los volúmenes.

---

## Nota sobre Nixpacks

Nixpacks está actualmente en modo mantenimiento (Railway lanzó Railpack como sucesor en 2025). Si en 12-18 meses el build falla sin causa aparente, migra a un `Dockerfile` — EasyPanel lo soporta. El equivalente en Dockerfile sería:

```dockerfile
FROM node:22-slim
# instalar python3 gcc make para better-sqlite3
RUN apt-get update && apt-get install -y python3 gcc make
WORKDIR /app
COPY . .
RUN npm ci --include=dev && npm run build
CMD ["npm", "run", "start:all"]
```
