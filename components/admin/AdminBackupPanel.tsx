"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LtrIsolate } from "@/lib/ltr-text";
import {
  Cloud,
  Database,
  Download,
  HardDriveUpload,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";

type TabId = "auto" | "manual" | "golden" | "recovery";

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
  sha256?: string;
};

type GoldenSet = {
  setId: string;
  dayFolder?: string;
  createdAt: string;
  totalBytes: number;
  parts: number;
  fileCount: number;
  hasManifest: boolean;
  complete?: boolean;
};

type GoldenStatus = {
  state: "idle" | "running" | "success" | "error";
  finishedAt?: string;
  filename?: string;
  message?: string;
};

type GoldenRestoreStatus = {
  state: "idle" | "running" | "success" | "error";
  setId?: string;
  message?: string;
  finishedAt?: string;
};

type RestoreSource = "server-auto" | "server-manual" | "myfiles" | "computer";

type RestorePreview = {
  backup: { createdAt: string; stats: BackupEntry["stats"] };
  current: BackupEntry["stats"];
  warnings: string[];
};

const RESTORE_HINTS = {
  zipScope:
    "ZIP شامل ویدیو/عکس portfolio نیست — فقط DB، CMS، media-center و uploads. برای media کامل از Golden استفاده کنید.",
  goldenFull:
    "Golden Backup کل پروژه را بازمی‌گرداند (media، DB، CMS، کد). پس از اتمام سرویس liobiz را restart کنید.",
} as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildRestoreForm(
  restoreFull: boolean,
  restoreDb: boolean,
  restoreCms: boolean,
  restoreUploads: boolean,
  uploadMode: string,
) {
  const form = new FormData();
  if (restoreFull) form.set("full", "true");
  else {
    form.set("database", restoreDb ? "true" : "false");
    form.set("cms", restoreCms ? "true" : "false");
    form.set("uploads", restoreUploads ? "true" : "false");
    form.set("uploadMode", uploadMode);
  }
  return form;
}

