import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcodeTerminal from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { setConnectionState, getConnectionState } from "../db.js";
import { handleIncomingMessages } from "./handler.js";
import { startOutboxLoop, stopOutboxLoop } from "./outbox.js";

const AUTH_DIR = path.resolve(process.cwd(), "auth");
const DATA_DIR = path.resolve(process.cwd(), "data");
const RESTART_FLAG = path.join(DATA_DIR, ".restart");

const logger = pino({ level: (process.env.LOG_LEVEL ?? "info") as pino.Level });

// Codes:
// 405 = versión desactualizada (mitigado con fetchLatestBaileysVersion)
// 440 = connectionReplaced / browser fingerprint (mitigado con Browsers.macOS + backoff 15s)
// 515 = señal de pairing OK, no es error real — ignorar

interface Handle {
  sock: WASocket;
  shutdown: () => void;
}
let handle: Handle | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let restartWatcher: ReturnType<typeof setInterval> | null = null;

function scheduleReconnect(code: number | undefined): void {
  if (reconnectTimer) return;
  const delay = code === 440 ? 15000 : 5000;
  logger.info({ code, delay }, "Reconectando en %dms", delay);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      handle?.sock.end(undefined);
    } catch {}
    await start();
  }, delay);
}

export async function start(): Promise<void> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  let version: [number, number, number] | undefined;
  try {
    const result = await fetchLatestBaileysVersion();
    version = result.version;
    logger.debug({ version }, "Versión de WhatsApp obtenida");
  } catch (e) {
    logger.warn({ err: e }, "No se pudo obtener la versión de WhatsApp — usando la interna de Baileys");
    version = undefined;
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS("Desktop"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  handle = {
    sock,
    shutdown: () => {
      try { sock.end(undefined); } catch {}
    },
  };

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect, qr } = u;

    if (qr) {
      setConnectionState({ status: "qr", qr_string: qr, phone: null });
      qrcodeTerminal.generate(qr, { small: true });
      logger.info("QR generado — escanea en http://localhost:3000");
    }

    if (connection === "connecting") {
      const current = getConnectionState();
      if (current.status === "disconnected") {
        setConnectionState({ status: "connecting" });
      }
      logger.info("Conectando a WhatsApp...");
    }

    if (connection === "open") {
      const userId = sock.user?.id ?? "";
      const phone = userId.split(":")[0].split("@")[0];
      setConnectionState({ status: "connected", qr_string: null, phone });
      startOutboxLoop(sock);
      logger.info({ phone }, "Conectado a WhatsApp como +%s", phone);
    }

    if (connection === "close") {
      const boom = lastDisconnect?.error as Boom | undefined;
      const code = boom?.output?.statusCode;
      stopOutboxLoop();
      logger.info({ code }, `Conexión cerrada (code: ${code ?? "unknown"})`);

      if (code === DisconnectReason.loggedOut) {
        setConnectionState({ status: "disconnected", qr_string: null, phone: null });
        logger.warn("Sesión cerrada (loggedOut 401). Borra auth/ y reconecta.");
      } else {
        // No tocar la DB — mantener 'connected' mientras reconecta
        scheduleReconnect(code);
      }
    }
  });

  sock.ev.on("messages.upsert", (e) => {
    handleIncomingMessages(sock, e).catch((err) =>
      logger.error({ err }, "Error en handleIncomingMessages")
    );
  });
}

export function watchRestartFlag(): void {
  if (restartWatcher) clearInterval(restartWatcher);
  restartWatcher = setInterval(async () => {
    if (!fs.existsSync(RESTART_FLAG)) return;
    try { fs.unlinkSync(RESTART_FLAG); } catch {}
    logger.info("Flag .restart detectado — reiniciando sesión...");
    stopOutboxLoop();
    if (handle) {
      try { handle.sock.end(undefined); } catch {}
      handle = null;
    }
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch {}
    await start();
  }, 1000);
}
