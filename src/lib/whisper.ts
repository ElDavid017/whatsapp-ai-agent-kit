import OpenAI, { toFile } from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (_client) return _client;

  // Groq tiene Whisper gratis (7200 seg/día). Prioritario si está configurado.
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey?.trim()) {
    _client = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    return _client;
  }

  // Fallback: OpenAI (de pago, ~$0.006/min)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey?.trim()) {
    _client = new OpenAI({ apiKey: openaiKey });
    return _client;
  }

  return null;
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

  // Groq usa whisper-large-v3-turbo; OpenAI usa whisper-1
  const model = process.env.GROQ_API_KEY?.trim()
    ? "whisper-large-v3-turbo"
    : "whisper-1";

  const result = await client.audio.transcriptions.create({
    file,
    model,
    language: "es",
  });

  return result.text?.trim() || null;
}
