// Spawn the FastAPI backend with uvicorn --reload.
//
// Picks the Python interpreter in this order:
//   1. $POLICYMATE_PYTHON env override
//   2. backend/.venv/Scripts/python.exe  (Windows venv)
//   3. backend/.venv/bin/python          (Unix venv)
//   4. system `python` on PATH
//
// Designed to be run from the frontend directory via `npm run dev:backend`
// (and indirectly via `npm run dev` which uses `concurrently`).

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, "..", "..", "backend");

if (!existsSync(backendDir)) {
  console.error(`[backend] Backend directory not found at ${backendDir}`);
  process.exit(1);
}

const isWin = process.platform === "win32";
const venvPython = isWin
  ? join(backendDir, ".venv", "Scripts", "python.exe")
  : join(backendDir, ".venv", "bin", "python");

const python =
  process.env.POLICYMATE_PYTHON ||
  (existsSync(venvPython) ? venvPython : isWin ? "python.exe" : "python");

if (!existsSync(venvPython) && !process.env.POLICYMATE_PYTHON) {
  console.warn(
    `[backend] No virtualenv found at ${venvPython}. Falling back to system "python".`,
  );
  console.warn(
    "[backend] If uvicorn is missing, run from backend/: python -m venv .venv && pip install -r requirements.txt",
  );
}

const host = process.env.BACKEND_HOST || "127.0.0.1";
const port = process.env.BACKEND_PORT || "8000";

console.log(`[backend] Starting uvicorn on http://${host}:${port}`);
console.log(`[backend] Python: ${python}`);
console.log(`[backend] CWD:    ${backendDir}\n`);

const child = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--reload", "--host", host, "--port", port],
  { cwd: backendDir, stdio: "inherit", shell: false },
);

child.on("error", (err) => {
  console.error(`[backend] Failed to start: ${err.message}`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 0));

// Forward signals so Ctrl+C in concurrently kills uvicorn cleanly.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}
