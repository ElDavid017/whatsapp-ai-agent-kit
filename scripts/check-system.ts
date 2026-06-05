import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// NOTE: Does NOT import env-loader — runs without .env.local

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

function ok(msg: string) { console.log(`${GREEN}✔${RESET} ${msg}`); }
function fail(msg: string) { console.log(`${RED}✘${RESET} ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠${RESET} ${msg}`); }

let failures = 0;

console.log(`\n${BOLD}WhatsApp AI Agent Kit — Verificación del sistema${RESET}\n`);

// 1. Node >= 20
const nodeVer = process.versions.node;
const [nodeMajor] = nodeVer.split(".").map(Number);
if (nodeMajor >= 20) {
  ok(`Node.js ${nodeVer} (≥ 20 requerido)`);
} else {
  fail(`Node.js ${nodeVer} — se requiere ≥ 20. Usa nvm: nvm install 22`);
  failures++;
}

// 2. SO soportado
const platform = process.platform;
if (["linux", "darwin", "win32"].includes(platform)) {
  ok(`Sistema operativo: ${platform}`);
} else {
  warn(`Sistema operativo desconocido: ${platform}`);
}

// 3. npm presente
try {
  const npmVer = execSync("npm --version", { encoding: "utf-8" }).trim();
  ok(`npm ${npmVer} encontrado`);
} catch {
  fail("npm no encontrado en el PATH");
  failures++;
}

// 4. Espacio en disco >= 500 MB
try {
  const stat = fs.statfsSync(process.cwd());
  const freeMB = (stat.bavail * stat.bsize) / (1024 * 1024);
  if (freeMB >= 500) {
    ok(`Espacio libre: ${Math.round(freeMB)} MB`);
  } else {
    fail(`Espacio libre insuficiente: ${Math.round(freeMB)} MB (se requieren ≥ 500 MB)`);
    failures++;
  }
} catch {
  warn("No se pudo verificar el espacio en disco");
}

// 5. Estructura del kit
const requiredFiles = [
  "package.json",
  path.join("src", "lib", "db.ts"),
  path.join("scripts", "start-bot.ts"),
];
let structOk = true;
for (const f of requiredFiles) {
  if (!fs.existsSync(path.resolve(process.cwd(), f))) {
    fail(`Fichero requerido no encontrado: ${f}`);
    failures++;
    structOk = false;
  }
}
if (structOk) ok("Estructura del proyecto correcta");

// 6. .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  if (content.includes("OPENROUTER_API_KEY=sk-or-")) {
    ok(".env.local encontrado con OPENROUTER_API_KEY configurada");
  } else {
    warn(".env.local encontrado pero OPENROUTER_API_KEY parece vacía o inválida");
  }
} else {
  warn(".env.local no encontrado. Copia .env.example a .env.local y rellena los valores.");
}

// 7. node_modules
const nodeModulesPath = path.resolve(process.cwd(), "node_modules");
if (fs.existsSync(nodeModulesPath)) {
  ok("node_modules encontrado");
} else {
  warn("node_modules no encontrado — ejecuta: npm install");
}

console.log("");
if (failures === 0) {
  console.log(`${GREEN}${BOLD}Sistema listo.${RESET}`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}${failures} problema(s) encontrado(s). Revisa los errores arriba.${RESET}`);
  process.exit(1);
}
