import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "messages.db");

export type ConversationMode = "AI" | "HUMAN";
export type MessageRole = "user" | "assistant" | "human";
export type ConnectionStatus = "disconnected" | "qr" | "connecting" | "connected";

export interface Conversation {
  id: number;
  phone: string;
  name: string | null;
  jid: string | null;
  mode: ConversationMode;
  last_message_at: number | null;
  created_at: number;
}

export interface ConversationListItem extends Conversation {
  last_message_preview: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  created_at: number;
}

export interface ConnectionState {
  id: number;
  status: ConnectionStatus;
  qr_string: string | null;
  phone: string | null;
  updated_at: number;
}

export interface OutboxItem {
  id: number;
  conversation_id: number;
  phone: string;
  content: string;
  sent: number;
  created_at: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  jid TEXT,
  mode TEXT CHECK(mode IN ('AI','HUMAN')) NOT NULL DEFAULT 'AI',
  last_message_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role TEXT CHECK(role IN ('user','assistant','human')) NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS connection_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  status TEXT CHECK(status IN ('disconnected','qr','connecting','connected')) NOT NULL DEFAULT 'disconnected',
  qr_string TEXT,
  phone TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT OR IGNORE INTO connection_state (id, status) VALUES (1, 'disconnected');

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  content TEXT NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(sent, created_at);
`;

interface Ctx {
  db: Database.Database;
  stmtGetConvByPhone: Database.Statement;
  stmtInsertConv: Database.Statement;
  stmtUpdateConvName: Database.Statement;
  stmtUpdateConvJid: Database.Statement;
  stmtGetConvById: Database.Statement;
  stmtListConversations: Database.Statement;
  stmtSetMode: Database.Statement;
  stmtInsertMessage: Database.Statement;
  stmtUpdateLastMessage: Database.Statement;
  stmtGetMessages: Database.Statement;
  stmtGetConnectionState: Database.Statement;
  stmtUpdateConnectionState: Database.Statement;
  stmtEnqueueOutbox: Database.Statement;
  stmtGetPendingOutbox: Database.Statement;
  stmtMarkOutboxSent: Database.Statement;
  stmtDeleteMessages: Database.Statement;
  stmtDeletePendingOutbox: Database.Statement;
  stmtDeleteConversation: Database.Statement;
  txInsertMessage: (conversationId: number, role: MessageRole, content: string) => { id: number };
  txDeleteConversation: (conversationId: number) => void;
}

let _ctx: Ctx | null = null;

function ctx(): Ctx {
  if (!_ctx) _ctx = build();
  return _ctx;
}

function build(): Ctx {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  // micro-migración: añadir columna jid si no existe
  const cols = db.prepare("PRAGMA table_info(conversations)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "jid")) {
    db.exec("ALTER TABLE conversations ADD COLUMN jid TEXT");
  }

  const stmtGetConvByPhone = db.prepare<[string]>(
    "SELECT * FROM conversations WHERE phone = ?"
  );
  const stmtInsertConv = db.prepare<[string, string | undefined, string | undefined]>(
    "INSERT INTO conversations (phone, name, jid) VALUES (?, ?, ?)"
  );
  const stmtUpdateConvName = db.prepare<[string, number]>(
    "UPDATE conversations SET name = ? WHERE id = ? AND (name IS NULL OR name = '')"
  );
  const stmtUpdateConvJid = db.prepare<[string, number]>(
    "UPDATE conversations SET jid = ? WHERE id = ?"
  );
  const stmtGetConvById = db.prepare<[number]>(
    "SELECT * FROM conversations WHERE id = ?"
  );
  const stmtListConversations = db.prepare(
    `SELECT c.*, (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_preview
     FROM conversations c
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`
  );
  const stmtSetMode = db.prepare<[string, number]>(
    "UPDATE conversations SET mode = ? WHERE id = ?"
  );
  const stmtInsertMessage = db.prepare<[number, string, string]>(
    "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
  );
  const stmtUpdateLastMessage = db.prepare<[number]>(
    "UPDATE conversations SET last_message_at = unixepoch() WHERE id = ?"
  );
  const stmtGetMessages = db.prepare<[number, number]>(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?"
  );
  const stmtGetConnectionState = db.prepare(
    "SELECT * FROM connection_state WHERE id = 1"
  );
  const stmtUpdateConnectionState = db.prepare<[string, string | null, string | null]>(
    "UPDATE connection_state SET status = ?, qr_string = ?, phone = ?, updated_at = unixepoch() WHERE id = 1"
  );
  const stmtEnqueueOutbox = db.prepare<[number, string, string]>(
    "INSERT INTO outbox (conversation_id, phone, content) VALUES (?, ?, ?)"
  );
  const stmtGetPendingOutbox = db.prepare<[number]>(
    "SELECT * FROM outbox WHERE sent = 0 ORDER BY created_at ASC LIMIT ?"
  );
  const stmtMarkOutboxSent = db.prepare<[number]>(
    "UPDATE outbox SET sent = 1 WHERE id = ?"
  );
  const stmtDeleteMessages = db.prepare<[number]>(
    "DELETE FROM messages WHERE conversation_id = ?"
  );
  const stmtDeletePendingOutbox = db.prepare<[number]>(
    "DELETE FROM outbox WHERE conversation_id = ? AND sent = 0"
  );
  const stmtDeleteConversation = db.prepare<[number]>(
    "DELETE FROM conversations WHERE id = ?"
  );

  const txInsertMessage = db.transaction((conversationId: number, role: MessageRole, content: string) => {
    const result = stmtInsertMessage.run(conversationId, role, content);
    stmtUpdateLastMessage.run(conversationId);
    return { id: Number(result.lastInsertRowid) };
  });

  const txDeleteConversation = db.transaction((conversationId: number) => {
    stmtDeleteMessages.run(conversationId);
    stmtDeletePendingOutbox.run(conversationId);
    stmtDeleteConversation.run(conversationId);
  });

  return {
    db,
    stmtGetConvByPhone,
    stmtInsertConv,
    stmtUpdateConvName,
    stmtUpdateConvJid,
    stmtGetConvById,
    stmtListConversations,
    stmtSetMode,
    stmtInsertMessage,
    stmtUpdateLastMessage,
    stmtGetMessages,
    stmtGetConnectionState,
    stmtUpdateConnectionState,
    stmtEnqueueOutbox,
    stmtGetPendingOutbox,
    stmtMarkOutboxSent,
    stmtDeleteMessages,
    stmtDeletePendingOutbox,
    stmtDeleteConversation,
    txInsertMessage,
    txDeleteConversation,
  };
}

export function getOrCreateConversation(
  phone: string,
  name?: string,
  jid?: string
): Conversation {
  const c = ctx();
  let conv = c.stmtGetConvByPhone.get(phone) as Conversation | undefined;
  if (!conv) {
    c.stmtInsertConv.run(phone, name, jid);
    conv = c.stmtGetConvByPhone.get(phone) as Conversation;
  } else {
    if (name) c.stmtUpdateConvName.run(name, conv.id);
    if (jid && jid !== conv.jid) c.stmtUpdateConvJid.run(jid, conv.id);
    conv = c.stmtGetConvById.get(conv.id) as Conversation;
  }
  return conv;
}

export function getConversationById(id: number): Conversation | null {
  return (ctx().stmtGetConvById.get(id) as Conversation | undefined) ?? null;
}

export function listConversations(): ConversationListItem[] {
  return ctx().stmtListConversations.all() as ConversationListItem[];
}

export function setMode(conversationId: number, mode: ConversationMode): void {
  ctx().stmtSetMode.run(mode, conversationId);
}

export function insertMessage(
  conversationId: number,
  role: MessageRole,
  content: string
): number {
  return ctx().txInsertMessage(conversationId, role, content).id;
}

export function getMessages(conversationId: number, limit = 50): Message[] {
  const rows = ctx().stmtGetMessages.all(conversationId, limit) as Message[];
  return rows.reverse();
}

export function getRecentHistory(conversationId: number, limit = 20): Message[] {
  const rows = ctx().stmtGetMessages.all(conversationId, limit) as Message[];
  return rows.reverse();
}

export function getConnectionState(): ConnectionState {
  return ctx().stmtGetConnectionState.get() as ConnectionState;
}

export function setConnectionState(input: {
  status?: ConnectionStatus;
  qr_string?: string | null;
  phone?: string | null;
}): void {
  const c = ctx();
  const current = c.stmtGetConnectionState.get() as ConnectionState;
  const status = input.status ?? current.status;
  const qr_string = "qr_string" in input ? input.qr_string ?? null : current.qr_string;
  const phone = "phone" in input ? input.phone ?? null : current.phone;
  c.stmtUpdateConnectionState.run(status, qr_string, phone);
}

export function enqueueOutbox(
  conversationId: number,
  phone: string,
  content: string
): number {
  const result = ctx().stmtEnqueueOutbox.run(conversationId, phone, content);
  return Number(result.lastInsertRowid);
}

export function getPendingOutbox(limit = 20): OutboxItem[] {
  return ctx().stmtGetPendingOutbox.all(limit) as OutboxItem[];
}

export function markOutboxSent(id: number): void {
  ctx().stmtMarkOutboxSent.run(id);
}

export function deleteConversation(conversationId: number): void {
  ctx().txDeleteConversation(conversationId);
}
