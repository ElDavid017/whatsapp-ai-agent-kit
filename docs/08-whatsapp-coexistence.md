# 08 — Coexistencia de WhatsApp y formato LID

## WhatsApp en múltiples dispositivos

WhatsApp permite conectar hasta 4 dispositivos vinculados además del teléfono principal. El kit usa una de esas "ranuras" de dispositivo vinculado.

Esto significa que **puedes seguir usando WhatsApp normalmente en tu móvil** mientras el bot corre en el servidor. No son excluyentes.

## Identificadores LID (2025+)

Desde mediados de 2025, WhatsApp migra gradualmente a un nuevo sistema de identificadores llamado **LID** (Local ID). En lugar de `+34600000000@s.whatsapp.net`, algunos contactos tienen un identificador del tipo `12345678901234567890@lid`.

### ¿Cómo afecta al kit?

El kit acepta ambos formatos nativamente:

```typescript
// En handler.ts — acepta @s.whatsapp.net y @lid
if (!remoteJid.endsWith("@s.whatsapp.net") && !remoteJid.endsWith("@lid")) {
  continue;
}
```

Y el JID completo (con `@lid`) se guarda en `conversations.jid` para responder siempre por el canal correcto:

```typescript
// En outbox.ts — usa el jid almacenado, no reconstruye a @s.whatsapp.net
const jid = convo?.jid ?? `${item.phone}@s.whatsapp.net`;
```

### Síntomas de un problema con LID

Si un contacto escribe y el bot no responde:
1. Ejecuta `npm run doctor` → comprueba `connection_state`.
2. Revisa los logs del bot — si el JID aparece como `@lid` y hay un `continue` antes de procesarlo, es un bug de versión.
3. Actualiza `@whiskeysockets/baileys` si llevas más de 3 meses sin actualizar.

## Grupos y broadcasts

El kit ignora intencionalmente:
- Grupos (`@g.us`)
- Broadcasts (`@broadcast`)
- Newsletters (`@newsletter`)

Solo procesa mensajes 1:1 de clientes directos.

## Usar el mismo número en dos kits

No es posible. Un número de WhatsApp solo puede tener una sesión de Baileys activa a la vez. Si intentas conectar el mismo número desde dos instancias, la segunda desconectará a la primera (código 440).

## Actualizar Baileys

Baileys actualiza frecuentemente para adaptarse a los cambios de WhatsApp. Si empiezas a ver errores de conexión inesperados después de meses de funcionamiento:

```bash
npm update @whiskeysockets/baileys
npm run build
```
