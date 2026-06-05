# Empieza aquí

Tienes 3 pasos para tener tu agente de WhatsApp con IA funcionando.

---

## Paso 1 — Abre la carpeta en VS Code con Claude Code

1. Abre VS Code.
2. Archivo → Abrir carpeta → selecciona esta carpeta.
3. Asegúrate de tener la extensión **Claude Code** instalada y activa.

---

## Paso 2 — Escribe `/setup`

En el chat de Claude Code, escribe:

```
/setup
```

Claude te guiará paso a paso por la instalación completa:
- Verificará que tu sistema esté listo.
- Instalará las dependencias.
- Te pedirá tu API key de OpenRouter (https://openrouter.ai).
- Conectará tu WhatsApp via QR.

**Tiempo estimado: 10-15 minutos** (la mayor parte esperando el QR).

---

## Paso 3 — Escribe `/personaliza`

Una vez conectado, escribe:

```
/personaliza
```

Claude te hará 6 preguntas sobre tu negocio (una a la vez) y creará el prompt personalizado de tu agente.

---

## ¿Quieres desplegarlo 24/7?

Cuando estés listo para que funcione siempre encendido:

```
/deploy
```

---

## ¿Sin Claude Code? (fallback)

Si no tienes Claude Code o Claude Pro, puedes configurar el kit desde la terminal:

```bash
npm run wizard
```

El wizard te guía con las mismas fases que `/setup` pero desde la línea de comandos.

> **Nota para Windows:** Claude Code requiere un shell compatible con Bash. Si usas Windows, asegúrate de tener instalado [Git for Windows](https://git-scm.com/download/win), que incluye Git Bash.

---

## ¿Necesitas ayuda?

Comunidad de soporte: **La Tribu Divisual** → https://www.skool.com/la-tribu-divisual
