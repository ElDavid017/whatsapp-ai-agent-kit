"use client";

interface DashboardHeaderProps {
  phone?: string;
}

export default function DashboardHeader({ phone }: DashboardHeaderProps) {
  async function handleDisconnect() {
    if (!confirm("¿Desconectar WhatsApp? Se borrará la sesión y necesitarás escanear el QR de nuevo.")) {
      return;
    }
    try {
      await fetch("/api/connection/disconnect", { method: "POST" });
      window.location.reload();
    } catch {
      alert("Error al desconectar. Intenta de nuevo.");
    }
  }

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-neutral-100">Agente conectado</span>
        </div>
        {phone && (
          <span className="text-neutral-500 text-sm">+{phone}</span>
        )}
      </div>
      <button
        onClick={handleDisconnect}
        className="text-sm text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-800 rounded-lg px-3 py-1.5 transition-colors"
      >
        Desconectar
      </button>
    </header>
  );
}
