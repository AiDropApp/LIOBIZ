"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cloud,
  FolderPlus,
  HardDrive,
  Library,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  ADMIN_MEDIA_SECTIONS,
  type MediaAssetRef,
  type MediaCard,
  type MediaCategory,
  type MediaSection,
} from "@/lib/filesir/types";
import { toAssetRefFromUpload, uploadMediaFile } from "@/lib/media-center/upload-client";
import MediaLibraryBrowser, { type LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import { AdminAssetPreview } from "@/components/admin/media/AdminMediaCardThumb";
import { readResponseJson } from "@/lib/safe-json";

type SpaceUsage = { used: number; available: number | null; remaining: number | null };

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AdminMediaCenter({ onToast }: { onToast: (text: string) => void }) {
  const [section, setSection] = useState<MediaSection>("portfolio");
  const [configured, setConfigured] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [busy, setBusy] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [usage, setUsage] = useState<SpaceUsage | null>(null);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [cards, setCards] = useState<MediaCard[]>([]);
  const [sectionFolderId, setSectionFolderId] = useState<number | undefined>();
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | "all">("all");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<MediaCard | null>(null);
  const [pickerField, setPickerField] = useState<"cover" | "video" | "image" | "avatar" | null>(null);
  const [libraryKey, setLibraryKey] = useState(0);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryKind, setCategoryKind] = useState<"main" | "sub">("main");
  const [categoryParentId, setCategoryParentId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [deleteCategoryConfirmName, setDeleteCategoryConfirmName] = useState("");
  const [deleteCategoryShake, setDeleteCategoryShake] = useState(false);

  const sectionCategories = categories.filter((c) => c.section === section);
  const rootSectionCategories = useMemo(
    () => sectionCategories.filter((c) => !c.parentId),
    [sectionCategories],
  );
  const subSectionCategories = useMemo(() => {
    if (selectedMainCategoryId === "all") return [];
    return sectionCategories.filter((c) => c.parentId === selectedMainCategoryId);
  }, [sectionCategories, selectedMainCategoryId]);
  const selectedCategoryId = useMemo(() => {
    if (selectedSubCategoryId !== "all") return selectedSubCategoryId;
    if (selectedMainCategoryId !== "all") return selectedMainCategoryId;
    return "all";
  }, [selectedMainCategoryId, selectedSubCategoryId]);

  const editorMainCategoryId = useMemo(() => {
    if (!editor?.categoryId) return "";
    const cat = sectionCategories.find((c) => c.id === editor.categoryId);
    if (!cat) return "";
    return cat.parentId ?? cat.id;
  }, [editor?.categoryId, sectionCategories]);

  const editorSubCategoryId = useMemo(() => {
    if (!editor?.categoryId) return "";
    const cat = sectionCategories.find((c) => c.id === editor.categoryId);
    if (!cat?.parentId) return "";
    return cat.id;
  }, [editor?.categoryId, sectionCategories]);

  const editorSubCategories = useMemo(() => {
    if (!editorMainCategoryId) return [];
    return sectionCategories.filter((c) => c.parentId === editorMainCategoryId);
  }, [sectionCategories, editorMainCategoryId]);

  const editorPrimaryAsset = useMemo(() => {
    if (!editor) return null;
    return editor.video || editor.image || editor.avatar || editor.cover;
  }, [editor]);

  const setEditorMainCategory = (mainId: string) => {
    if (!editor) return;
    setEditor({ ...editor, categoryId: mainId || null });
  };

  const setEditorSubCategory = (subId: string) => {
    if (!editor) return;
    setEditor({ ...editor, categoryId: subId || editorMainCategoryId || null });
  };

  const sectionCardCount = useMemo(
    () => cards.filter((c) => c.section === section).length,
    [cards, section],
  );

  const currentFolderId = useMemo(() => {
    if (selectedCategoryId !== "all") {
      return sectionCategories.find((c) => c.id === selectedCategoryId)?.folderId;
    }
    return sectionFolderId;
  }, [selectedCategoryId, sectionCategories, sectionFolderId]);

  const loadInit = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/media/init?section=${section}`, { cache: "no-store" });
      const data = await readResponseJson<{
        configured?: boolean;
        bootstrapped?: boolean;
        store?: { sectionFolderIds?: Record<string, number> };
        categories?: MediaCategory[];
        cards?: MediaCard[];
      }>(res);
      if (!res.ok) throw new Error(String((data as { message?: string }).message || "خطا در بارگذاری"));
      setConfigured(Boolean(data.configured));
      setBootstrapped(Boolean(data.bootstrapped));
      setSectionFolderId(data.store?.sectionFolderIds?.[section]);
      setCategories((prev) => {
        const others = prev.filter((c) => c.section !== section);
        return [...others, ...(data.categories || [])];
      });
      setCards(data.cards || []);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "خطا در بارگذاری مرکز رسانه");
    }
  }, [section, onToast]);

  const loadSpace = useCallback(async () => {
    const res = await fetch("/api/admin/media/space", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setUsage(data.usage || null);
  }, []);

  useEffect(() => {
    void loadInit();
    const timer = window.setTimeout(() => {
      void loadSpace();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [section, loadInit, loadSpace]);

  const bootstrap = async () => {
    setBusy("bootstrap");
    const res = await fetch("/api/admin/media/bootstrap", { method: "POST" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "راه‌اندازی ناموفق");
    onToast("پوشه‌های Files.ir آماده شد.");
    setBootstrapped(true);
    await Promise.all([loadInit(), loadSpace()]);
    setLibraryKey((k) => k + 1);
  };

  const openCategoryModal = () => {
    const defaultKind = selectedMainCategoryId !== "all" ? "sub" : "main";
    setCategoryKind(defaultKind);
    setCategoryParentId(defaultKind === "sub" && selectedMainCategoryId !== "all" ? selectedMainCategoryId : "");
    setCategoryName("");
    setCategoryModalOpen(true);
  };

  const submitCategory = async () => {
    const name = categoryName.trim();
    if (!name) return onToast("نام دسته را وارد کنید.");
    if (categoryKind === "sub" && !categoryParentId) {
      return onToast("دسته والد را انتخاب کنید.");
    }

    setBusy("cat");
    const res = await fetch("/api/admin/media/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section,
        name,
        parentId: categoryKind === "sub" ? categoryParentId : null,
      }),
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "خطا در ایجاد دسته");
    onToast(`دسته «${name}» در MyFile و سایت ایجاد شد.`);
    setCategoryModalOpen(false);
    await loadInit();
    const created = (data.categories as MediaCategory[] | undefined)?.find((c) =>
      c.name === name && (categoryKind === "sub" ? c.parentId === categoryParentId : !c.parentId),
    );
    if (categoryKind === "main") {
      setSelectedMainCategoryId(created?.id ?? "all");
      setSelectedSubCategoryId("all");
    } else {
      setSelectedMainCategoryId(categoryParentId);
      setSelectedSubCategoryId(created?.id ?? "all");
    }
    setLibraryKey((k) => k + 1);
  };

  const manualSync = async () => {
    setSyncStatus("همگام‌سازی…");
    try {
      const res = await fetch("/api/admin/media/discover", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data.message || "همگام‌سازی ناموفق"));
      await Promise.all([loadInit(), loadSpace()]);
      setLibraryKey((k) => k + 1);
      onToast(String(data.message || "همگام‌سازی انجام شد."));
    } catch (e) {
      onToast(e instanceof Error ? e.message : "همگام‌سازی ناموفق");
    } finally {
      setSyncStatus("");
    }
  };

  const selectedCategoryForDelete = useMemo(
    () => (selectedCategoryId === "all" ? null : sectionCategories.find((c) => c.id === selectedCategoryId) ?? null),
    [selectedCategoryId, sectionCategories],
  );

  const closeDeleteCategoryModal = () => {
    setDeleteCategoryModalOpen(false);
    setDeleteCategoryConfirmName("");
    setDeleteCategoryShake(false);
  };

  const openDeleteCategoryModal = () => {
    if (selectedCategoryId === "all") {
      onToast("برای حذف دسته، ابتدا «دسته اصلی» یا «زیردسته» را انتخاب کنید — گزینه «همه» قابل حذف نیست.");
      return;
    }
    if (!selectedCategoryForDelete) return;
    setDeleteCategoryConfirmName("");
    setDeleteCategoryShake(false);
    setDeleteCategoryModalOpen(true);
  };

  const triggerDeleteCategoryShake = () => {
    setDeleteCategoryShake(true);
    window.setTimeout(() => setDeleteCategoryShake(false), 480);
  };

  const tryDeleteSelectedCategory = () => {
    if (!selectedCategoryForDelete) return;
    const expected = selectedCategoryForDelete.name.trim();
    const typed = deleteCategoryConfirmName.trim();
    if (!typed || typed !== expected) {
      triggerDeleteCategoryShake();
      return;
    }
    void deleteSelectedCategory();
  };

  const deleteSelectedCategory = async () => {
    if (!selectedCategoryForDelete) return;
    closeDeleteCategoryModal();
    setBusy("cat-del");
    const res = await fetch(
      `/api/admin/media/categories?id=${encodeURIComponent(selectedCategoryId)}`,
      { method: "DELETE" },
    );
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "حذف دسته ناموفق");
    onToast(String(data.message || "دسته حذف شد."));
    setSelectedMainCategoryId("all");
    setSelectedSubCategoryId("all");
    await loadInit();
    setLibraryKey((k) => k + 1);
  };

  const attachFromEntry = async (entry: LibraryEntry, field: "cover" | "video" | "image" | "avatar") => {
    if (!editor) return;
    setBusy("attach");
    const categoryFolderId =
      editor.categoryId ? sectionCategories.find((c) => c.id === editor.categoryId)?.folderId : undefined;
    const res = await fetch("/api/admin/media/assets/from-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId: entry.id,
        section,
        categoryId: editor.categoryId,
        targetFolderId: categoryFolderId ?? sectionFolderId,
        fileName: entry.name,
        type: entry.type,
        mime: entry.mime,
        description: editor.description,
        move: true,
      }),
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "اتصال فایل ناموفق");
    const asset = data.asset as MediaAssetRef;
    setEditor((prev) => {
      if (!prev) return prev;
      if (section === "backstage") {
        if (field === "video" || asset.kind === "video") {
          return { ...prev, video: asset, image: null, cover: null };
        }
        return { ...prev, image: asset, video: null, cover: null };
      }
      if (section === "creative-partners" && field === "avatar" && asset.kind === "video") {
        return { ...prev, avatar: asset, video: asset };
      }
      return { ...prev, [field]: asset };
    });
    onToast("فایل از کتابخانه متصل شد.");
  };

  const editLinkedCard = (entry: LibraryEntry) => {
    const link = entry.linked;
    if (!link) return;
    const card = cards.find((c) => c.id === link.cardId);
    if (!card) {
      onToast("کارت مرتبط یافت نشد. بروزرسانی کنید.");
      loadInit();
      return;
    }
    setEditor({ ...card, description: card.description || entry.description || "" });
  };

  const buildCardDraftFromAsset = (
    asset: MediaAssetRef,
    opts: { title: string; description?: string; categoryId?: string | null },
  ): MediaCard => {
    const isVideo = asset.kind === "video";
    const base: MediaCard = {
      id: "",
      section,
      categoryId: opts.categoryId ?? (selectedCategoryId === "all" ? null : selectedCategoryId),
      title: opts.title,
      description: opts.description || "",
      caption: "",
      role: "",
      city: "",
      cover: null,
      video: null,
      image: null,
      avatar: null,
      sortOrder: sectionCardCount,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (section === "creative-partners") {
      base.avatar = isVideo ? null : asset;
      base.video = isVideo ? asset : null;
    } else if (section === "backstage") {
      base.image = isVideo ? null : asset;
      base.video = isVideo ? asset : null;
    } else {
      base.cover = isVideo ? null : asset;
      base.video = isVideo ? asset : null;
    }

    return base;
  };

  const uploadToCurrentFolder = async (file: File) => {
    const targetFolderId = currentFolderId ?? sectionFolderId;
    if (!targetFolderId) {
      onToast("ابتدا پوشه بخش را راه‌اندازی کنید.");
      return;
    }
    try {
      setUploadPct(0);
      setUploadStage("شروع…");
      const result = await uploadMediaFile(file, {
        section,
        categoryFolderId: targetFolderId,
        onProgress: ({ percent, stage }) => {
          setUploadPct(percent);
          setUploadStage(stage);
        },
      });
      const asset = toAssetRefFromUpload(result);
      const title = file.name.replace(/\.[^.]+$/, "") || file.name;
      setEditor(
        buildCardDraftFromAsset(asset, {
          title,
          categoryId: selectedCategoryId === "all" ? null : selectedCategoryId,
        }),
      );
      setLibraryKey((k) => k + 1);
      onToast("آپلود شد — دسته و عنوان را تکمیل کنید و «ذخیره» را بزنید.");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "آپلود ناموفق");
    } finally {
      setUploadPct(null);
      setUploadStage("");
    }
  };

  const createCardFromEntry = async (entry: LibraryEntry) => {
    setBusy("attach");
    const categoryFromFolder = entry.folderId
      ? sectionCategories.find((c) => c.folderId === entry.folderId)?.id ?? null
      : null;
    const categoryId =
      selectedCategoryId !== "all" ? selectedCategoryId : categoryFromFolder;
    const categoryFolderId = categoryId
      ? sectionCategories.find((c) => c.id === categoryId)?.folderId
      : entry.folderId ?? sectionFolderId;
    const res = await fetch("/api/admin/media/assets/from-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId: entry.id,
        section,
        categoryId,
        targetFolderId: categoryFolderId ?? sectionFolderId,
        fileName: entry.name,
        type: entry.type,
        mime: entry.mime,
        description: entry.description || "",
        move: false,
      }),
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "ایجاد کارت ناموفق");

    const asset = data.asset as MediaAssetRef;
    setEditor(
      buildCardDraftFromAsset(asset, {
        title: entry.name.replace(/\.[^.]+$/, "") || entry.name,
        description: entry.description || "",
        categoryId,
      }),
    );
    onToast("کارت جدید از فایل موجود — عنوان و توضیحات را تکمیل کنید.");
  };

  const sanitizeCardForSave = (card: MediaCard): MediaCard => {
    const next = { ...card };
    if (section === "backstage") {
      next.cover = null;
      if (next.video?.entryId) next.image = null;
      else if (next.image?.entryId) next.video = null;
    }
    if (section === "creative-partners" && next.avatar?.kind === "video" && !next.video?.entryId) {
      next.video = next.avatar;
    }
    return next;
  };

  const saveCard = async (card: MediaCard) => {
    setBusy("save");
    const payload = sanitizeCardForSave(card);
    const isNew = !payload.id || !cards.some((c) => c.id === payload.id);
    const res = await fetch("/api/admin/media/cards", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? { ...payload, id: undefined } : payload),
    });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "ذخیره ناموفق");
    onToast("ذخیره شد — کارت روی سایت ثبت و فایل در پوشه دسته MyFile قرار گرفت.");
    setEditor(null);
    loadInit();
    setLibraryKey((k) => k + 1);
  };

  const uploadForField = async (file: File, field: "cover" | "video" | "image" | "avatar") => {
    if (!editor) return;
    try {
      setUploadPct(0);
      setUploadStage("شروع…");
      const categoryFolderId =
        editor.categoryId ? sectionCategories.find((c) => c.id === editor.categoryId)?.folderId : undefined;
      const result = await uploadMediaFile(file, {
        section,
        categoryFolderId,
        onProgress: ({ percent, stage }) => {
          setUploadPct(percent);
          setUploadStage(stage);
        },
      });
      const asset = toAssetRefFromUpload(result);
      setEditor((prev) => {
        if (!prev) return prev;
        if (section === "backstage") {
          if (field === "video" || asset.kind === "video") {
            return { ...prev, video: asset, image: null, cover: null };
          }
          return { ...prev, image: asset, video: null, cover: null };
        }
        if (section === "creative-partners" && field === "avatar" && asset.kind === "video") {
          return { ...prev, avatar: asset, video: asset };
        }
        return { ...prev, [field]: asset };
      });
      onToast("آپلود و لینک اشتراک آماده شد.");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "آپلود ناموفق");
    } finally {
      setUploadPct(null);
      setUploadStage("");
    }
  };

  const deleteEntry = async (entryId: number) => {
    if (!confirm("حذف فایل از MyFile؟ کارت‌های مرتبط هم از سایت حذف می‌شوند.")) return;
    const res = await fetch("/api/admin/media/entries/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", entryIds: [entryId], deleteForever: true }),
    });
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "حذف ناموفق");
    onToast(String(data.message || "فایل حذف شد."));
    await loadInit();
    setLibraryKey((k) => k + 1);
  };

  const removeCard = async (id: string) => {
    if (!confirm("این کارت و فایل‌های MyFile مرتبط از سایت حذف شوند؟")) return;
    setBusy("del-card");
    const res = await fetch(`/api/admin/media/cards?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy("");
    const data = await res.json();
    if (!res.ok) return onToast(data.message || "حذف کارت ناموفق");
    onToast(String(data.message || "کارت حذف شد."));
    setEditor(null);
    await loadInit();
    setLibraryKey((k) => k + 1);
  };

  const uploadFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        await uploadToCurrentFolder(file);
      }
    }
  };

  if (!configured) {
    return (
      <section className="admin-media">
        <div className="admin-media-alert">
          <Cloud size={28} />
          <h2>Files.ir پیکربندی نشده</h2>
          <p>
            در <code>.env.local</code> مقدار <code>FILESIR_ACCESS_TOKEN</code> را قرار دهید (یا{" "}
            <code>FILESIR_EMAIL</code> + <code>FILESIR_PASSWORD</code>).
          </p>
          <p>
            راهنما: <code>docs/DEVELOPER-GUIDE.md</code>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-media" data-testid="admin-media-center">
      <div className="dash-hero">
        <h2>
          <Cloud size={22} style={{ display: "inline", verticalAlign: "middle", marginLeft: 8 }} />
          مرکز رسانه (Files.ir)
        </h2>
        <p>
          مدیریت Portfolio، Backstage، Creative Partners و Blog — فایل‌ها روی Files.ir، متادیتا در{" "}
          <code>data/media-center.json</code>
        </p>
        {usage && (
          <p className="admin-media-usage">
            <HardDrive size={14} /> فضا: {formatBytes(usage.used)}
            {usage.available != null ? ` / ${formatBytes(usage.available)}` : ""}
            {usage.remaining != null ? ` — باقی‌مانده ${formatBytes(usage.remaining)}` : ""}
          </p>
        )}
        {syncStatus ? (
          <p className="admin-media-sync-status">
            <Loader2 className="spin" size={14} /> {syncStatus}
          </p>
        ) : null}
      </div>

      <div className="admin-media-toolbar">
        {!bootstrapped && (
          <button type="button" className="btn-primary" disabled={!!busy} onClick={bootstrap}>
            راه‌اندازی پوشه‌ها
          </button>
        )}
        <input
          className="admin-media-search"
          placeholder="جستجو در فایل‌ها…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {bootstrapped && (
          <button
            type="button"
            className="btn-outline admin-media-sync-btn"
            disabled={!!busy || !!syncStatus}
            onClick={() => void manualSync()}
            title="همگام‌سازی دستی با MyFile"
          >
            <RefreshCw size={14} className={syncStatus ? "spin" : ""} />
          </button>
        )}
      </div>

      <div className="admin-media-section-tabs">
        {ADMIN_MEDIA_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={section === s.id ? "is-active" : ""}
            onClick={() => {
              setSection(s.id);
              setSelectedMainCategoryId("all");
              setSelectedSubCategoryId("all");
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="admin-media-layout">
        <div className="admin-media-main">
          <div className="admin-media-category-bar" data-testid="admin-media-category-bar">
            <label className="admin-media-category-field">
              <span>دسته اصلی</span>
              <select
                value={selectedMainCategoryId}
                onChange={(e) => {
                  setSelectedMainCategoryId(e.target.value);
                  setSelectedSubCategoryId("all");
                }}
              >
                <option value="all">همه</option>
                {rootSectionCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {rootSectionCategories.length > 0 && (
              <label className="admin-media-category-field">
                <span>زیردسته</span>
                <select
                  value={selectedSubCategoryId}
                  disabled={selectedMainCategoryId === "all" || subSectionCategories.length === 0}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                >
                  <option value="all">همه</option>
                  {subSectionCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="button" className="btn-sm" onClick={openCategoryModal} disabled={!bootstrapped}>
              <FolderPlus size={14} /> دسته جدید
            </button>
            <button
              type="button"
              className="btn-sm admin-media-category-delete"
              disabled={!bootstrapped || busy === "cat-del"}
              title={selectedCategoryId === "all" ? "ابتدا دسته اصلی یا زیردسته را انتخاب کنید" : "حذف دسته از سایت و MyFile"}
              onClick={openDeleteCategoryModal}
            >
              <Trash2 size={14} /> حذف دسته
            </button>
          </div>

          {!bootstrapped ? (
            <p className="admin-muted">ابتدا پوشه‌ها را راه‌اندازی کنید.</p>
          ) : (
            <>
              <div className="admin-media-actions">
                <label className="btn-primary admin-media-file-btn">
                  <Upload size={14} /> آپلود
                  <input
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadToCurrentFolder(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {uploadPct != null && (
                  <span className="admin-muted">
                    {uploadStage} ({uploadPct}%)
                  </span>
                )}
              </div>
              <MediaLibraryBrowser
                key={libraryKey}
                section={section}
                categoryFilterId={selectedCategoryId === "all" ? null : selectedCategoryId}
                search={search}
                mode="browse"
                onEditLinked={editLinkedCard}
                onEditFree={createCardFromEntry}
                onDelete={deleteEntry}
                onUploadFiles={uploadFiles}
                onManualSync={manualSync}
                syncing={Boolean(syncStatus)}
                onToast={onToast}
              />
            </>
          )}
        </div>
      </div>

      {deleteCategoryModalOpen && selectedCategoryForDelete && (
        <div className="admin-media-modal-backdrop" onClick={closeDeleteCategoryModal}>
          <div
            className={`admin-media-modal admin-media-category-modal admin-media-delete-modal${deleteCategoryShake ? " is-shake" : ""}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-category-title"
            aria-modal="true"
          >
            <div className="admin-media-modal-head">
              <h3 id="delete-category-title">حذف دسته</h3>
            </div>
            <div className="admin-media-delete-modal-body">
              <p className="admin-media-delete-modal-hint">
                دسته{" "}
                <span className="admin-media-delete-modal-name">{selectedCategoryForDelete.name}</span> و کارت‌های
                داخل آن از سایت و MyFile حذف می‌شوند. این عمل قابل بازگشت نیست.
              </p>
              <label className="admin-media-delete-modal-field">
                <span>
                  برای تأیید، نام دسته را بنویسید:{" "}
                  <strong dir="rtl">{selectedCategoryForDelete.name}</strong>
                </span>
                <input
                  type="text"
                  value={deleteCategoryConfirmName}
                  onChange={(e) => setDeleteCategoryConfirmName(e.target.value)}
                  placeholder={selectedCategoryForDelete.name}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={deleteCategoryShake}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      tryDeleteSelectedCategory();
                    }
                  }}
                />
              </label>
            </div>
            <div className="admin-media-delete-modal-footer">
              <button type="button" className="btn-outline" onClick={closeDeleteCategoryModal}>
                لغو
              </button>
              <button
                type="button"
                className="btn-sm admin-media-category-delete"
                disabled={busy === "cat-del"}
                onClick={tryDeleteSelectedCategory}
              >
                {busy === "cat-del" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                تایید حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="admin-media-modal-backdrop" onClick={() => setCategoryModalOpen(false)}>
          <div className="admin-media-modal admin-media-category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-media-modal-head">
              <h3>دسته جدید</h3>
              <button type="button" className="btn-sm" onClick={() => setCategoryModalOpen(false)} aria-label="بستن">
                <X size={16} />
              </button>
            </div>
            <p className="admin-muted admin-media-category-modal-hint">
              پوشه همزمان در MyFile (Files.ir) و در سایت ساخته می‌شود.
            </p>
            <div className="admin-media-category-modal-type">
              <label className="admin-check">
                <input
                  type="radio"
                  name="categoryKind"
                  checked={categoryKind === "main"}
                  onChange={() => {
                    setCategoryKind("main");
                    setCategoryParentId("");
                  }}
                />
                دسته اصلی
              </label>
              <label className="admin-check">
                <input
                  type="radio"
                  name="categoryKind"
                  checked={categoryKind === "sub"}
                  onChange={() => setCategoryKind("sub")}
                />
                زیردسته
              </label>
            </div>
            {categoryKind === "sub" && (
              <label className="contact-field">
                <span>دسته والد</span>
                <select
                  value={categoryParentId}
                  onChange={(e) => setCategoryParentId(e.target.value)}
                >
                  <option value="">انتخاب کنید…</option>
                  {rootSectionCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="contact-field">
              <span>نام {categoryKind === "sub" ? "زیردسته" : "دسته"}</span>
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={categoryKind === "sub" ? "مثلاً انیمیشن" : "مثلاً موشن گرافیک"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitCategory();
                }}
              />
            </label>
            <div className="admin-media-drawer-actions">
              <button type="button" className="btn-primary" disabled={busy === "cat"} onClick={() => void submitCategory()}>
                {busy === "cat" ? <Loader2 className="spin" size={16} /> : "ایجاد در MyFile"}
              </button>
              <button type="button" className="btn-outline" onClick={() => setCategoryModalOpen(false)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="admin-media-drawer-backdrop" onClick={() => setEditor(null)}>
          <div className="admin-media-drawer" onClick={(e) => e.stopPropagation()}>
            <h3>{editor.id ? "ویرایش کارت" : "کارت جدید"}</h3>

            <label className="contact-field">
              <span>عنوان</span>
              <input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} />
            </label>

            {!editor.id && editorPrimaryAsset && (
              <div className="admin-media-drawer-preview">
                <span className="admin-media-drawer-preview-label">فایل آپلود شده</span>
                <AdminAssetPreview asset={editorPrimaryAsset} label="پیش‌نمایش" />
              </div>
            )}

            {sectionCategories.length > 0 && (
              <div className="admin-media-drawer-category-row">
                <label className="contact-field">
                  <span>دسته اصلی</span>
                  <select
                    value={editorMainCategoryId}
                    onChange={(e) => setEditorMainCategory(e.target.value)}
                  >
                    <option value="">بدون دسته</option>
                    {rootSectionCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="contact-field">
                  <span>زیردسته</span>
                  <select
                    value={editorSubCategoryId}
                    disabled={!editorMainCategoryId || editorSubCategories.length === 0}
                    onChange={(e) => setEditorSubCategory(e.target.value)}
                  >
                    <option value="">—</option>
                    {editorSubCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <label className="contact-field">
              <span>توضیحات</span>
              <textarea
                rows={3}
                value={editor.description || ""}
                onChange={(e) => setEditor({ ...editor, description: e.target.value })}
              />
            </label>

            {section === "backstage" && (
              <label className="contact-field">
                <span>کپشن</span>
                <input value={editor.caption || ""} onChange={(e) => setEditor({ ...editor, caption: e.target.value })} />
              </label>
            )}

            {section === "creative-partners" && (
              <>
                <label className="contact-field">
                  <span>نقش</span>
                  <input value={editor.role || ""} onChange={(e) => setEditor({ ...editor, role: e.target.value })} />
                </label>
                <label className="contact-field">
                  <span>شهر</span>
                  <input value={editor.city || ""} onChange={(e) => setEditor({ ...editor, city: e.target.value })} />
                </label>
              </>
            )}

            <label className="admin-check">
              <input
                type="checkbox"
                checked={editor.published}
                onChange={(e) => setEditor({ ...editor, published: e.target.checked })}
              />
              منتشر شده
            </label>

            {uploadPct != null && (
              <div className="admin-media-progress">
                <div style={{ width: `${uploadPct}%` }} />
                <span>
                  {uploadStage} ({uploadPct}%)
                </span>
              </div>
            )}

            {editor.id && section === "portfolio" && (
              <>
                <MediaUploadField
                  label="کاور"
                  accept="image/*"
                  asset={editor.cover}
                  onUpload={(f) => uploadForField(f, "cover")}
                  onPick={() => setPickerField("cover")}
                />
                <MediaUploadField
                  label="ویدیو"
                  accept="video/*"
                  asset={editor.video}
                  onUpload={(f) => uploadForField(f, "video")}
                  onPick={() => setPickerField("video")}
                />
              </>
            )}

            {editor.id && section === "creative-partners" && (
              <>
                <MediaUploadField
                  label="آواتار (تصویر یا ویدیو)"
                  accept="image/*,video/*"
                  asset={editor.avatar}
                  onUpload={(f) => uploadForField(f, "avatar")}
                  onPick={() => setPickerField("avatar")}
                />
                <MediaUploadField
                  label="ویدیو نمونه کار"
                  accept="video/*"
                  asset={editor.video?.kind === "video" ? editor.video : null}
                  onUpload={(f) => uploadForField(f, "video")}
                  onPick={() => setPickerField("video")}
                />
              </>
            )}

            {editor.id && section === "backstage" && (
              <MediaUploadField
                label="تصویر یا ویدیو"
                accept="image/*,video/*"
                asset={editor.video || editor.image}
                onUpload={(f) => uploadForField(f, f.type.startsWith("video/") ? "video" : "image")}
                onPick={() => setPickerField("image")}
              />
            )}

            <div className="admin-media-drawer-actions">
              {editor.id && (
                <button
                  type="button"
                  className="btn-outline admin-media-drawer-delete"
                  disabled={!!busy}
                  onClick={() => void removeCard(editor.id!)}
                >
                  <Trash2 size={14} /> حذف کارت
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                disabled={!!busy || !editor.title.trim()}
                onClick={() => saveCard(editor)}
              >
                {busy === "save" ? <Loader2 className="spin" size={16} /> : "ذخیره"}
              </button>
              <button type="button" className="btn-outline" onClick={() => setEditor(null)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={pickerField != null}
        title="انتخاب از کتابخانه Files.ir"
        section={section}
        folderId={currentFolderId}
        onClose={() => setPickerField(null)}
        onSelect={(entry) => {
          if (pickerField) attachFromEntry(entry, pickerField);
        }}
      />
    </section>
  );
}

function MediaUploadField({
  label,
  asset,
  accept = "image/*,video/*",
  onUpload,
  onPick,
}: {
  label: string;
  asset?: MediaCard["cover"];
  accept?: string;
  onUpload: (file: File) => void;
  onPick: () => void;
}) {
  return (
    <div className="admin-media-upload-field">
      <span>{label}</span>
      <AdminAssetPreview asset={asset} label={label} />
      {asset?.shareUrl && (
        <a href={asset.shareUrl} target="_blank" rel="noreferrer" className="admin-media-link" dir="ltr">
          {asset.shareUrl.slice(0, 48)}…
        </a>
      )}
      <div className="admin-media-upload-actions">
        <label className="btn-outline admin-media-file-btn">
          <Upload size={14} /> آپلود جدید
          <input
            type="file"
            accept={accept}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" className="btn-outline" onClick={onPick}>
          <Library size={14} /> از کتابخانه
        </button>
      </div>
    </div>
  );
}
