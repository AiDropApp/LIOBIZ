import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { access, readFile, writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { createTestRoot, destroyTestRoot } from "./helpers/test-root";

const SAMPLE_MEDIA_CENTER = {
  version: 1,
  rootFolderId: 1000,
  sectionFolderIds: { portfolio: 2000, backstage: 2001, "creative-partners": 2002, blog: 2003 },
  categories: [
    {
      id: "cat-test",
      createdAt: "2026-01-01T00:00:00.000Z",
      section: "portfolio",
      name: "تست بک‌آپ",
      slug: "test-backup",
      folderId: 3000,
      sortOrder: 0,
    },
  ],
  cards: [
    {
      id: "card-test",
      section: "portfolio",
      categoryId: "cat-test",
      title: "کارت تست",
      description: "for backup test",
      caption: "",
      role: "",
      city: "",
      cover: null,
      video: null,
      image: null,
      avatar: null,
      sortOrder: 0,
      published: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

describe("backup engine", () => {
  let testRoot: string;

  beforeEach(async () => {
    testRoot = await createTestRoot();
    process.env.LIOBIZ_TEST_ROOT = testRoot;
    vi.resetModules();
    const { getDb } = await import("@/lib/db");
    getDb();
    const { readSiteContent } = await import("@/lib/content-store");
    await readSiteContent();
  });

  afterEach(async () => {
    const { closeDb } = await import("@/lib/db");
    closeDb();
    vi.resetModules();
    await destroyTestRoot(testRoot);
  });

  async function backupMod() {
    return import("@/lib/backup");
  }

  async function seedMediaCenter() {
    await writeFile(
      path.join(testRoot, "data", "media-center.json"),
      JSON.stringify(SAMPLE_MEDIA_CENTER, null, 2),
      "utf8",
    );
  }

  async function seedUpload(relPath: string, content: string) {
    const full = path.join(testRoot, "public", "uploads", relPath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  async function insertContactMessage(message: string) {
    const { getDb } = await import("@/lib/db");
    const { contactMessages } = await import("@/lib/db/schema");
    getDb()
      .insert(contactMessages)
      .values({
        name: "تست",
        email: "backup-test@liobiz.com",
        phone: "09120000000",
        message,
        status: "new",
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  async function hasContactMessage(message: string): Promise<boolean> {
    const { getDb } = await import("@/lib/db");
    const { contactMessages } = await import("@/lib/db/schema");
    return getDb()
      .select()
      .from(contactMessages)
      .all()
      .some((row) => row.message === message);
  }

  describe("create & list", () => {
    it("creates manual backup with manifest and sha256", async () => {
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      expect(entry.filename).toMatch(/manual\.zip$/);
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.includes).toEqual(["database", "cms", "uploads"]);

      const list = await backup.listBackups();
      expect(list.some((b) => b.id === entry.id)).toBe(true);
    });

    it("records media-center stats when media-center.json exists", async () => {
      await seedMediaCenter();
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      expect(entry.stats.mediaCenterCards).toBe(1);
      expect(entry.stats.mediaCenterCategories).toBe(1);
    });

    it("auto backup skips duplicate same-day entry", async () => {
      const backup = await backupMod();
      const first = await backup.runAutoBackupIfNeeded();
      const second = await backup.runAutoBackupIfNeeded();

      expect(first.skipped).toBe(false);
      expect(second.skipped).toBe(true);
    });
  });

  describe("zip structure", () => {
    it("contains database, cms, manifest and optional media-center", async () => {
      await seedMediaCenter();
      await seedUpload("backup-fixture.txt", "fixture-content");

      const backup = await backupMod();
      const entry = await backup.createBackup("manual");
      const zip = new AdmZip(backup.getBackupPath(entry.filename));
      const manifest = backup.verifyBackupStructure(zip);

      expect(manifest.version).toBe(1);
      expect(manifest.includes).toContain("database");
      expect(manifest.includes).toContain("cms");
      expect(manifest.includes).toContain("uploads");
      expect(zip.getEntry("data/liobiz.db")).toBeTruthy();
      expect(zip.getEntry("data/site-content.json")).toBeTruthy();
      expect(zip.getEntry("data/media-center.json")).toBeTruthy();
      expect(zip.getEntry("uploads/backup-fixture.txt")).toBeTruthy();
      expect(zip.getEntry(backup.BACKUP_MANIFEST)).toBeTruthy();
    });

    it("rejects zip without manifest", async () => {
      const backup = await backupMod();
      const zip = new AdmZip();
      zip.addFile("readme.txt", Buffer.from("not a backup"));

      expect(() => backup.verifyBackupStructure(zip)).toThrow(/manifest/);
    });

    it("rejects manifest claiming database without db file", async () => {
      const backup = await backupMod();
      const zip = new AdmZip();
      zip.addFile(
        backup.BACKUP_MANIFEST,
        Buffer.from(
          JSON.stringify({
            version: 1,
            createdAt: new Date().toISOString(),
            type: "manual",
            includes: ["database", "cms", "uploads"],
            stats: { users: 0, portfolioItems: 0, uploadsFiles: 0, uploadsBytes: 0 },
          }),
        ),
      );
      zip.addFile("data/site-content.json", Buffer.from("{}"));

      expect(() => backup.verifyBackupStructure(zip)).toThrow(/دیتابیس/);
    });
  });

  describe("preview", () => {
    it("returns warnings array", async () => {
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");
      const preview = await backup.previewRestore(entry.filename);

      expect(preview.backup).toBeDefined();
      expect(preview.current).toBeDefined();
      expect(Array.isArray(preview.warnings)).toBe(true);
      expect(preview.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("restore scopes", () => {
    it("restores database only without touching cms", async () => {
      await insertContactMessage("marker-in-backup");
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      await insertContactMessage("added-after-backup");
      expect(await hasContactMessage("added-after-backup")).toBe(true);

      const cmsPath = path.join(testRoot, "data", "site-content.json");
      const cmsBefore = await readFile(cmsPath, "utf8");
      await writeFile(
        cmsPath,
        JSON.stringify({ ...JSON.parse(cmsBefore), __dbRestoreProbe: "changed" }),
        "utf8",
      );

      const { closeDb } = await import("@/lib/db");
      closeDb();

      await backup.restoreBackupFile(entry.filename, {
        database: true,
        cms: false,
        uploads: false,
        uploadMode: "merge",
      });

      expect(await hasContactMessage("marker-in-backup")).toBe(true);
      expect(await hasContactMessage("added-after-backup")).toBe(false);
      const cmsAfter = JSON.parse(await readFile(cmsPath, "utf8"));
      expect(cmsAfter.__dbRestoreProbe).toBe("changed");
    });

    it("restores cms only and merges with code defaults", async () => {
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      const cmsPath = path.join(testRoot, "data", "site-content.json");
      const parsed = JSON.parse(await readFile(cmsPath, "utf8"));
      parsed.__testMarker = "before-restore";
      await writeFile(cmsPath, JSON.stringify(parsed), "utf8");

      await backup.restoreBackupFile(entry.filename, {
        database: false,
        cms: true,
        uploads: false,
        uploadMode: "merge",
      });

      const after = JSON.parse(await readFile(cmsPath, "utf8"));
      expect(after.__testMarker).toBeUndefined();
      expect(after.portfolio).toBeDefined();
      expect(after.landing).toBeDefined();
    });

    it("restores media-center.json when cms scope is selected", async () => {
      await seedMediaCenter();
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      await writeFile(path.join(testRoot, "data", "media-center.json"), JSON.stringify({ version: 1, categories: [], cards: [] }), "utf8");

      await backup.restoreBackupFile(entry.filename, {
        database: false,
        cms: true,
        uploads: false,
        uploadMode: "merge",
      });

      const restored = JSON.parse(await readFile(path.join(testRoot, "data", "media-center.json"), "utf8"));
      expect(restored.cards).toHaveLength(1);
      expect(restored.cards[0].title).toBe("کارت تست");
    });

    it("leaves media-center untouched when backup has no media-center file", async () => {
      await seedMediaCenter();
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      const zipPath = backup.getBackupPath(entry.filename);
      const zip = new AdmZip(zipPath);
      zip.deleteFile("data/media-center.json");
      const legacyPath = `${zipPath}.legacy.zip`;
      zip.writeZip(legacyPath);

      await writeFile(
        path.join(testRoot, "data", "media-center.json"),
        JSON.stringify({ version: 1, categories: [], cards: [], wiped: true }),
        "utf8",
      );

      await backup.restoreBackupFile(path.basename(legacyPath), {
        database: false,
        cms: true,
        uploads: false,
        uploadMode: "merge",
      });

      const current = JSON.parse(await readFile(path.join(testRoot, "data", "media-center.json"), "utf8"));
      expect(current.wiped).toBe(true);
      await rm(legacyPath, { force: true });
    });

    it("merge uploads keeps newer files and restores backed-up versions", async () => {
      await seedUpload("merge-test.txt", "original");
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      await seedUpload("merge-test.txt", "modified");
      await seedUpload("new-after-backup.txt", "still-here");

      await backup.restoreBackupFile(entry.filename, {
        database: false,
        cms: false,
        uploads: true,
        uploadMode: "merge",
      });

      expect(await readFile(path.join(testRoot, "public", "uploads", "merge-test.txt"), "utf8")).toBe("original");
      expect(await readFile(path.join(testRoot, "public", "uploads", "new-after-backup.txt"), "utf8")).toBe(
        "still-here",
      );
    });

    it("replace uploads removes files added after backup", async () => {
      await seedUpload("replace-test.txt", "original");
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      await seedUpload("replace-test.txt", "modified");
      await seedUpload("gone-after-replace.txt", "temporary");

      await backup.restoreBackupFile(entry.filename, {
        database: false,
        cms: false,
        uploads: true,
        uploadMode: "replace",
      });

      expect(await readFile(path.join(testRoot, "public", "uploads", "replace-test.txt"), "utf8")).toBe("original");
      await expect(access(path.join(testRoot, "public", "uploads", "gone-after-replace.txt"))).rejects.toThrow();
    });

    it("full restore reverts database, cms and uploads together", async () => {
      await seedMediaCenter();
      await seedUpload("full-restore.txt", "original");
      await insertContactMessage("full-backup-marker");

      const backup = await backupMod();
      const entry = await backup.createBackup("manual");

      await insertContactMessage("after-full-backup");
      await seedUpload("full-restore.txt", "changed");
      await seedUpload("full-new.txt", "extra");
      await writeFile(
        path.join(testRoot, "data", "media-center.json"),
        JSON.stringify({ version: 1, categories: [], cards: [] }),
        "utf8",
      );

      const { closeDb } = await import("@/lib/db");
      closeDb();

      const result = await backup.restoreBackupFile(entry.filename, backup.FULL_RESTORE);
      expect(result.preRestoreId).toMatch(/pre-restore/);

      expect(await hasContactMessage("full-backup-marker")).toBe(true);
      expect(await hasContactMessage("after-full-backup")).toBe(false);
      expect(await readFile(path.join(testRoot, "public", "uploads", "full-restore.txt"), "utf8")).toBe("original");
      expect(await readFile(path.join(testRoot, "public", "uploads", "full-new.txt"), "utf8")).toBe("extra");

      const media = JSON.parse(await readFile(path.join(testRoot, "data", "media-center.json"), "utf8"));
      expect(media.cards).toHaveLength(1);

      const list = await backup.listBackups();
      expect(list.some((b) => b.id === result.preRestoreId)).toBe(true);
    });
  });

  describe("integrity & safety", () => {
    it("rejects restore when checksum does not match meta", async () => {
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");
      const full = backup.getBackupPath(entry.filename);
      const buf = Buffer.from(await readFile(full));
      buf[buf.length - 1] ^= 0xff;
      await writeFile(full, buf);

      await expect(
        backup.restoreBackupFile(entry.filename, backup.FULL_RESTORE),
      ).rejects.toThrow(/checksum/);
    });

    it("creates pre-restore snapshot before restore", async () => {
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");
      const before = (await backup.listBackups()).length;

      await backup.restoreBackupFile(entry.filename, {
        database: false,
        cms: true,
        uploads: false,
        uploadMode: "merge",
      });

      const after = await backup.listBackups();
      expect(after.length).toBeGreaterThanOrEqual(before + 1);
      expect(after.some((b) => b.type === "pre-restore")).toBe(true);
    });

    it("hashBuffer produces stable sha256", async () => {
      const backup = await backupMod();
      const a = backup.hashBuffer(Buffer.from("liobiz-backup-test"));
      const b = backup.hashBuffer(Buffer.from("liobiz-backup-test"));
      expect(a).toBe(b);
      expect(a).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("lifecycle", () => {
    it("deletes backup and meta sidecar", async () => {
      const backup = await backupMod();
      const entry = await backup.createBackup("manual");
      await backup.deleteBackup(entry.filename);
      const list = await backup.listBackups();
      expect(list.some((b) => b.id === entry.id)).toBe(false);
      await expect(access(path.join(testRoot, "data", "backups", `${entry.filename}.meta.json`))).rejects.toThrow();
    });

    it("rotateBackups keeps at most MAX_BACKUPS", async () => {
      const backup = await backupMod();
      const backupsDir = path.join(testRoot, "data", "backups");
      await backup.ensureBackupsDir();
      for (let i = 0; i < backup.MAX_BACKUPS + 3; i++) {
        await writeFile(path.join(backupsDir, `fake-${String(i).padStart(2, "0")}.zip`), Buffer.from("PK"));
        await new Promise((r) => setTimeout(r, 5));
      }
      await backup.rotateBackups();
      const { readdir } = await import("fs/promises");
      const zips = (await readdir(backupsDir)).filter((f) => f.endsWith(".zip"));
      expect(zips.length).toBeLessThanOrEqual(backup.MAX_BACKUPS);
    });

    it("getBackupPath rejects path traversal and invalid names", async () => {
      const backup = await backupMod();
      expect(() => backup.getBackupPath("../escape.zip")).toThrow(/نامعتبر/);
      expect(() => backup.getBackupPath("not-a-backup.txt")).toThrow(/نامعتبر/);
      expect(backup.getBackupPath("valid-backup.zip")).toContain("valid-backup.zip");
    });
  });
});

describe("backup restore API scope parsing", () => {
  it("FULL_RESTORE enables all sections with merge uploads", async () => {
    const { FULL_RESTORE } = await import("@/lib/backup");
    expect(FULL_RESTORE).toEqual({
      database: true,
      cms: true,
      uploads: true,
      uploadMode: "merge",
    });
  });
});
