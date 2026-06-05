# WhatsApp AI Agent Kit

Kit llave en mano para montar un agente de IA conectado a WhatsApp con panel web de control.

Pensado para **dueños de negocio, freelancers y agencias** que quieren atender y captar clientes por WhatsApp con IA — sin programar.

---

## Qué hace

- Conecta un número de WhatsApp por QR (vía Baileys, oficial-ish Web API).
- Responde automáticamente con un LLM (OpenRouter) que conoce tu negocio.
- 4 herramientas del agente: guardar lead, calificar lead, agendar llamada, derivar a humano.
- Panel web tipo bandeja de entrada: lista de conversaciones + chat, toggle Modo IA / Humano, envío manual.
- Despliegue 24/7 en VPS (Hostinger + EasyPanel + Nixpacks).
- Panel protegido por Cloudflare Access (sin contraseñas expuestas).

---

## Requisitos

- Node.js ≥ 20 (recomendado: 22)
- Cuenta en [OpenRouter](https://openrouter.ai) (~0,001 € por conversación con gpt-4o-mini)
- Claude Code + Claude Pro (~20 $/mes) para el onboarding conversacional **o** usar `npm run wizard` como fallback
- VPS Ubuntu 24.04 con Docker para despliegue 24/7 (opcional — funciona local también)

---

## Los 3 pasos

```
/setup        → instala, configura y conecta WhatsApp
/personaliza  → entrena el agente con los datos de tu negocio
/deploy       → despliega en producción 24/7
```

Lee [EMPIEZA-AQUI.md](EMPIEZA-AQUI.md) para empezar.

---

## Estructura del proyecto

```
src/
  app/          → Next.js panel web (App Router)
  components/   → UI: bandeja de entrada, chat, controles
  lib/
    db.ts       → SQLite (conversaciones, mensajes, estado, outbox)
    openrouter.ts → cliente IA (OpenRouter via SDK de OpenAI)
    system-prompt.ts → inyecta prompts/negocio.md
    baileys/    → cliente WhatsApp (client, handler, outbox loop)
    tools/      → 4 herramientas del agente IA
scripts/
  start-bot.ts  → arranca el bot de WhatsApp
  wizard.ts     → fallback CLI de /setup
  doctor.ts     → diagnóstico de 10 errores conocidos
  check-system.ts → verificación del sistema
prompts/
  negocio.md    → prompt de tu negocio (creado por /personaliza, gitignored)
  negocio.example.md → plantilla de ejemplo
```

---

## Stack

| Capa | Tecnología |
|---|---|
| WhatsApp | @whiskeysockets/baileys ^6.7.21 |
| IA | OpenRouter (SDK openai ^6.38.0) |
| DB | better-sqlite3 ^12.10.0 (SQLite WAL) |
| Panel web | Next.js ^16.2.6 + React 19 + Tailwind v4 |
| Runtime scripts | tsx ^4.19.2 |
| Despliegue | Nixpacks + EasyPanel + Hostinger VPS |
| Seguridad panel | Cloudflare Access (Zero Trust) |

---

## Tarifas orientativas (para revendedores)

Si instalas esto para clientes:

| Servicio | Precio orientativo |
|---|---|
| Diagnóstico / consultoría | 150 – 300 € |
| Implementación completa | 800 – 1.500 € |
| Mantenimiento mensual | 80 – 200 € / mes |

---

## FAQ

**¿Funciona con cualquier número de WhatsApp?**
Sí, con cualquier número que uses desde un móvil. No necesitas WhatsApp Business.

**¿Qué pasa si cierro el ordenador?**
El bot se para. Para que funcione 24/7 necesitas `/deploy` en un VPS.

**¿Puedo tener varios negocios / números?**
El kit está pensado para un número por instalación. Para varios, necesitas varias instancias.

**¿El agente puede enviar imágenes, audios o documentos?**
Por ahora solo texto. Es una decisión deliberada para mantener el kit simple.

**¿Es seguro usar WhatsApp no oficial?**
Baileys usa la API de WhatsApp Web, la misma que usa el navegador. WhatsApp puede bloquear números si detecta comportamiento automatizado masivo. Para uso legítimo de atención al cliente, el riesgo es muy bajo.

---

## Nota sobre Claude Code

Claude Code requiere una suscripción a **Claude Pro** (~20 $/mes). Si no quieres o no puedes pagar esa suscripción, usa el fallback:

```bash
npm run wizard
```

El wizard hace exactamente lo mismo que `/setup` pero desde la terminal, sin Claude Code.

---

## Licencia

Uso exclusivo para miembros de **La Tribu Divisual** → https://www.skool.com/la-tribu-divisual

No redistribuir ni publicar en repositorios públicos.
