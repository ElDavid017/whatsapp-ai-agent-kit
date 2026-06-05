# 07 — Errores comunes y soluciones

Para diagnóstico automático ejecuta:

```bash
npm run doctor
```

Este documento cubre los errores más frecuentes. El registro completo está en `errores-sesion.md`.

---

## El bot arranca pero no responde mensajes

**Comprobaciones:**

1. ¿El mensaje viene del mismo número vinculado? Los mensajes propios se ignoran. Prueba desde **otro** móvil.
2. ¿La conversación está en Modo Humano? Revisa el badge en el panel.
3. ¿`OPENROUTER_API_KEY` es válida? Ejecuta `npm run doctor`.
4. ¿El modelo termina en `:free`? Cámbialo en `.env.local`.

---

## El QR no aparece en el panel

1. ¿Está corriendo el bot? Verifica que `npm run start:all` esté activo.
2. ¿La tabla `connection_state` tiene `status = 'qr'`? Revisa con `npm run doctor`.
3. Recarga la página — puede ser un problema de cache del browser.

---

## Error 429 de OpenRouter

Estás usando un modelo `:free`. Cámbialo:

```
OPENROUTER_MODEL=openai/gpt-4o-mini
```

---

## `npm run build` falla

**Si el error menciona TypeScript:**
```bash
npm run typecheck
```
Ver los errores y corregirlos. Si son de tipos de `better-sqlite3`, ejecuta `npm install`.

**Si el error menciona `SQLITE_BUSY`:**
La inicialización perezosa de `db.ts` debería evitarlo. Verifica que no hay código que abre la DB al importar el módulo.

**Si el error menciona `*.tsbuildinfo`:**
```bash
rimraf *.tsbuildinfo
npm run build
```

---

## El panel se carga pero las conversaciones no aparecen

1. El bot no está corriendo → arranca con `npm run start:all`.
2. La DB no existe → el bot la crea al arrancar por primera vez.
3. Error en el endpoint `/api/conversations` → revisa los logs de Next.js.

---

## En Windows: `better-sqlite3` no compila

Necesitas Visual Studio Build Tools:

1. Descarga desde https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Instala el componente "Desarrollo para el escritorio con C++"
3. Ejecuta: `npm rebuild better-sqlite3`

---

## Sesión caducada (loggedOut 401)

WhatsApp revocó la vinculación (ocurre si cierras la sesión desde el móvil).

1. Desde el panel web → botón "Desconectar".
2. O borra `auth/` manualmente.
3. Reinicia el bot y escanea el QR de nuevo.

---

## El deploy en EasyPanel pide QR cada vez

Los volúmenes `/app/auth` no están configurados. Ver `docs/06-deploy-hostinger.md` → Paso 5.
