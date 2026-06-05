# Guía completa: de cero a producción

Esta guía cubre las 4 fases de configuración y despliegue del WhatsApp AI Agent Kit.

---

## Fase 1 — Instalar y conectar (local)

### Requisitos previos
- Node.js 22 (instala con `nvm install 22`)
- VS Code con extensión Claude Code
- Cuenta en OpenRouter (https://openrouter.ai)
- Un número de WhatsApp disponible para vincular

### Pasos
1. Abre la carpeta del proyecto en VS Code.
2. Escribe `/setup` en Claude Code.
3. Claude instala las dependencias, te pide la API key y conecta WhatsApp via QR.
4. Prueba enviando "hola" desde **otro** móvil (no el vinculado).

### Verificar que funciona
- El agente debe responder en menos de 5 segundos.
- El panel en `http://localhost:3000` muestra la conversación.
- El modo por defecto es **IA** (respuesta automática).

---

## Fase 2 — Entrenar el agente con tu negocio

### El prompt de negocio
El archivo `prompts/negocio.md` es el "cerebro" del agente. Contiene todo lo que el agente sabe de tu negocio: quién eres, qué vendes, a quién le vendes y cómo calificar leads.

### Pasos
1. Escribe `/personaliza` en Claude Code.
2. Responde las 6 preguntas (una a la vez).
3. Confirma el resumen y Claude escribe el archivo.
4. El bot se reinicia automáticamente con el nuevo prompt.

### Para editar manualmente
Si prefieres editar directamente, sigue el formato de `prompts/negocio.example.md`. Luego escribe `data/.restart` para que el bot cargue el nuevo prompt.

---

## Fase 3 — Desplegar en producción (24/7)

### Infraestructura recomendada
- **VPS**: Hostinger KVM 2 (~8 €/mes, Ubuntu 24.04 con Docker)
- **Panel de despliegue**: EasyPanel (gratis, self-hosted)
- **Build**: Nixpacks (autodetectado, sin Dockerfile)
- **Seguridad del panel**: Cloudflare Access (Zero Trust, gratis hasta 50 usuarios)

### Pasos
1. Escribe `/deploy` en Claude Code.
2. Claude crea el repositorio GitHub (privado), configura EasyPanel y te guía por la protección con Cloudflare.

### Puntos críticos
- **Configura los volúmenes** `/app/data` y `/app/auth` ANTES del primer deploy.
- **Cloudflare Access es OBLIGATORIO** — nunca dejes el panel público.
- Las variables de entorno en EasyPanel aparecen en texto plano en los logs — rota la key si compartes logs.

---

## Fase 4 — Operación y mantenimiento

### Operación diaria
- Abre el panel web para ver conversaciones nuevas.
- Usa **Modo Humano** para conversaciones que requieren atención personal.
- Vuelve a **Modo IA** cuando termines para que el agente retome.

### Actualizar el prompt del agente
1. Edita `prompts/negocio.md` (o usa `/personaliza`).
2. Haz `git commit && git push`.
3. EasyPanel redespliega automáticamente.
4. El nuevo prompt se carga en el próximo mensaje.

### Añadir Google Sheets para leads
1. Sigue `docs/04-configurar-tools.md`.
2. Añade `GOOGLE_SHEETS_WEBHOOK_URL` en `.env.local` (y en EasyPanel si es producción).
3. Reinicia el bot.

### Diagnóstico de problemas
```bash
npm run doctor   # Diagnóstico completo
npm run check    # Verificación rápida del sistema
```

Consulta `errores-sesion.md` para soluciones a los 15 errores más comunes.

### Redeploy manual
Si algo falla en producción y necesitas forzar un redeploy:
1. Haz cualquier cambio trivial (ej. añade un espacio en `README.md`).
2. `git commit && git push`.
3. EasyPanel redespliega en ~2 minutos.

---

## Preguntas frecuentes avanzadas

**¿Puedo cambiar el modelo de IA?**
Sí: cambia `OPENROUTER_MODEL` en `.env.local`. Reinicia el bot. Nunca uses modelos `:free`.

**¿Cómo ajusto el umbral de calificación?**
Edita `src/lib/tools/calificar.ts` — el umbral es 7 y los pesos están comentados con `// TODO`.

**¿Puedo añadir más herramientas al agente?**
Sí: crea un fichero nuevo en `src/lib/tools/`, añade la definición y el handler, e impórtalo en `index.ts`.

**¿El agente puede manejar grupos de WhatsApp?**
No intencionalmente — los grupos se filtran en el handler. Es una decisión de diseño para mantener el foco en leads 1:1.

**¿Qué pasa con los mensajes de audio/imagen?**
Se ignoran silenciosamente. Solo se procesan mensajes de texto.
