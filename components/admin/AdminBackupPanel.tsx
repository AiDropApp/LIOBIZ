"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, Download, HardDriveUpload, RefreshCw, Shield, Trash2, Eye } from "lucide-react";

type BackupEntry = {
  id: string;
  filename: string;
  createdAt: string;
  type: "auto" | "manual" | "pre-restore";
  sizeBytes: number;
  stats: {
    users: number;
    portfolioItems: number;
    uploadsFiles: number;
    uploadsBytes: number;
    mediaCenterCards?: number;
    mediaCenterCategories?: number;
  };
  buildId?: string;
  sha256?: string;
};

type RestorePreview = {
  backup: { createdAt: string; stats: BackupEntry["stats"]; buildId?: string };
  current: BackupEntry["stats"];
  buildIdCurrent?: string;
  warnings: string[];
};

const TYPE_LABELS: Record<BackupEntry["type"], string> = {
  auto: "خودکار",
  manual: "دستی",
  "pre-restore": "قبل از بازیابی",
};

const RESTORE_SCOPE_HINTS = {
  full: "دیتابیس (کاربران، سفارش‌ها، تیکت‌ها) + محتوای سایت (لندینگ، صفحات، بلاگ) + مرکز رسانه (دسته‌ها و کارت‌ها) + فایل‌های محلی public/uploads",
  database:
    "فقط liobiz.db: حساب‌ها، سفارش‌ها، فایل‌های سفارش، تیکت‌ها، پیام تماس، اعلان‌ها",
  cms:
    "site-content.json (لندینگ، خدمات، FAQ، پرتفولیوی قدیمی، پشت‌صحنه، همکاران، بلاگ، تم، تنظیمات سایت) + media-center.json (دسته‌ها، کارت‌های رسانه، لینک MyFile)",
  uploads:
    "فقط پوشه public/uploads — تصاویر/فایل‌های آپلود شده روی همین سرور (لوگو، پیوست‌های قدیمی و…)",
  uploadMerge:
    "فایل‌های بک‌آپ روی uploads فعلی کپی می‌شوند؛ فایل‌های جدیدتر حذف نمی‌شوند؛ نام تکراری جایگزین می‌شود.",
  uploadReplace:
    "کل پوشه uploads پاک و فقط محتوای بک‌آپ جایگزین می‌شود — فایل‌های اضافه‌شده بعد از بک‌آپ از بین می‌روند.",
  mediaNote:
    "فایل‌های واقعی MyFile (Files.ir) داخل ZIP نیستند — فقط متادیتا و لینک‌ها. خود فایل‌ها روی MyFile باقی می‌مانند.",
} as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildRestoreForm(restoreFull: boolean, restoreDb: boolean, restoreCms: boolean, restoreUploads: boolean, uploadMode: string) {
  const form = new FormData();
  if (restoreFull) {
    form.set("full", "true");
  } else {
    form.set("database", restoreDb ? "true" : "false");
    form.set("cms", restoreCms ? "true" : "false");
    form.set("uploads", restoreUploads ? "true" : "false");
    form.set("uploadMode", uploadMode);
  }
  return form;
}

