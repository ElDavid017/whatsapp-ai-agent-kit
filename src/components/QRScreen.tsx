"use client";

import { useEffect, useState } from "react";

type Status = "disconnected" | "qr" | "connecting" | "connected" | "unknown";

interface QRScreenProps {
  status: Status;
  qrPng?: string;
}

const statusMessages: Record<Status, string> = {
  qr: "Escanea el QR con tu móvil",
  connecting: "Conectando...",
  disconnected: "Esperando al bot...",
  connected: "Conectado",
  unknown: "Cargando...",
};

export default function QRScreen({ status, qrPng }: QRScreenProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [qrPng]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-800 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-100 mb-1">Conectar WhatsApp</h1>
          <p className="text-neutral-400 text-sm">{statusMessages[status]}</p>
        </div>

        {qrPng ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-xl">
              <img src={qrPng} alt="QR WhatsApp" className="w-64 h-64" />
            </div>

            {elapsed > 60 && (
              <div className="w-full bg-amber-950 border border-amber-800 rounded-lg px-4 py-3 text-amber-400 text-sm text-center">
                El QR puede haber caducado. Recarga la página si no conecta.
              </div>
            )}

            <div className="w-full bg-neutral-800 rounded-lg p-4">
              <p className="text-neutral-300 text-sm font-medium mb-2">Cómo vincular tu WhatsApp:</p>
              <ol className="text-neutral-400 text-sm space-y-1 list-decimal list-inside">
                <li>Abre WhatsApp en tu móvil</li>
                <li>Toca los tres puntos (⋮) → Dispositivos vinculados</li>
                <li>Toca "Vincular un dispositivo"</li>
                <li>Escanea el código QR de arriba</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-12 h-12 border-4 border-neutral-700 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-neutral-400 text-sm">
              {status === "disconnected"
                ? "Esperando al bot... Arranca con: npm run start:all"
                : status === "connecting"
                ? "Generando QR..."
                : "Iniciando..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
