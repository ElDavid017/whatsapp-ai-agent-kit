import type { WASocket, BaileysEventMap } from "@whiskeysockets/baileys";
import {
  getOrCreateConversation,
  getConversationById,
  insertMessage,
  getRecentHistory,
} from "../db.js";
import { generateReply } from "../openrouter.js";

export async function handleIncomingMessages(
  sock: WASocket,
  event: BaileysEventMap["messages.upsert"]
): Promise<void> {
  if (event.type !== "notify") return;

  for (const msg of event.messages) {
    if (msg.key.fromMe) continue;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) continue;

    // Saltar grupos, broadcasts y newsletters
    if (
      remoteJid.endsWith("@g.us") ||
      remoteJid.endsWith("@broadcast") ||
      remoteJid.endsWith("@newsletter")
    ) {
      continue;
    }

    // Aceptar solo @s.whatsapp.net y @lid (WhatsApp LID desplegado en 2025-2026)
    if (!remoteJid.endsWith("@s.whatsapp.net") && !remoteJid.endsWith("@lid")) {
      continue;
    }

    const text =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      null;
    if (!text) continue;

    const phone = remoteJid.split("@")[0].split(":")[0];
    const name = msg.pushName ?? undefined;

    const convo = getOrCreateConversation(phone, name, remoteJid);
    insertMessage(convo.id, "user", text);

    // Re-leer la conversación: el modo pudo cambiar mientras procesábamos
    const fresh = getConversationById(convo.id);
    if (!fresh || fresh.mode !== "AI") continue;

    const history = getRecentHistory(convo.id, 20);
    const reply = await generateReply({ history, conversationId: convo.id });
    if (!reply) continue;

    insertMessage(convo.id, "assistant", reply);
    await sock.sendMessage(remoteJid, { text: reply });
  }
}
