# 01 — Instalación local

## Requisitos

- **Node.js 22** (mínimo 20.9.0). Instala con `nvm install 22 && nvm use 22`.
- **npm** (incluido con Node.js)
- **VS Code** con extensión **Claude Code** (para el onboarding conversacional)
- Cuenta en **OpenRouter** → https://openrouter.ai (necesitas al menos saldo mínimo, ~1 €)

## Instalación

### Opción A — Con Claude Code (recomendada)

1. Abre la carpeta del proyecto en VS Code.
2. Escribe `/setup` en el chat de Claude Code.
3. Sigue las instrucciones conversacionales.

### Opción B — Manual / wizard

```bash
npm run wizard
```

El wizard hace exactamente lo mismo que `/setup` pero desde la terminal.

### Opción C — Manual paso a paso

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar TypeScript
npm run typecheck

# 3. Build del panel web
npm run build

# 4. Copiar y rellenar variables de entorno
cp .env.example .env.local
# Edita .env.local y añade tu OPENROUTER_API_KEY

# 5. Arrancar
npm run start:all
```

## Verificar la instalación

```bash
npm run check    # Verifica sistema, estructura y .env.local
npm run doctor   # Diagnóstico completo incluyendo estado de conexión
```

## Estructura de carpetas tras la instalación

```
auth/    → sesión de WhatsApp (creada al arrancar)
data/    → base de datos SQLite (creada al arrancar)
.next/   → build de Next.js (creado por npm run build)
```

Estas carpetas están en `.gitignore` — no se versionan.
