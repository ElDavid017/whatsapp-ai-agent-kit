import { getConnectionState } from "@/lib/db";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = getConnectionState();

  // Mostrar QR también en 'connecting' para evitar race condition en máquinas rápidas
  if (state.qr_string && (state.status === "qr" || state.status === "connecting")) {
    const qrPng = await QRCode.toDataURL(state.qr_string, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    return Response.json({
      status: "qr",
      qrPng,
      phone: state.phone,
      updatedAt: state.updated_at,
    });
  }

  return Response.json({
    status: state.status,
    phone: state.phone,
    updatedAt: state.updated_at,
  });
}
