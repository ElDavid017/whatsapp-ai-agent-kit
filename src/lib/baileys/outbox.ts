import type { WASocket } from "@whiskeysockets/baileys";
import { getPendingOutbox, getConversationById, markOutboxSent } from "../db.js";
import pino from "pino";

const logger = pino({ level: (process.env.LOG_LEVEL ?? "info") as pino.Level });

let outboxTimer: ReturnType<typeof setInterval> | null = null;

export function startOutboxLoop(sock: WASocket): void {
  if (outboxTimer) return;
  outboxTimer = setInterval(async () => {
    const pending = getPendingOutbox(20);
    for (const item of pending) {
      const convo = getConversationById(item.conversation_id);
      // Usar jid almacenado para soportar @lid; fallback a @s.whatsapp.net
      const jid = convo?.jid ?? `${item.phone}@s.whatsapp.net`;
      try {
        await sock.sendMessage(jid, { text: item.content });
        markOutboxSent(item.id);
      } catch (err) {
        logger.warn({ err, id: item.id }, "Error enviando outbox item %d — reintentará", item.id);
        // No marcar como sent; el siguiente tick lo reintenta
      }
    }
  }, 2000);
}

export function stopOutboxLoop(): void {
  if (outboxTimer) {
    clearInterval(outboxTimer);
    outboxTimer = null;
  }
}
