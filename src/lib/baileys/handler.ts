import type { WASocket, BaileysEventMap } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import pino from "pino";
import {
  getOrCreateConversation,
  getConversationById,
  insertMessage,
  getRecentHistory,
} from "../db.js";
import { generateReply } from "../openrouter.js";
import { transcribeAudio } from "../whisper.js";

const logger = pino({ level: (process.env.LOG_LEVEL ?? "info") as pino.Level });

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
      // displayText fuera del try: aunque falle la descarga procesamos el texto
      const caption = m.imageMessage.caption;
      displayText = caption ? `🖼️ ${caption}` : "🖼️ [Imagen]";
      try {
        const buffer = (await downloadMediaMessage(msg, "buffer", {})) as Buffer;
        const mimeType = m.imageMessage.mimetype ?? "image/jpeg";
        imageContent = { base64: buffer.toString("base64"), mimeType };
        logger.info({ bytes: buffer.length, mimeType }, "Imagen descargada");
      } catch (err) {
        logger.error({ err }, "Error descargando imagen — se procesa solo el texto");
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
    logger.info(
      { hasImage: !!imageContent, historyLen: history.length },
      "Generando respuesta"
    );
    const reply = await generateReply({
      history,
      conversationId: convo.id,
      imageContent,
    });
    if (!reply) continue;

    insertMessage(convo.id, "assistant", reply);
    await sock.sendMessage(remoteJid, { text: reply });

    // Si el LLM derivó a humano, notificar al equipo por WhatsApp
    const afterMode = getConversationById(convo.id);
    if (afterMode?.mode === "HUMAN") {
      const teamPhone = process.env.TEAM_PHONE?.trim();
      if (teamPhone) {
        const teamJid = `${teamPhone}@s.whatsapp.net`;
        const leadInfo = [
          `🔔 *Nuevo lead para atender*`,
          `📱 WhatsApp: +${phone}`,
          name ? `👤 Nombre: ${name}` : null,
          `💬 Último mensaje: ${finalText.substring(0, 120)}`,
        ]
          .filter(Boolean)
          .join("\n");
        await sock.sendMessage(teamJid, { text: leadInfo });
        logger.info({ teamPhone, phone }, "Notificación enviada al equipo");
      }
    }
  }
}
