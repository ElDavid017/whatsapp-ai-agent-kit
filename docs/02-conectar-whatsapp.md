# 02 — Conectar WhatsApp

## Cómo funciona

El kit usa **Baileys** para conectarse a WhatsApp Web (la misma API que usa el navegador cuando abres web.whatsapp.com). La conexión requiere escanear un QR code desde tu móvil.

## Pasos

1. Arranca el bot y el panel:
   ```bash
   npm run start:all
   ```

2. Abre **http://localhost:3000** en tu navegador.

3. Verás un QR code. Ábrelo en pantalla completa si es pequeño.

4. En tu móvil → WhatsApp → Dispositivos vinculados → Vincular un dispositivo → Escanea el QR.

5. La pantalla cambia automáticamente al panel de conversaciones cuando se conecta.

## Verificar la conexión

El estado de conexión se guarda en `data/messages.db` → tabla `connection_state`:

```
status: connected
phone: 34XXXXXXXXX
```

También puedes ver `+34XXXXXXXXX` en la cabecera del panel.

## El QR caduca

El QR code caduca en aproximadamente 60 segundos. Si caduca:
- El panel muestra un aviso ámbar.
- Recarga la página o espera a que el bot genere uno nuevo (tarda ~5 segundos).

## Reconexión automática

Si la conexión se interrumpe (WiFi caído, reinicio del servidor), el bot reconecta automáticamente en 5-15 segundos sin perder la sesión ni pedir QR de nuevo.

## La sesión no persiste en producción

Si despliegas en EasyPanel y no configuraste el volumen `/app/auth`, perderás la sesión en cada redeploy. Ver `docs/06-deploy-hostinger.md`.

## Notas sobre WhatsApp 2025+

Desde mediados de 2025, WhatsApp despliega identificadores `@lid` para algunos usuarios (en lugar de `@s.whatsapp.net`). El kit acepta ambos formatos nativamente. Si alguien te dice que no recibe respuesta, puede ser que su JID haya cambiado a `@lid` — el bot lo detecta automáticamente la próxima vez que escriba.

## Desconectar

Desde el panel web → botón "Desconectar" en la cabecera. Esto:
1. Borra la sesión de WhatsApp (`auth/`).
2. Genera un nuevo QR al reiniciar el bot.
3. No borra las conversaciones ni la base de datos.
