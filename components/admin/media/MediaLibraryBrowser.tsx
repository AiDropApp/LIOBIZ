"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  Link2,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Unlink,
  Upload,
} from "lucide-react";
import type { MediaSection } from "@/lib/filesir/types";
import { readResponseJson } from "@/lib/safe-json";
import LibraryFileThumb from "@/components/admin/media/LibraryFileThumb";
import MediaLibraryMeta from "@/components/admin/media/MediaLibraryMeta";
import "./media-library-shared.css";

export type LibraryEntry = {
  id: number;
  name: string;
  type: string;
  mime?: string;
  file_size?: number;
  description?: string;
  folderId?: number;
  folderLabel?: string;
  localPath?: string;
  previewUrl?: string;
  linked?: {
    cardId: string;
    cardTitle: string;
    field: string;
    section: string;
  } | null;
};

type Breadcrumb = { id: number | null; name: string };
type LinkFilter = "all" | "linked" | "free";
type LibraryScope = "section" | "liobiz" | "drive";
type SortKey = "name" | "size";

type EntryCache = Map<
  string,
  { entries: LibraryEntry[]; breadcrumbs: Breadcrumb[]; stats: { total: number; linked: number; free: number } }
>;

const PAGE_SIZE = 24;

type Props = {
  section: MediaSection;
  categoryFilterId?: string | null;
  search?: string;
  mode?: "browse" | "pick";
  filterTypes?: string;
  onPick?: (entry: LibraryEntry) => void;
  onEditLinked?: (entry: LibraryEntry) => void;
  onEditFree?: (entry: LibraryEntry) => void;
  onDelete?: (entryId: number) => void;
  onUploadFiles?: (files: FileList) => void;
  onManualSync?: () => Promise<void>;
  syncing?: boolean;
  onToast?: (text: string) => void;
};

