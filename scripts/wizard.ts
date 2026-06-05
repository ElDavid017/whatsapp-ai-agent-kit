import "./env-loader.js";
import fs from "fs";
import path from "path";
import { execSync, spawn } from "child_process";
import chalk from "chalk";
import boxen from "boxen";
// @ts-expect-error enquirer types
import { Input } from "enquirer";

// ─── Banner ───────────────────────────────────────────────────────────────────
console.log(
  boxen(
    chalk.bold.white("WhatsApp AI Agent Kit") +
      "\n" +
      chalk.dim("Asistente de configuración — fallback sin Claude Code"),
    { padding: 1, margin: 1, borderStyle: "round", borderColor: "green" }
  )
);

// ─── Fase A: Checks previos ───────────────────────────────────────────────────
console.log(chalk.cyan("\n── Fase A: Verificación del sistema ──\n"));

const nodeVer = process.versions.node;
const [nodeMajor] = nodeVer.split(".").map(Number);
if (nodeMajor < 20) {
  console.log(chalk.red(`Node.js ${nodeVer} detectado. Se requiere ≥ 20.`));
  console.log("Instala Node 22 con nvm: nvm install 22 && nvm use 22");
  process.exit(1);
}
console.log(chalk.green(`✔ Node.js ${nodeVer}`));
console.log(chalk.green(`✔ SO: ${process.platform}`));

// ─── Fase B: Instalación de dependencias ─────────────────────────────────────
console.log(chalk.cyan("\n── Fase B: Dependencias ──\n"));

const nodeModulesPath = path.resolve(process.cwd(), "node_modules");
if (!fs.existsSync(nodeModulesPath)) {
  console.log("Instalando dependencias (npm install)...");
  try {
    execSync("npm install", { stdio: "inherit" });
    console.log(chalk.green("✔ Dependencias instaladas"));
  } catch {
    console.log(chalk.red("✘ Error en npm install. Revisa los errores arriba."));
    process.exit(1);
  }
} else {
  console.log(chalk.green("✔ node_modules ya existe"));
}

// ─── Fase C: API Key de OpenRouter ───────────────────────────────────────────
console.log(chalk.cyan("\n── Fase C: API Key de OpenRouter ──\n"));

const envPath = path.resolve(process.cwd(), ".env.local");
const envExamplePath = path.resolve(process.cwd(), ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("Creado .env.local desde .env.example");
}

let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
const existingKey = process.env.OPENROUTER_API_KEY;

if (existingKey?.startsWith("sk-or-")) {
  console.log(chalk.green("✔ OPENROUTER_API_KEY ya configurada"));
} else {
  console.log(
    "Obtén tu API key en " +
      chalk.underline("https://openrouter.ai/keys") +
      " (formato: sk-or-v1-...)"
  );

  const prompt = new Input({
    name: "apiKey",
    message: "Pega tu API key de OpenRouter:",
    validate: (v: string) =>
      v.startsWith("sk-or-") ? true : "La key debe empezar con sk-or-",
  });

  let apiKey: string;
  try {
    apiKey = await prompt.run();
  } catch {
    console.log(chalk.yellow("\nCancelado."));
    process.exit(0);
  }

  const keyRegex = new RegExp("^OPENROUTER_API_KEY=.*$", "m");
  if (keyRegex.test(envContent)) {
    envContent = envContent.replace(keyRegex, `OPENROUTER_API_KEY=${apiKey}`);
  } else {
    envContent += `\nOPENROUTER_API_KEY=${apiKey}\n`;
  }
  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log(chalk.green("✔ API key guardada en .env.local"));
}

// ─── Fase D: Arrancar el bot ──────────────────────────────────────────────────
console.log(chalk.cyan("\n── Fase D: Arrancar el agente ──\n"));
console.log("Arrancando el bot y el panel web...");
console.log(chalk.dim("Abre http://localhost:3000 para escanear el QR de WhatsApp"));
console.log(chalk.dim("Pulsa Ctrl+C para detener.\n"));

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npmCmd, ["run", "start:all"], { stdio: "inherit" });

child.on("error", (e) => {
  console.log(chalk.red("Error al arrancar: " + e.message));
  process.exit(1);
});
