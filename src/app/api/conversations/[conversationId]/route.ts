import { deleteConversation } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const id = parseInt(conversationId, 10);
  if (Number.isNaN(id)) {
    return Response.json({ ok: false, error: "id invalido" }, { status: 400 });
  }
  deleteConversation(id);
  return Response.json({ ok: true });
}