export default function AdminBackupPanel({ onToast }: { onToast: (text: string) => void }) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [maxBackups, setMaxBackups] = useState(7);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [restoreFull, setRestoreFull] = useState(true);
  const [restoreDb, setRestoreDb] = useState(true);
  const [restoreCms, setRestoreCms] = useState(true);
  const [restoreUploads, setRestoreUploads] = useState(true);
  const [uploadMode, setUploadMode] = useState<"merge" | "replace">("merge");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/backup", { cache: "no-store" });
    if (!res.ok) {
      onToast("بارگذاری لیست بک‌آپ ناموفق بود.");
      return;
    }
    const data = await res.json();
    setBackups(Array.isArray(data.backups) ? data.backups : []);
    setMaxBackups(data.maxBackups ?? 7);
  }, [onToast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const createBackup = async () => {
    setBusy("create");
    const res = await fetch("/api/admin/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "بک‌آپ ناموفق بود.");
    onToast("بک‌آپ دستی با موفقیت ایجاد شد.");
    load();
  };

  const download = (id: string) => {
    window.location.href = `/api/admin/backup/download?id=${encodeURIComponent(id)}`;
  };

  const loadPreview = async (id: string) => {
    setBusy(`preview-${id}`);
    const res = await fetch(`/api/admin/backup/preview?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "پیش‌نمایش ناموفق بود.");
    setPreviewId(id);
    setPreview(data.preview as RestorePreview);
  };

  const deleteBackup = async (id: string, type: BackupEntry["type"]) => {
    const msg =
      type === "pre-restore"
        ? `حذف snapshot قبل از بازیابی (${id})؟\n\nفقط در صورت اطمینان از restore موفق حذف کنید.`
        : `حذف بک‌آپ ${id}؟`;
    if (!confirm(msg)) return;
    setBusy(`delete-${id}`);
    const res = await fetch(`/api/admin/backup?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "حذف ناموفق بود.");
    if (previewId === id) {
      setPreview(null);
      setPreviewId(null);
    }
    onToast("بک‌آپ حذف شد.");
    setBackups(Array.isArray(data.backups) ? data.backups : []);
  };

  const restoreFromServer = async (id: string) => {
    if (!preview || previewId !== id) {
      await loadPreview(id);
      return;
    }

    const warnText = preview.warnings.join("\n• ");
    const msg = `بازیابی نسخه ${formatDate(preview.backup.createdAt)}؟\n\n• ${warnText}\n\nکد/UI جدید حفظ می‌شود.`;
    if (!confirm(msg)) return;

    setBusy(`restore-${id}`);
    const form = buildRestoreForm(restoreFull, restoreDb, restoreCms, restoreUploads, uploadMode);
    form.set("source", "server");
    form.set("id", id);

    const res = await fetch("/api/admin/backup/restore", { method: "POST", body: form });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "بازیابی ناموفق بود.");
    onToast(data.preRestoreId ? `بازیابی انجام شد. snapshot: ${data.preRestoreId}` : "بازیابی انجام شد.");
    setPreview(null);
    setPreviewId(null);
    load();
  };

  const restoreFromFile = async (file: File) => {
    if (
      !confirm(
        "بازیابی از فایل ZIP؟\n\nکد deploy شده حفظ می‌شود.\nقبل از بازیابی snapshot خودکار گرفته می‌شود.",
      )
    ) {
      return;
    }

    setBusy("restore-file");
    const form = buildRestoreForm(restoreFull, restoreDb, restoreCms, restoreUploads, uploadMode);
    form.set("source", "upload");
    form.set("file", file);

    const res = await fetch("/api/admin/backup/restore", { method: "POST", body: form });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "بازیابی ناموفق بود.");
    onToast("بازیابی از فایل انجام شد.");
    load();
  };

  return (
    <section className="admin-backup" data-testid="admin-backup-panel">
      <div className="dash-hero">
        <h2>
          <Shield size={22} style={{ display: "inline", verticalAlign: "middle", marginLeft: 8 }} />
          بک‌آپ و بازیابی
        </h2>
        <p>
          بک‌آپ فقط <strong>داده</strong> را ذخیره می‌کند — deploy و کد جدید حفظ می‌شود. شامل دیتابیس، CMS،{" "}
          <strong>مرکز رسانه (media-center.json)</strong> و uploads محلی است. حداکثر {maxBackups} نسخه با checksum
          SHA256.
        </p>
        <p className="admin-backup-note">{RESTORE_SCOPE_HINTS.mediaNote}</p>
      </div>

      <div className="admin-backup-actions">
        <button type="button" className="btn-primary" disabled={!!busy} onClick={createBackup}>
          <Database size={16} />
          {busy === "create" ? "در حال ایجاد…" : "بک‌آپ دستی"}
        </button>
        <button type="button" className="btn-outline" disabled={loading} onClick={load}>
          <RefreshCw size={16} />
          بروزرسانی لیست
        </button>
      </div>

      <div className="admin-backup-restore-panel">
        <h3>تنظیمات بازیابی</h3>
        <label className="admin-check admin-backup-restore-option">
          <input type="checkbox" checked={restoreFull} onChange={(e) => setRestoreFull(e.target.checked)} />
          <span>
            <strong>بازیابی کامل (DB + CMS + uploads)</strong>
            <small className="admin-backup-option-hint">{RESTORE_SCOPE_HINTS.full}</small>
          </span>
        </label>
        {restoreFull && (
          <p className="admin-backup-option-hint admin-backup-option-hint--block">
            در بازیابی کامل، uploads با حالت <strong>ادغام (امن‌تر)</strong> بازگردانی می‌شود — فایل‌های جدید حذف
            نمی‌شوند.
          </p>
        )}
        {!restoreFull && (
          <div className="admin-backup-restore-options">
            <label className="admin-check admin-backup-restore-option">
              <input type="checkbox" checked={restoreDb} onChange={(e) => setRestoreDb(e.target.checked)} />
              <span>
                <strong>فقط دیتابیس</strong>
                <small className="admin-backup-option-hint">{RESTORE_SCOPE_HINTS.database}</small>
              </span>
            </label>
            <label className="admin-check admin-backup-restore-option">
              <input type="checkbox" checked={restoreCms} onChange={(e) => setRestoreCms(e.target.checked)} />
              <span>
                <strong>فقط CMS (+ مرکز رسانه)</strong>
                <small className="admin-backup-option-hint">{RESTORE_SCOPE_HINTS.cms}</small>
              </span>
            </label>
            <label className="admin-check admin-backup-restore-option">
              <input type="checkbox" checked={restoreUploads} onChange={(e) => setRestoreUploads(e.target.checked)} />
              <span>
                <strong>فقط uploads</strong>
                <small className="admin-backup-option-hint">{RESTORE_SCOPE_HINTS.uploads}</small>
              </span>
            </label>
            {restoreUploads && (
              <label className="admin-backup-upload-mode">
                <span>حالت uploads:</span>
                <select value={uploadMode} onChange={(e) => setUploadMode(e.target.value as "merge" | "replace")}>
                  <option value="merge">ادغام (امن‌تر)</option>
                  <option value="replace">جایگزینی کامل</option>
                </select>
                <small className="admin-backup-option-hint">
                  {uploadMode === "merge" ? RESTORE_SCOPE_HINTS.uploadMerge : RESTORE_SCOPE_HINTS.uploadReplace}
                </small>
              </label>
            )}
          </div>
        )}
        <div className="admin-backup-upload">
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void restoreFromFile(file);
              e.target.value = "";
            }}
          />
          <button type="button" className="btn-outline" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            <HardDriveUpload size={16} />
            بازیابی از ZIP کامپیوتر
          </button>
        </div>
      </div>

      {preview && previewId && (
        <div className="admin-backup-preview">
          <h3>پیش‌نمایش بازیابی</h3>
          <p>
            بک‌آپ: {formatDate(preview.backup.createdAt)} — کاربران {preview.backup.stats.users} → فعلی{" "}
            {preview.current.users} | پرتفولیو {preview.backup.stats.portfolioItems} → فعلی{" "}
            {preview.current.portfolioItems}
          </p>
          <ul>
            {preview.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <div className="admin-backup-actions">
            <button type="button" className="btn-primary" onClick={() => restoreFromServer(previewId)}>
              تأیید و بازیابی
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setPreview(null);
                setPreviewId(null);
              }}
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="admin-muted">در حال بارگذاری…</p>
      ) : backups.length === 0 ? (
        <p className="admin-muted">هنوز بک‌آپی ثبت نشده.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>نوع</th>
                <th>حجم</th>
                <th>کاربران</th>
                <th>پرتفولیو</th>
                <th>رسانه</th>
                <th>checksum</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id}>
                  <td>{formatDate(b.createdAt)}</td>
                  <td>{TYPE_LABELS[b.type]}</td>
                  <td>{formatBytes(b.sizeBytes)}</td>
                  <td>{b.stats.users}</td>
                  <td>{b.stats.portfolioItems}</td>
                  <td title="کارت / دسته مرکز رسانه">
                    {b.stats.mediaCenterCards ?? 0} / {b.stats.mediaCenterCategories ?? 0}
                  </td>
                  <td title={b.sha256 || ""}>{b.sha256 ? `${b.sha256.slice(0, 10)}…` : "—"}</td>
                  <td className="admin-backup-row-actions">
                    <button type="button" className="btn-sm" onClick={() => download(b.id)} title="دانلود">
                      <Download size={14} />
                    </button>
                    <button type="button" className="btn-sm" onClick={() => loadPreview(b.id)} title="پیش‌نمایش">
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-warning"
                      disabled={busy === `restore-${b.id}`}
                      onClick={() => restoreFromServer(b.id)}
                    >
                      بازیابی
                    </button>
                    <button type="button" className="btn-sm" onClick={() => deleteBackup(b.id, b.type)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
