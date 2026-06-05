import "./env-loader.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "messages.db");
const AUTH_DIR = path.resolve(process.cwd(), "auth");

console.log(chalk.bold("\n🩺 WhatsApp AI Agent Kit — Doctor\n"));

let issues = 0;

// ─── Bloque 1: .env.local + claves ───────────────────────────────────────────
console.log(chalk.cyan("── Bloque 1: Variables de entorno ──"));

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.log(chalk.red("✘ .env.local no encontrado.") + " Copia .env.example a .env.local y rellena los valores.");
  issues++;
} else {
  console.log(chalk.green("✔ .env.local encontrado"));
}

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey?.trim()) {
  console.log(chalk.red("✘ OPENROUTER_API_KEY vacía o falta.") + " El bot no puede arrancar.");
  issues++;
} else if (!apiKey.startsWith("sk-or-")) {
  console.log(chalk.yellow("⚠ OPENROUTER_API_KEY no tiene el formato sk-or-... ¿Es correcta?"));
} else {
  console.log(chalk.green("✔ OPENROUTER_API_KEY configurada"));
}

const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
if (model.endsWith(":free")) {
  console.log(chalk.red("✘ Modelo '" + model + "' usa :free — saturado en producción.") + " Cambia a openai/gpt-4o-mini u otro sin :free");
  issues++;
} else {
  console.log(chalk.green(`✔ Modelo configurado: ${model}`));
}

// ─── Bloque 2: node_modules + TypeScript ─────────────────────────────────────
console.log(chalk.cyan("\n── Bloque 2: Dependencias y TypeScript ──"));

const nodeModulesPath = path.resolve(process.cwd(), "node_modules");
if (!fs.existsSync(nodeModulesPath)) {
  console.log(chalk.red("✘ node_modules no encontrado.") + " Ejecuta: npm install");
  issues++;
} else {
  console.log(chalk.green("✔ node_modules encontrado"));

  try {
    execSync("npx tsc --noEmit", { stdio: "pipe" });
    console.log(chalk.green("✔ TypeScript sin errores"));
  } catch (e: unknown) {
    const output = e instanceof Error && 'stdout' in e ? String((e as NodeJS.ErrnoException & {stdout?: Buffer}).stdout) : "";
    console.log(chalk.yellow("⚠ TypeScript tiene errores:"));
    if (output) console.log(chalk.dim(output.slice(0, 800)));
  }
}

// ─── Bloque 3: Estado de conexión en DB ──────────────────────────────────────
console.log(chalk.cyan("\n── Bloque 3: Estado de conexión WhatsApp ──"));

if (!fs.existsSync(DB_PATH)) {
  console.log(chalk.yellow("⚠ Base de datos no encontrada — el bot aún no se ha iniciado"));
} else {
  try {
    // Import in CJS style for dynamic require in ESM context
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const BetterSqlite3 = require("better-sqlite3") as typeof import("better-sqlite3");
    const db = new BetterSqlite3(DB_PATH, { readonly: true });
    const row = db.prepare("SELECT status, phone, qr_string FROM connection_state WHERE id = 1").get() as
      { status: string; phone: string | null; qr_string: string | null } | undefined;
    db.close();

    if (!row) {
      console.log(chalk.yellow("⚠ No hay fila en connection_state"));
    } else {
      const statusMessages: Record<string, string> = {
        connected: `✔ Conectado como +${row.phone ?? "?"}`,
        qr: "⚠ Esperando escaneo de QR — abre http://localhost:3000",
        connecting: "⚠ Conectando... espera unos segundos",
        disconnected: "✘ Desconectado — arranca el bot: npm run start:all",
      };
      const msg = statusMessages[row.status] ?? `Estado: ${row.status}`;
      const color = row.status === "connected" ? chalk.green : row.status === "disconnected" ? chalk.red : chalk.yellow;
      console.log(color(msg));
    }
  } catch (e) {
    console.log(chalk.yellow("⚠ No se pudo leer la DB: " + String(e)));
  }
}

// ─── Bloque 4: auth/ y prompts/negocio.md ────────────────────────────────────
console.log(chalk.cyan("\n── Bloque 4: Sesión y prompt de negocio ──"));

if (fs.existsSync(AUTH_DIR)) {
  const authFiles = fs.readdirSync(AUTH_DIR);
  if (authFiles.length > 0) {
    console.log(chalk.green(`✔ Carpeta auth/ existe con ${authFiles.length} fichero(s)`));
  } else {
    console.log(chalk.yellow("⚠ auth/ existe pero está vacía — se generará nuevo QR al arrancar"));
  }
} else {
  console.log(chalk.yellow("⚠ auth/ no existe — se creará al arrancar el bot por primera vez"));
}

const negocioPath = path.resolve(process.cwd(), "prompts", "negocio.md");
if (fs.existsSync(negocioPath)) {
  const content = fs.readFileSync(negocioPath, "utf-8");
  const sections = ["## Nombre", "## A qué se dedica", "## Propuesta de valor", "## Preguntas de calificación", "## Criterios de lead", "## Acción cuando"];
  const missing = sections.filter((s) => !content.includes(s));
  if (missing.length === 0) {
    console.log(chalk.green("✔ prompts/negocio.md existe con las secciones requeridas"));
  } else {
    console.log(chalk.yellow(`⚠ prompts/negocio.md existe pero faltan secciones: ${missing.join(", ")}`));
  }
} else {
  console.log(chalk.yellow("⚠ prompts/negocio.md no encontrado — el agente usa el prompt genérico. Ejecuta /personaliza"));
}

// ─── Bloque 5: Procesos zombie en Windows ────────────────────────────────────
if (process.platform === "win32") {
  console.log(chalk.cyan("\n── Bloque 5: Procesos Node en Windows ──"));
  try {
    const output = execSync("tasklist /FI \"IMAGENAME eq node.exe\" /NH", { encoding: "utf-8" });
    const lines = output.split("\n").filter((l) => l.includes("node.exe"));
    if (lines.length > 3) {
      console.log(chalk.yellow(`⚠ Se detectaron ${lines.length} procesos node.exe. Si el bot está colgado, ciérralos en el Administrador de Tareas.`));
    } else {
      console.log(chalk.green(`✔ Procesos node.exe: ${lines.length}`));
    }
  } catch {
    console.log(chalk.dim("  (no se pudo listar procesos)"));
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log("");
if (issues === 0) {
  console.log(chalk.green(chalk.bold("Todo parece bien. Si el bot sigue sin funcionar, revisa docs/07-errores-comunes.md")));
} else {
  console.log(chalk.red(chalk.bold(`${issues} problema(s) encontrado(s). Corrígelos y vuelve a ejecutar npm run doctor`)));
}
console.log("");
