"use client";

type MessageRole = "user" | "assistant" | "human";

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  createdAt: number; // epoch seconds
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ role, content, createdAt }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[75%]">
          <div className="bg-neutral-800 text-neutral-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
            {content}
          </div>
          <p className="text-neutral-600 text-xs mt-1 ml-1">{formatTime(createdAt)}</p>
        </div>
      </div>
    );
  }

  if (role === "assistant") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <p className="text-emerald-500 text-xs mb-1 mr-1 text-right uppercase tracking-wider font-medium">
            Agente IA
          </p>
          <div className="bg-emerald-900 border border-emerald-800 text-emerald-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
            {content}
          </div>
          <p className="text-neutral-600 text-xs mt-1 mr-1 text-right">{formatTime(createdAt)}</p>
        </div>
      </div>
    );
  }

  // role === "human"
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%]">
        <p className="text-amber-500 text-xs mb-1 mr-1 text-right uppercase tracking-wider font-medium">
          Humano
        </p>
        <div className="bg-amber-900 border border-amber-800 text-amber-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
          {content}
        </div>
        <p className="text-neutral-600 text-xs mt-1 mr-1 text-right">{formatTime(createdAt)}</p>
      </div>
    </div>
  );
}
