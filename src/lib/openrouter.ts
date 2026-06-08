import OpenAI from "openai";
import type { Message } from "./db.js";
import { buildSystemPrompt } from "./system-prompt.js";
import { toolDefinitions, executeTool } from "./tools/index.js";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Falta OPENROUTER_API_KEY. Ejecuta /setup.");
  }
  _client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/divisualproject/whatsapp-ai-agent-kit",
      "X-Title": "WhatsApp AI Agent Kit",
    },
  });
  return _client;
}

const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const MAX_TURNS = 5;

export async function validateApiKey(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getClient().models.list();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function generateReply(input: {
  history: Message[];
  conversationId: number;
  imageContent?: { base64: string; mimeType: string };
}): Promise<string> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt();

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...input.history.map((m, i) => {
      const isLast = i === input.history.length - 1;
      if (isLast && m.role === "user" && input.imageContent) {
        return {
          role: "user" as const,
          content: [
            { type: "text" as const, text: m.content },
            {
              type: "image_url" as const,
              image_url: {
                url: `data:${input.imageContent.mimeType};base64,${input.imageContent.base64}`,
              },
            },
          ],
        };
      }
      return {
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      };
    }),
  ];

  let turns = 0;
  while (turns < MAX_TURNS) {
    const res = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolDefinitions as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: "auto",
      temperature: 0.4,
    });

    const msg = res.choices[0].message;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content ?? "";
    }

    messages.push({
      role: "assistant",
      content: msg.content ?? "",
      tool_calls: msg.tool_calls,
    });

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {}
      const result = await executeTool(call.function.name, args, {
        conversationId: input.conversationId,
      });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }

    turns++;
  }

  return "Déjame un momento — vuelvo contigo enseguida.";
}
