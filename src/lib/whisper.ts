import OpenAI, { toFile } from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return null;
  if (_client) return _client;
  _client = new OpenAI({ apiKey });
  return _client;
}

function extFromMime(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "ogg";
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const ext = extFromMime(mimeType);
  const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });
  const result = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "es",
  });

  return result.text?.trim() || null;
}
