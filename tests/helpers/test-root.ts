import { mkdtemp, rm, cp, mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";

export async function createTestRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "liobiz-test-"));
  await mkdir(path.join(root, "data"), { recursive: true });
  await mkdir(path.join(root, "public", "uploads"), { recursive: true });

  const prodData = path.join(process.cwd(), "data");
  const prodDb = path.join(prodData, "liobiz.db");
  const prodCms = path.join(prodData, "site-content.json");
  const prodUploads = path.join(process.cwd(), "public", "uploads");

  try {
    await cp(prodDb, path.join(root, "data", "liobiz.db"));
  } catch {
    // seeded on first getDb()
  }

  try {
    await cp(prodCms, path.join(root, "data", "site-content.json"));
  } catch {
    await writeFile(path.join(root, "data", "site-content.json"), "{}", "utf8");
  }

  try {
    await cp(prodUploads, path.join(root, "public", "uploads"), { recursive: true });
  } catch {
    // empty uploads ok
  }

  return root;
}

export async function destroyTestRoot(root: string) {
  delete process.env.LIOBIZ_TEST_ROOT;
  await rm(root, { recursive: true, force: true });
}