function StageProgress({
  title,
  steps,
  activeIndex,
  state,
  errorMessage,
}: {
  title: string;
  steps: string[];
  activeIndex: number;
  state: "idle" | "running" | "success" | "error";
  errorMessage?: string;
}) {
  if (state === "idle") return null;
  return (
    <div className="admin-backup-preview" style={{ marginTop: "0.75rem" }}>
      <h3>{title}</h3>
      <ol style={{ margin: 0, paddingInlineStart: "1.25rem", display: "grid", gap: ".35rem" }}>
        {steps.map((step, i) => {
          let icon = "○";
          if (state === "success") icon = "✓";
          else if (state === "error" && i <= activeIndex) icon = i === activeIndex ? "✕" : "✓";
          else if (state === "running") {
            if (i < activeIndex) icon = "✓";
            else if (i === activeIndex) icon = "→";
          }
          return (
            <li key={step} style={{ opacity: state === "running" && i > activeIndex ? 0.5 : 1 }}>
              {icon} {step}
              {state === "running" && i === activeIndex && (
                <Loader2 size={14} style={{ display: "inline", marginInlineStart: 6, verticalAlign: "middle" }} className="spin" />
              )}
            </li>
          );
        })}
      </ol>
      {state === "error" && errorMessage && (
        <p className="admin-muted" style={{ color: "var(--danger, #c00)", marginTop: ".5rem" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function ZipBackupTable({
  rows,
  onDownload,
  onDelete,
  showDelete,
}: {
  rows: BackupEntry[];
  onDownload: (id: string) => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}) {
  if (!rows.length) {
    return (
      <div className="dash-empty">
        <p className="admin-muted">موردی ثبت نشده.</p>
      </div>
    );
  }
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>تاریخ</th>
            <th>حجم</th>
            <th>کاربران</th>
            <th>رسانه (کارت/دسته)</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>{formatDate(b.createdAt)}</td>
              <td><LtrIsolate as="span">{formatBytes(b.sizeBytes)}</LtrIsolate></td>
              <td>{b.stats.users}</td>
              <td>
                {b.stats.mediaCenterCards ?? 0} / {b.stats.mediaCenterCategories ?? 0}
              </td>
              <td className="admin-backup-row-actions">
                <button type="button" className="btn-sm" onClick={() => onDownload(b.id)} title="دانلود">
                  <Download size={14} /> دانلود
                </button>
                {showDelete && onDelete && (
                  <button type="button" className="btn-sm" onClick={() => onDelete(b.id)} title="حذف">
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminBackupPanel({ onToast }: { onToast: (text: string) => void }) {
  const [tab, setTab] = useState<TabId>("auto");
  const [autoBackups, setAutoBackups] = useState<BackupEntry[]>([]);
  const [manualBackup, setManualBackup] = useState<BackupEntry | null>(null);
  const [maxAutoBackups, setMaxAutoBackups] = useState(3);
  const [goldenSets, setGoldenSets] = useState<GoldenSet[]>([]);
  const [maxGoldenBackups, setMaxGoldenBackups] = useState(2);
  const [goldenStatus, setGoldenStatus] = useState<GoldenStatus>({ state: "idle" });
  const [goldenRestoreStatus, setGoldenRestoreStatus] = useState<GoldenRestoreStatus>({ state: "idle" });
  const [goldenRunning, setGoldenRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const [restoreSource, setRestoreSource] = useState<RestoreSource>("server-auto");
  const [selectedAutoId, setSelectedAutoId] = useState("");
  const [selectedManualId, setSelectedManualId] = useState("");
  const [selectedGoldenId, setSelectedGoldenId] = useState("");
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [previewBackupId, setPreviewBackupId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [restoreFull, setRestoreFull] = useState(true);
  const [restoreDb, setRestoreDb] = useState(true);
  const [restoreCms, setRestoreCms] = useState(true);
  const [restoreUploads, setRestoreUploads] = useState(true);
  const [uploadMode, setUploadMode] = useState<"merge" | "replace">("merge");

  const loadZipBackups = useCallback(async () => {
    const res = await fetch("/api/admin/backup", { cache: "no-store" });
    if (!res.ok) {
      onToast("بارگذاری لیست بک‌آپ ناموفق بود.");
      return;
    }
    const data = await res.json();
    const auto = Array.isArray(data.autoBackups) ? data.autoBackups : [];
    setAutoBackups(auto);
    setManualBackup(data.manualBackup ?? null);
    setMaxAutoBackups(data.maxAutoBackups ?? 3);
    if (auto.length && !selectedAutoId) setSelectedAutoId(auto[0].id);
    if (data.manualBackup && !selectedManualId) setSelectedManualId(data.manualBackup.id);
  }, [onToast, selectedAutoId, selectedManualId]);

  const loadGolden = useCallback(async () => {
    const [goldenRes, restoreRes] = await Promise.all([
      fetch("/api/admin/backup/golden", { cache: "no-store" }),
      fetch("/api/admin/backup/golden/restore", { cache: "no-store" }),
    ]);
    if (goldenRes.ok) {
      const data = await goldenRes.json();
      const sets = Array.isArray(data.sets) ? data.sets : [];
      setGoldenSets(sets);
      setMaxGoldenBackups(data.maxGoldenBackups ?? 2);
      setGoldenStatus(data.status ?? { state: "idle" });
      setGoldenRunning(Boolean(data.running));
      if (sets.length && !selectedGoldenId) setSelectedGoldenId(sets[0].setId);
    }
    if (restoreRes.ok) {
      const data = await restoreRes.json();
      setGoldenRestoreStatus(data.status ?? { state: "idle" });
    }
  }, [selectedGoldenId]);

  const load = useCallback(async () => {
    await Promise.all([loadZipBackups(), loadGolden()]);
  }, [loadZipBackups, loadGolden]);

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

  useEffect(() => {
    if (goldenStatus.state !== "running" && goldenRestoreStatus.state !== "running") return;
    const timer = setInterval(() => void loadGolden(), 6000);
    return () => clearInterval(timer);
  }, [goldenStatus.state, goldenRestoreStatus.state, loadGolden]);

  useEffect(() => {
    setPreview(null);
    setPreviewBackupId("");
    setPendingFile(null);
  }, [restoreSource, selectedAutoId, selectedManualId, selectedGoldenId]);

  const createManualBackup = async () => {
    setBusy("create-manual");
    const res = await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "بک‌آپ ناموفق بود.");
    onToast("آخرین بک‌آپ دستی ذخیره شد.");
    await loadZipBackups();
    if (data.backup?.id) setSelectedManualId(data.backup.id);
  };

  const startGoldenBackup = async () => {
    if (!confirm("Golden Backup (~۵GB) ساخته و به MyFiles ارسال می‌شود.\n\n۱۵–۳۰ دقیقه طول می‌کشد.\nادامه؟")) return;
    setBusy("golden-backup");
    const res = await fetch("/api/admin/backup/golden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "شروع Golden ناموفق بود.");
    onToast(data.message || "Golden Backup شروع شد.");
    loadGolden();
  };

  const download = (id: string) => {
    window.location.href = `/api/admin/backup/download?id=${encodeURIComponent(id)}`;
  };

  const deleteManual = async (id: string) => {
    if (!confirm("حذف بک‌آپ دستی؟")) return;
    setBusy("delete-manual");
    const res = await fetch(`/api/admin/backup?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "حذف ناموفق بود.");
    onToast("بک‌آپ دستی حذف شد.");
    setManualBackup(data.manualBackup ?? null);
    setSelectedManualId("");
  };

  const loadZipPreview = async (backupId: string) => {
    setBusy("preview");
    const res = await fetch(`/api/admin/backup/preview?id=${encodeURIComponent(backupId)}`, { cache: "no-store" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "پیش‌نمایش ناموفق بود.");
    setPreview(data.preview as RestorePreview);
    setPreviewBackupId(backupId);
  };

  const runZipRestore = async (backupId: string) => {
    setBusy("restore-zip");
    const form = buildRestoreForm(restoreFull, restoreDb, restoreCms, restoreUploads, uploadMode);
    form.set("source", "server");
    form.set("id", backupId);
    const res = await fetch("/api/admin/backup/restore", { method: "POST", body: form });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "بازیابی ناموفق بود.");
    onToast("بازیابی ZIP انجام شد.");
    setPreview(null);
    loadZipBackups();
  };

  const runZipRestoreFromFile = async (file: File) => {
    setBusy("restore-file");
    const form = buildRestoreForm(restoreFull, restoreDb, restoreCms, restoreUploads, uploadMode);
    form.set("source", "upload");
    form.set("file", file);
    const res = await fetch("/api/admin/backup/restore", { method: "POST", body: form });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "بازیابی ناموفق بود.");
    onToast("بازیابی از فایل انجام شد.");
    setPendingFile(null);
    loadZipBackups();
  };

  const runGoldenRestore = async () => {
    if (!selectedGoldenId) return onToast("نسخه Golden را انتخاب کنید.");
    if (!confirm(`بازیابی کامل از Golden؟\n\n${selectedGoldenId}\n\nکل پروژه جایگزین می‌شود.`)) return;
    setBusy("golden-restore");
    const res = await fetch("/api/admin/backup/golden/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setId: selectedGoldenId }),
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "شروع بازیابی ناموفق بود.");
    onToast(data.message || "بازیابی Golden شروع شد.");
    loadGolden();
  };

  const handleRestoreSubmit = async () => {
    if (restoreSource === "server-auto") {
      if (!selectedAutoId) return onToast("بک‌آپ خودکار را انتخاب کنید.");
      if (!preview || previewBackupId !== selectedAutoId) {
        await loadZipPreview(selectedAutoId);
        return;
      }
      const warn = preview.warnings.join("\n• ");
      if (!confirm(`بازیابی ZIP خودکار؟\n\n• ${warn}`)) return;
      await runZipRestore(selectedAutoId);
      return;
    }
    if (restoreSource === "server-manual") {
      if (!manualBackup) return onToast("بک‌آپ دستی وجود ندارد.");
      const id = selectedManualId || manualBackup.id;
      if (!preview || previewBackupId !== id) {
        await loadZipPreview(id);
        return;
      }
      const warn = preview.warnings.join("\n• ");
      if (!confirm(`بازیابی ZIP دستی؟\n\n• ${warn}`)) return;
      await runZipRestore(id);
      return;
    }
    if (restoreSource === "computer") {
      if (!pendingFile) {
        fileRef.current?.click();
        return;
      }
      if (!confirm("بازیابی ZIP از کامپیوتر؟")) return;
      await runZipRestoreFromFile(pendingFile);
      return;
    }
    if (restoreSource === "myfiles") {
      await runGoldenRestore();
    }
  };

  const goldenBackupStep =
    goldenStatus.state === "success" ? 3 : goldenStatus.state === "running" ? 1 : goldenStatus.state === "error" ? 2 : 0;

  const goldenRestoreStep =
    goldenRestoreStatus.state === "success"
      ? 3
      : goldenRestoreStatus.state === "running"
        ? 1
        : goldenRestoreStatus.state === "error"
          ? 2
          : 0;

  const isZipSource = restoreSource === "server-auto" || restoreSource === "server-manual" || restoreSource === "computer";

  return (
    <section className="admin-backup" data-testid="admin-backup-panel">
      <div className="dash-hero">
        <h2>
          <Shield size={22} style={{ display: "inline", verticalAlign: "middle", marginLeft: 8 }} />
          بک‌آپ و بازیابی
        </h2>
        <p>ZIP روی سرور (خودکار/دستی) + Golden روی MyFiles. بازیابی فقط از تب «بازیابی».</p>
      </div>

      <div className="admin-tabs">
        <button type="button" className={tab === "auto" ? "is-active" : ""} onClick={() => setTab("auto")}>
          خودکار
        </button>
        <button type="button" className={tab === "manual" ? "is-active" : ""} onClick={() => setTab("manual")}>
          دستی
        </button>
        <button type="button" className={tab === "golden" ? "is-active" : ""} onClick={() => setTab("golden")}>
          طلایی (MyFiles)
        </button>
        <button type="button" className={tab === "recovery" ? "is-active" : ""} onClick={() => setTab("recovery")}>
          <Undo2 size={14} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
          بازیابی
        </button>
      </div>

      <div className="admin-backup-actions">
        <button type="button" className="btn-outline" disabled={loading} onClick={load}>
          <RefreshCw size={16} />
          بروزرسانی
        </button>
      </div>

      {loading ? (
        <p className="admin-muted">در حال بارگذاری…</p>
      ) : (
        <>
          {tab === "auto" && (
            <div>
              <p className="admin-muted" style={{ marginBottom: "0.75rem" }}>
                هر شب ساعت ۲۳:۰۰ — حداکثر {maxAutoBackups} نسخه روی سرور. {RESTORE_HINTS.zipScope}
              </p>
              {autoBackups.length === 0 && (
                <p className="admin-backup-note">اولین بک‌آپ خودکار امشب ساعت ۲۳:۰۰ گرفته می‌شود.</p>
              )}
              <ZipBackupTable rows={autoBackups} onDownload={download} />
            </div>
          )}

          {tab === "manual" && (
            <div>
              <p className="admin-muted" style={{ marginBottom: "0.75rem" }}>
                قبل از کار مهم — فقط ۱ نسخه (آخرین جایگزین قبلی می‌شود).
              </p>
              <div className="admin-backup-actions" style={{ marginBottom: "0.75rem" }}>
                <button type="button" className="btn-primary" disabled={!!busy} onClick={createManualBackup}>
                  <Database size={16} />
                  {busy === "create-manual" ? "در حال ایجاد…" : "بک‌آپ دستی الان"}
                </button>
              </div>
              <ZipBackupTable
                rows={manualBackup ? [manualBackup] : []}
                onDownload={download}
                onDelete={deleteManual}
                showDelete
              />
            </div>
          )}

          {tab === "golden" && (
            <div>
              <p className="admin-muted" style={{ marginBottom: "0.75rem" }}>
                MyFiles — حداکثر {maxGoldenBackups} روز (پوشه <code>YYYY-MM-DD</code>). هر بک‌آپ ~۵GB به
                ۱۲ part (~۴۵۰MB) + ۱ manifest تقسیم می‌شود (محدودیت MyFiles). تا اتمام آپلود partها را حذف
                نکنید — بک‌آپ کامل وقتی است که manifest هم آپلود شده باشد.
              </p>
              <div className="admin-backup-actions" style={{ marginBottom: "0.75rem" }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!!busy || goldenRunning || goldenStatus.state === "running"}
                  onClick={startGoldenBackup}
                >
                  <Cloud size={16} />
                  {goldenRunning || goldenStatus.state === "running" ? "در حال اجرا…" : "Golden Backup الان"}
                </button>
              </div>
              <StageProgress
                title="پیشرفت Golden Backup"
                steps={["ساخت tar روی سرور", "آپلود partها به MyFiles", "حذف موقت از سرور", "تمام"]}
                activeIndex={goldenBackupStep}
                state={goldenStatus.state}
                errorMessage={goldenStatus.message}
              />
              {goldenStatus.state === "success" && goldenStatus.finishedAt && (
                <p className="admin-muted">آخرین موفق: {goldenStatus.filename} — {formatDate(goldenStatus.finishedAt)}</p>
              )}
              {goldenSets.length === 0 ? (
                <p className="admin-muted">هنوز Golden Backup روی MyFiles نیست.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>روز</th>
                        <th>تاریخ</th>
                        <th>وضعیت</th>
                        <th>parts</th>
                        <th>فایل‌ها</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goldenSets.map((s) => (
                        <tr key={s.setId}>
                          <td>
                            <code>{s.dayFolder ?? s.setId.slice(14, 24)}</code>
                          </td>
                          <td>{formatDate(s.createdAt)}</td>
                          <td>
                            {s.hasManifest ? (
                              <span style={{ color: "var(--success, green)" }}>کامل</span>
                            ) : (
                              <span style={{ color: "var(--danger, #c00)" }}>ناقص — حذف نکنید</span>
                            )}
                          </td>
                          <td>{s.parts || "—"}</td>
                          <td>
                            {s.fileCount} part + manifest
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "recovery" && (
            <div className="admin-backup-restore-panel">
              <h3>بازیابی</h3>

              <label className="admin-media-category-field">
                <span>منبع بک‌آپ</span>
                <select
                  value={restoreSource}
                  onChange={(e) => setRestoreSource(e.target.value as RestoreSource)}
                >
                  <option value="server-auto">سرور — بک‌آپ خودکار (ZIP)</option>
                  <option value="server-manual">سرور — بک‌آپ دستی (ZIP)</option>
                  <option value="myfiles">MyFiles — Golden Backup</option>
                  <option value="computer">کامپیوتر — فایل ZIP</option>
                </select>
              </label>

              {restoreSource === "server-auto" && (
                <label className="admin-media-category-field">
                  <span>نسخه خودکار</span>
                  <select value={selectedAutoId} onChange={(e) => setSelectedAutoId(e.target.value)}>
                    <option value="">— انتخاب کنید —</option>
                    {autoBackups.map((b) => (
                      <option key={b.id} value={b.id}>
                        {formatDate(b.createdAt)} — {formatBytes(b.sizeBytes)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {restoreSource === "server-manual" && (
                <label className="admin-media-category-field">
                  <span>نسخه دستی</span>
                  <select
                    value={selectedManualId || manualBackup?.id || ""}
                    onChange={(e) => setSelectedManualId(e.target.value)}
                    disabled={!manualBackup}
                  >
                    {!manualBackup ? (
                      <option value="">بک‌آپ دستی وجود ندارد</option>
                    ) : (
                      <option value={manualBackup.id}>
                        {formatDate(manualBackup.createdAt)} — {formatBytes(manualBackup.sizeBytes)}
                      </option>
                    )}
                  </select>
                </label>
              )}

              {restoreSource === "myfiles" && (
                <>
                  <label className="admin-media-category-field">
                    <span>نسخه Golden روی MyFiles</span>
                    <select value={selectedGoldenId} onChange={(e) => setSelectedGoldenId(e.target.value)}>
                      <option value="">— انتخاب کنید —</option>
                      {goldenSets.map((s) => (
                        <option key={s.setId} value={s.setId}>
                          {formatDate(s.createdAt)} — {s.setId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="admin-backup-note">{RESTORE_HINTS.goldenFull}</p>
                </>
              )}

              {restoreSource === "computer" && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".zip,application/zip"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setPendingFile(f);
                      e.target.value = "";
                    }}
                  />
                  <div className="admin-backup-upload">
                    <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
                      <HardDriveUpload size={16} />
                      {pendingFile ? pendingFile.name : "انتخاب فایل ZIP"}
                    </button>
                  </div>
                  <p className="admin-backup-note">{RESTORE_HINTS.zipScope}</p>
                </>
              )}

              {isZipSource && (
                <div style={{ marginTop: "0.75rem" }}>
                  <p style={{ fontWeight: 600, marginBottom: ".5rem" }}>بخش‌های بازیابی (ZIP)</p>
                  <label className="admin-check admin-backup-restore-option">
                    <input type="checkbox" checked={restoreFull} onChange={(e) => setRestoreFull(e.target.checked)} />
                    <span>بازیابی کامل (DB + CMS + uploads)</span>
                  </label>
                  {!restoreFull && (
                    <div className="admin-backup-restore-options">
                      <label className="admin-check">
                        <input type="checkbox" checked={restoreDb} onChange={(e) => setRestoreDb(e.target.checked)} /> دیتابیس
                      </label>
                      <label className="admin-check">
                        <input type="checkbox" checked={restoreCms} onChange={(e) => setRestoreCms(e.target.checked)} /> CMS + media-center
                      </label>
                      <label className="admin-check">
                        <input type="checkbox" checked={restoreUploads} onChange={(e) => setRestoreUploads(e.target.checked)} /> uploads
                      </label>
                      {restoreUploads && (
                        <select value={uploadMode} onChange={(e) => setUploadMode(e.target.value as "merge" | "replace")}>
                          <option value="merge">ادغام uploads</option>
                          <option value="replace">جایگزینی uploads</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              {preview && isZipSource && (
                <div className="admin-backup-preview">
                  <h3>پیش‌نمایش</h3>
                  <ul>
                    {preview.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <StageProgress
                title="پیشرفت بازیابی Golden"
                steps={["دانلود از MyFiles", "بازسازی tar", "extract روی سرور", "تمام — restart سرویس"]}
                activeIndex={goldenRestoreStep}
                state={restoreSource === "myfiles" ? goldenRestoreStatus.state : "idle"}
                errorMessage={goldenRestoreStatus.message}
              />

              <div className="admin-backup-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!!busy || goldenRestoreStatus.state === "running"}
                  onClick={handleRestoreSubmit}
                >
                  {busy === "restore-zip" || busy === "restore-file" || busy === "golden-restore" ? (
                    <>
                      <Loader2 size={16} className="spin" /> در حال بازیابی…
                    </>
                  ) : preview && isZipSource ? (
                    "تأیید و بازیابی"
                  ) : isZipSource && restoreSource.startsWith("server") ? (
                    "پیش‌نمایش و ادامه"
                  ) : restoreSource === "myfiles" ? (
                    <>
                      <Sparkles size={16} /> بازیابی Golden کامل
                    </>
                  ) : (
                    <>
                      <HardDriveUpload size={16} /> بازیابی از ZIP
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
