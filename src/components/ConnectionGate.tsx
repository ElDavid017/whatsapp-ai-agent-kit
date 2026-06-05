"use client";

import { useEffect, useState } from "react";
import QRScreen from "./QRScreen";
import Dashboard from "./Dashboard";

type Status = "disconnected" | "qr" | "connecting" | "connected" | "unknown";

interface StatusResponse {
  status: Status;
  qrPng?: string;
  phone?: string;
}

export default function ConnectionGate() {
  const [status, setStatus] = useState<Status>("unknown");
  const [qrPng, setQrPng] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const res = await fetch("/api/connection/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as StatusResponse;
        if (!mounted) return;
        setStatus(data.status);
        setQrPng(data.qrPng);
        setPhone(data.phone ?? undefined);
      } catch {
        if (mounted) setStatus("unknown");
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === "connected") {
    return <Dashboard phone={phone} />;
  }

  return <QRScreen status={status} qrPng={qrPng} />;
}
