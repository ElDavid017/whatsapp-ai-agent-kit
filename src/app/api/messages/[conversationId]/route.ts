import { getMessages, getConversationById, insertMessage, enqueueOutbox } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return Response.json({ ok: false, error: "id invalido" }, { status: 400 });
  }
  const messages = getMessages(id, 200);
  return Response.json({ messages });
}

export async function POST(req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return Response.json({ ok: false, error: "id invalido" }, { status: 400 });
  }

  const body = (await req.json()) as { content?: string };
  const content = body.content?.trim() ?? "";
  if (!content) {
    return Response.json({ ok: false, error: "contenido vacio" }, { status: 400 });
  }

  const conv = getConversationById(id);
  if (!conv) {
    return Response.json({ ok: false, error: "conversacion no encontrada" }, { status: 404 });
  }

  // La API web NO envía a WhatsApp directamente: solo encola para que el bot lo recoja
  const messageId = insertMessage(id, "human", content);
  enqueueOutbox(id, conv.phone, content);

  return Response.json({ ok: true, messageId });
}
