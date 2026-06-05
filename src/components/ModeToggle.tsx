"use client";

type ConversationMode = "AI" | "HUMAN";

interface ModeToggleProps {
  mode: ConversationMode;
  onChange: (mode: ConversationMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex rounded-lg border border-neutral-700 overflow-hidden text-xs font-medium">
      <button
        onClick={() => onChange("AI")}
        className={`px-3 py-1.5 transition-colors ${
          mode === "AI"
            ? "bg-emerald-600 text-white"
            : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        }`}
      >
        Modo IA
      </button>
      <button
        onClick={() => onChange("HUMAN")}
        className={`px-3 py-1.5 transition-colors ${
          mode === "HUMAN"
            ? "bg-amber-600 text-white"
            : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        }`}
      >
        Modo Humano
      </button>
    </div>
  );
}
