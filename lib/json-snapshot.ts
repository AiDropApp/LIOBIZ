import { promises as fs } from "fs";
import path from "path";
import { getDataDir } from "@/lib/paths";

const MAX_SNAPSHOTS_PER_FILE = 40;

/** Copy current JSON to data/snapshots before overwrite so edits/crashes don't wipe history. */
export async function snapshotJsonFile(filePath: string, label: string) {
  try {
    await fs.access(filePath);
  } catch {
    return;
  }

  const dir = path.join(getDataDir(), "snapshots", label);
  await fs.mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(dir, `${label}-${stamp}.json`);
  await fs.copyFile(filePath, dest);

  const files = (await fs.readdir(dir))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .reverse();

  for (const old of files.slice(MAX_SNAPSHOTS_PER_FILE)) {
    await fs.unlink(path.join(dir, old)).catch(() => undefined);
  }
}
