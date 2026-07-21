import { execSync } from "child_process";
import { rmSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..");

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -aon | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set(
        out
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid)),
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        } catch {
          /* already gone */
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore", shell: true });
    }
  } catch {
    /* nothing listening */
  }
}

killPort(3001);
try {
  rmSync(join(root, ".next"), { recursive: true, force: true });
} catch {
  /* ok */
}

console.log("Starting http://localhost:3001 ...");
execSync("pnpm dev", { cwd: root, stdio: "inherit" });
