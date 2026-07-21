import path from "path";

/** Project root — override with LIOBIZ_TEST_ROOT in tests. */
export function getProjectRoot(): string {
  return process.env.LIOBIZ_TEST_ROOT || process.cwd();
}

export function getDataDir(): string {
  return path.join(getProjectRoot(), "data");
}

export function getUploadsDir(): string {
  return path.join(getProjectRoot(), "public", "uploads");
}

export function getBackupsDir(): string {
  return path.join(getDataDir(), "backups");
}
