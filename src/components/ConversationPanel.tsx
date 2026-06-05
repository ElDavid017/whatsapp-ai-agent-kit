"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import ModeToggle from "./ModeToggle";

type ConversationMode = "AI" | "HUMAN";

interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "human";
  content: string;
  created_at: number;
}

interface ConversationItem {
  id: number;
  phone: string;
  name: string | null;
  mode: ConversationMode;
  last_message_at: number | null;
  last_message_preview: string | null;
}

interface ConversationPanelProps {
  conversation: ConversationItem | null;
  onRefresh: () => void;
}

export default function ConversationPanel({ conversation, onRefresh }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation) return;

    let mounted = true;

    async function fetchMessages() {
      if (!conversation) return;
      try {
        const res = await fetch(`/api/messages/${conversation.id}`, { cache: "no-store" });
        if (!res.ok || !mounted) return;
        const data = (await res.json()) as { messages: Message[] };
        setMessages(data.messages);
      } catch {}
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [conversation?.id]);

  // Autoscroll al fondo cuando cambian los mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleModeChange(mode: ConversationMode) {
    if (!conversation) return;
    await fetch(`/api/mode/${conversation.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    onRefresh();
  }

  async function handleDelete() {
    if (!conversation) return;
    if (!confirm(`¿Borrar la conversación con ${conversation.name ?? `+${conversation.phone}`}?`)) return;
    await fetch(`/api/conversations/${conversation.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function handleSend() {
    if (!conversation || !input.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput("");
      onRefresh();
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!conversation) {
    return (
      <section className="flex items-center justify-center bg-neutral-950">
        <p className="text-neutral-600">Selecciona una conversación</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-5 shrink-0">
        <div>
          <h2 className="font-semibold text-neutral-100 text-sm">
            {conversation.name ?? `+${conversation.phone}`}
          </h2>
          {conversation.name && (
            <p className="text-neutral-500 text-xs">+{conversation.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle mode={conversation.mode} onChange={handleModeChange} />
          <button
            onClick={handleDelete}
            className="text-xs text-neutral-500 hover:text-red-400 border border-neutral-700 hover:border-red-800 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-neutral-600 text-sm text-center mt-8">Sin mensajes aún</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              createdAt={msg.created_at}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {conversation.mode === "HUMAN" ? (
        <div className="border-t border-neutral-800 p-3 bg-neutral-900 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar)"
              rows={2}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 resize-none focus:outline-none focus:border-neutral-500"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="shrink-0 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg px-4 py-2 h-full transition-colors"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-neutral-800 px-5 py-3 bg-neutral-900 shrink-0">
          <p className="text-neutral-500 text-xs">
            El agente IA responde automáticamente. Cambia a{" "}
            <span className="text-amber-400">Modo Humano</span> para escribir tú.
          </p>
        </div>
      )}
    </section>
  );
}
