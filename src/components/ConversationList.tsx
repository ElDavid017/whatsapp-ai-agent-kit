"use client";

type ConversationMode = "AI" | "HUMAN";

interface ConversationItem {
  id: number;
  phone: string;
  name: string | null;
  mode: ConversationMode;
  last_message_at: number | null;
  last_message_preview: string | null;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function formatRelative(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <aside className="bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
          Conversaciones · {conversations.length}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-neutral-500 text-sm text-center mt-8">
            <p>Aún no hay conversaciones.</p>
            <p className="mt-1">Escríbete desde otro móvil.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 border-b border-neutral-800 transition-colors hover:bg-neutral-800 ${
                selectedId === conv.id ? "bg-neutral-800" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-neutral-100 text-sm truncate">
                  {conv.name ?? `+${conv.phone}`}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
                      conv.mode === "AI"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                        : "bg-amber-950 text-amber-400 border border-amber-900"
                    }`}
                  >
                    {conv.mode}
                  </span>
                  {conv.last_message_at && (
                    <span className="text-neutral-600 text-xs">
                      {formatRelative(conv.last_message_at)}
                    </span>
                  )}
                </div>
              </div>
              {conv.name && (
                <p className="text-neutral-500 text-xs mb-0.5">+{conv.phone}</p>
              )}
              {conv.last_message_preview && (
                <p className="text-neutral-500 text-xs truncate">{conv.last_message_preview}</p>
              )}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