export default function MediaLibraryBrowser({
  section,
  categoryFilterId = null,
  search = "",
  mode = "browse",
  filterTypes,
  onPick,
  onEditLinked,
  onEditFree,
  onDelete,
  onUploadFiles,
  onManualSync,
  syncing = false,
}: Props) {
  const [scope, setScope] = useState<LibraryScope>(mode === "pick" ? "liobiz" : "section");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, linked: 0, free: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const entryCache = useRef<EntryCache>(new Map());
  const requestId = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScope(mode === "pick" ? "liobiz" : "section");
    setLinkFilter("all");
    setSelectedIds(new Set());
    setVisibleCount(PAGE_SIZE);
  }, [section, categoryFilterId, mode]);

  const cacheKey = useMemo(
    () =>
      [scope, section, categoryFilterId ?? "", search.trim(), linkFilter, sortKey, filterTypes ?? ""].join("|"),
    [scope, section, categoryFilterId, search, linkFilter, sortKey, filterTypes],
  );

  const load = useCallback(async () => {
    const cached = entryCache.current.get(cacheKey);
    if (cached) {
      setEntries(cached.entries);
      setStats(cached.stats);
    }

    const reqId = ++requestId.current;
    setLoading(true);
    setLoadError("");

    try {
      const qs = new URLSearchParams({ section, sort: sortKey });

      if (scope === "section") {
        qs.set("flat", "1");
        qs.set("scope", "folder");
        if (categoryFilterId) qs.set("categoryId", categoryFilterId);
      } else {
        qs.set("scope", scope === "liobiz" ? "liobiz" : "all");
      }

      if (search.trim()) qs.set("query", search.trim());
      if (linkFilter === "free") qs.set("unlinkedOnly", "1");
      if (linkFilter === "linked") qs.set("linkedOnly", "1");
      if (filterTypes) qs.set("type", filterTypes);

      const res = await fetch(`/api/admin/media/entries?${qs}`, { cache: "no-store" });
      const data = await readResponseJson<{
        entries?: LibraryEntry[];
        breadcrumbs?: Breadcrumb[];
        stats?: { total: number; linked: number; free: number };
      }>(res);
      if (!res.ok) throw new Error(String((data as { message?: string }).message || "خطا در بارگذاری"));

      if (reqId !== requestId.current) return;

      const nextEntries = (data.entries || []).filter((e) => e.type !== "folder");
      const nextStats = data.stats || {
        total: nextEntries.length,
        linked: nextEntries.filter((e) => e.linked).length,
        free: nextEntries.filter((e) => !e.linked).length,
      };

      entryCache.current.set(cacheKey, {
        entries: nextEntries,
        breadcrumbs: data.breadcrumbs || [],
        stats: nextStats,
      });
      setEntries(nextEntries);
      setStats(nextStats);
      setVisibleCount(PAGE_SIZE);
      setSelectedIds(new Set());
    } catch (e) {
      if (reqId !== requestId.current) return;
      if (!cached) {
        setEntries([]);
        setStats({ total: 0, linked: 0, free: 0 });
      }
      setLoadError(e instanceof Error ? e.message : "خطا در بارگذاری کتابخانه");
    } finally {
      if (reqId === requestId.current) setLoading(false);
    }
  }, [cacheKey, scope, section, categoryFilterId, search, linkFilter, sortKey, filterTypes]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((n) => Math.min(n + PAGE_SIZE, entries.length));
        }
      },
      { rootMargin: "320px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [entries.length]);

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of entries) {
      counts.set(f.name, (counts.get(f.name) || 0) + 1);
    }
    return counts;
  }, [entries]);

  const visibleFiles = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    if (!onDelete || selectedIds.size === 0) return;
    if (!confirm(`حذف ${selectedIds.size} فایل از سرور غیرفعال است.`)) return;
    for (const id of selectedIds) {
      await onDelete(id);
    }
    setSelectedIds(new Set());
    await load();
  };

  const showEmpty = !loading && !loadError && entries.length === 0;

  return (
    <div
      className={`admin-media-library${dragOver ? " is-drag-over" : ""}`}
      onDragOver={(e) => {
        if (!onUploadFiles) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!onUploadFiles || !e.dataTransfer.files?.length) return;
        e.preventDefault();
        setDragOver(false);
        onUploadFiles(e.dataTransfer.files);
      }}
    >
      <div className="admin-media-library-toolbar">
        <label className="admin-media-library-field">
          <span>محدوده</span>
          <select value={scope} onChange={(e) => setScope(e.target.value as LibraryScope)}>
            <option value="section">فایل‌های این بخش</option>
            <option value="liobiz">همه Liobiz</option>
            <option value="drive">کل درایو (پیشرفته)</option>
          </select>
        </label>
        <label className="admin-media-library-field">
          <span>مرتب‌سازی</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="name">نام</option>
            <option value="size">حجم</option>
          </select>
        </label>
        {onManualSync && (
          <button
            type="button"
            className="btn-outline btn-sm admin-media-sync-btn"
            disabled={syncing || loading}
            onClick={() => void onManualSync()}
            title="همگام‌سازی با سرور"
          >
            <RefreshCw size={14} className={syncing ? "spin" : ""} /> همگام‌سازی
          </button>
        )}
      </div>

      <div className="admin-media-library-chips" role="tablist" aria-label="فیلتر وضعیت">
        {(
          [
            { id: "all" as const, label: `همه (${stats.total})` },
            { id: "linked" as const, label: `اختصاص‌یافته (${stats.linked})` },
            { id: "free" as const, label: `آزاد (${stats.free})` },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            className={`admin-media-library-chip${linkFilter === chip.id ? " is-active" : ""}${
              chip.id === "linked" ? " is-linked" : chip.id === "free" ? " is-free" : ""
            }`}
            onClick={() => setLinkFilter(chip.id)}
          >
            {chip.id === "linked" && <Link2 size={12} />}
            {chip.id === "free" && <Unlink size={12} />}
            {chip.label}
          </button>
        ))}
        {(loading || syncing) && (
          <span className="admin-media-library-refresh-indicator">
            <Loader2 className="spin" size={14} /> {syncing ? "همگام‌سازی…" : "بارگذاری…"}
          </span>
        )}
      </div>

      {selectedIds.size > 0 && mode === "browse" && (
        <div className="admin-media-library-bulk">
          <span>{selectedIds.size} مورد انتخاب شده</span>
          {onDelete && (
            <button type="button" className="btn-outline btn-sm" onClick={() => void bulkDelete()}>
              <Trash2 size={12} /> حذف
            </button>
          )}
          <button type="button" className="btn-sm" onClick={() => setSelectedIds(new Set())}>
            لغو انتخاب
          </button>
        </div>
      )}

      {dragOver && onUploadFiles && (
        <div className="admin-media-library-drop-hint">
          <Upload size={20} /> رها کنید تا آپلود شود
        </div>
      )}

      {loading && entries.length === 0 ? (
        <p className="admin-muted admin-media-library-loading">
          <Loader2 className="spin" size={18} /> در حال بارگذاری فایل‌ها…
        </p>
      ) : loadError ? (
        <p className="admin-muted">{loadError}</p>
      ) : showEmpty ? (
        <div className="admin-media-library-empty">
          <p className="admin-muted">
            {scope === "section" && categoryFilterId
              ? "در این دسته فایلی نیست. زیردسته دیگر را امتحان کنید یا «همه» را انتخاب کنید."
              : scope === "section"
                ? "فایلی برای این بخش یافت نشد."
                : "فایلی در این محدوده یافت نشد."}
          </p>
          {scope !== "section" && (
            <button type="button" className="btn-outline btn-sm" onClick={() => setScope("section")}>
              بازگشت به فایل‌های بخش
            </button>
          )}
        </div>
      ) : (
        <div className={`admin-media-library-grid-wrap${loading ? " is-refreshing" : ""}`}>
          <div className="admin-media-library-grid" data-testid="admin-media-library-grid">
            {visibleFiles.map((file) => {
              const isLinked = Boolean(file.linked);
              const isDuplicate = (duplicateNames.get(file.name) || 0) > 1;
              const openEditor = () => {
                if (isLinked && onEditLinked) onEditLinked(file);
                else if (!isLinked && onEditFree) onEditFree(file);
              };

              return (
                <article
                  key={file.id}
                  className={`admin-media-library-item${isLinked ? " is-linked" : " is-free"}${
                    selectedIds.has(file.id) ? " is-selected" : ""
                  }`}
                  role={mode === "browse" ? "button" : undefined}
                  tabIndex={mode === "browse" ? 0 : undefined}
                  onClick={() => {
                    if (mode === "browse") openEditor();
                  }}
                  onKeyDown={(e) => {
                    if (mode !== "browse") return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEditor();
                    }
                  }}
                >
                  {mode === "browse" && (
                    <label className="admin-media-library-select" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    </label>
                  )}
                  <div className="admin-media-library-thumb">
                    <LibraryFileThumb entry={file} />
                    {isDuplicate && <span className="admin-media-badge duplicate">تکراری</span>}
                    {isLinked ? (
                      <span className="admin-media-badge linked" title={file.linked!.cardTitle}>
                        <Link2 size={10} /> اختصاص‌یافته
                      </span>
                    ) : (
                      <span className="admin-media-badge free">آزاد</span>
                    )}
                  </div>
                  <MediaLibraryMeta file={file} isLinked={isLinked} />
                  <div className="admin-media-library-actions">
                    {mode === "pick" && onPick && (
                      <button type="button" className="btn-primary btn-sm" onClick={() => onPick(file)}>
                        انتخاب
                      </button>
                    )}
                    {mode === "browse" && (
                      <>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditor();
                          }}
                        >
                          <Pencil size={12} /> {isLinked ? "ویرایش" : "اختصاص"}
                        </button>
                        {onDelete && (
                          <button
                            type="button"
                            className="btn-outline btn-sm admin-media-library-action-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(file.id);
                            }}
                          >
                            <Trash2 size={12} /> حذف
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {hasMore && (
            <div ref={loadMoreRef} className="admin-media-library-load-more">
              <ArrowDown size={16} /> نمایش {visibleCount} از {entries.length} — اسکرول برای بیشتر
            </div>
          )}
        </div>
      )}
    </div>
  );
}
