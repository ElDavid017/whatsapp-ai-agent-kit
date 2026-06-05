"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import ConversationList from "./ConversationList";
import ConversationPanel from "./ConversationPanel";

type ConversationMode = "AI" | "HUMAN";

interface ConversationItem {
  id: number;
  phone: string;
  name: string | null;
  mode: ConversationMode;
  last_message_at: number | null;
  last_message_preview: string | null;
}

interface DashboardProps {
  phone?: string;
}

export default function Dashboard({ phone }: DashboardProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: ConversationItem[] };
      setConversations(data.conversations);
      setSelectedId((prev) => {
        if (prev !== null) return prev;
        return data.conversations[0]?.id ?? null;
      });
    } catch {}
  }

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 2000);
    return () => clearInterval(interval);
  }, []);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader phone={phone} />
      <div className="flex-1 grid grid-cols-[320px_1fr] overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <ConversationPanel
          conversation={selected}
          onRefresh={fetchConversations}
        />
      </div>
    </div>
  );
}
