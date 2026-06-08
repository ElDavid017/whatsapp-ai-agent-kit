import type { WASocket, BaileysEventMap } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import {
  getOrCreateConversation,
  getConversationById,
  insertMessage,
  getRecentHistory,
} from "../db.js";
import { generateReply } from "../openrouter.js";
import { transcribeAudio } from "../whisper.js";

export async function handleIncomingMessages(
  sock: WASocket,
  event: BaileysEventMap["messages.upsert"]
): Promise<void> {
  if (event.type !== "notify") return;

  for (const msg of event.messages) {
    if (msg.key.fromMe) continue;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) continue;

    if (
      remoteJid.endsWith("@g.us") ||
      remoteJid.endsWith("@broadcast") ||
      remoteJid.endsWith("@newsletter")
    ) {
      continue;
    }

    if (!remoteJid.endsWith("@s.whatsapp.net") && !remoteJid.endsWith("@lid")) {
      continue;
    }

    const m = msg.message;
    if (!m) continue;

    const plainText = m.conversation ?? m.extendedTextMessage?.text ?? null;

    // --- Imagen ---
    let imageContent: { base64: string; mimeType: string } | undefined;
    let displayText: string | null = null;

    if (m.imageMessage) {
      try {
        const buffer = (await downloadMediaMessage(msg, "buffer", {})) as Buffer;
        imageContent = {
          base64: buffer.toString("base64"),
          mimeType: m.imageMessage.mimetype ?? "image/jpeg",
        };
        const caption = m.imageMessage.caption;
        displayText = caption ? `🖼️ ${caption}` : "🖼️ [Imagen]";
      } catch {
        // Ignorar si falla la descarga
      }
    }

    // --- Audio / Nota de voz ---
    if (m.audioMessage) {
      try {
        const buffer = (await downloadMediaMessage(msg, "buffer", {})) as Buffer;
        const mimeType = m.audioMessage.mimetype ?? "audio/ogg; codecs=opus";
        const transcription = await transcribeAudio(buffer, mimeType);
        if (transcription) {
          displayText = `🎤 ${transcription}`;
        } else {
          await sock.sendMessage(remoteJid, {
            text: "Por el momento no proceso notas de voz. Por favor, escribe tu mensaje.",
          });
          continue;
        }
      } catch {
        await sock.sendMessage(remoteJid, {
          text: "No pude procesar el audio. Por favor, escribe tu mensaje.",
        });
        continue;
      }
    }

    const finalText = plainText ?? displayText;
    if (!finalText) continue;

    const phone = remoteJid.split("@")[0].split(":")[0];
    const name = msg.pushName ?? undefined;

    const convo = getOrCreateConversation(phone, name, remoteJid);
    insertMessage(convo.id, "user", finalText);

    const fresh = getConversationById(convo.id);
    if (!fresh || fresh.mode !== "AI") continue;

    const history = getRecentHistory(convo.id, 20);
    const reply = await generateReply({
      history,
      conversationId: convo.id,
      imageContent,
    });
    if (!reply) continue;

    insertMessage(convo.id, "assistant", reply);
    await sock.sendMessage(remoteJid, { text: reply });
  }
}
