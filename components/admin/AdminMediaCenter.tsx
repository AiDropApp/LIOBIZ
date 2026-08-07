"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import {
  categoryDiskRelPath,
  filterVisibleRootCategories,
  filterVisibleSubCategories,
  resolveCategoryIdFromLocalPath,
} from "@/lib/media-center/category-path-utils";
import { toAssetRefFromUpload, uploadMediaFile } from "@/lib/media-center/upload-client";
import MediaLibraryBrowser, { type LibraryEntry } from "@/components/admin/media/MediaLibraryBrowser";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import { AdminAssetPreview } from "@/components/admin/media/AdminMediaCardThumb";
import { readResponseJson } from "@/lib/safe-json";

export default function AdminMediaCenter({ onToast }: { onToast: (text: string) => void }) {
  const [section, setSection] = useState<MediaSection>("portfolio");
  const [bootstrapped, setBootstrapped] = useState(true);
  const [busy, setBusy] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [cards, setCards] = useState<MediaCard[]>([]);
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
    () => filterVisibleRootCategories(categories, section),
    [categories, section],
  );
  const subSectionCategories = useMemo(() => {
    if (selectedMainCategoryId === "all") return [];
    return filterVisibleSubCategories(categories, section, selectedMainCategoryId);
  }, [categories, section, selectedMainCategoryId]);
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
    return filterVisibleSubCategories(categories, section, editorMainCategoryId);
  }, [categories, section, editorMainCategoryId]);

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

  const selectedCategoryDiskPath = useMemo(() => {
    if (selectedCategoryId === "all") return undefined;
    return categoryDiskRelPath(categories, selectedCategoryId) ?? undefined;
  }, [selectedCategoryId, categories]);

  const loadInit = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/media/init?section=${section}`, { cache: "no-store" });
      const data = await readResponseJson<{
        bootstrapped?: boolean;
        categories?: MediaCategory[];
        cards?: MediaCard[];
      }>(res);
      if (!res.ok) throw new Error(String((data as { message?: string }).message || "خطا در بارگذاری"));
      setBootstrapped(Boolean(data.bootstrapped));
      setCategories((prev) => {
        const others = prev.filter((c) => c.section !== section);
        return [...others, ...(data.categories || [])];
      });
      setCards(data.cards || []);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "خطا در بارگذاری مرکز رسانه");
    }
  }, [section, onToast]);

  const runLocalSync = useCallback(async (silent = false) => {
    setSyncStatus("همگام‌سازی با سرور…");
    try {
      const res = await fetch("/api/admin/media/sync-local", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data.message || "همگام‌سازی ناموفق"));
      await loadInit();
      setLibraryKey((k) => k + 1);
      if (!silent) onToast(String(data.message || "همگام‌سازی انجام شد."));
      return data;
    } catch (e) {
      if (!silent) onToast(e instanceof Error ? e.message : "همگام‌سازی ناموفق");
      return null;
    } finally {
      setSyncStatus("");
    }
  }, [loadInit, onToast]);

  useEffect(() => {
    void loadInit();
  }, [section, loadInit]);

  useEffect(() => {
    void runLocalSync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

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
    onToast(String(data.message || `دسته «${name}» روی سرور ایجاد شد.`));
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
    await runLocalSync(false);
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
    const res = await fetch("/api/admin/media/assets/from-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId: entry.id,
        section,
        categoryId: editor.categoryId,
        fileName: entry.name,
        type: entry.type,
        mime: entry.mime,
        description: editor.description,
        localPath: entry.localPath,
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
      void loadInit();
      return;
    }
    setEditor({ ...card });
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
    try {
      setUploadPct(0);
      setUploadStage("شروع…");
      const result = await uploadMediaFile(file, {
        section,
        categoryId: selectedCategoryId !== "all" ? selectedCategoryId : undefined,
        categoryDiskPath: selectedCategoryDiskPath,
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
    const categoryFromPath = entry.localPath
      ? resolveCategoryIdFromLocalPath(categories, section, entry.localPath)
      : null;
    const categoryId =
      selectedCategoryId !== "all" ? selectedCategoryId : categoryFromPath;
    const res = await fetch("/api/admin/media/assets/from-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId: entry.id,
        section,
        categoryId,
        fileName: entry.name,
        type: entry.type,
        mime: entry.mime,
        description: entry.description || "",
        localPath: entry.localPath,
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
    const data = await res.json();
    setBusy("");
    if (!res.ok) return onToast(data.message || "ذخیره ناموفق");

    if (data.card) {
      setCards((prev) => prev.map((c) => (c.id === data.card.id ? data.card : c)));
    } else if (Array.isArray(data.cards)) {
      setCards((prev) => {
        const others = prev.filter((c) => c.section !== section);
        return [...others, ...data.cards];
      });
    }

    onToast("ذخیره شد — تغییرات روی سایت اعمال شد.");
    setEditor(null);
    setLibraryKey((k) => k + 1);
    await loadInit();
  };

  const uploadForField = async (file: File, field: "cover" | "video" | "image" | "avatar") => {
    if (!editor) return;
    try {
      setUploadPct(0);
      setUploadStage("شروع…");
      const categoryDiskPath = editor.categoryId
        ? categoryDiskRelPath(categories, editor.categoryId) ?? undefined
        : undefined;
      const result = await uploadMediaFile(file, {
        section,
        categoryId: editor.categoryId ?? undefined,
        categoryDiskPath,
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

  const deleteEntry = async (_entryId: number) => {
    onToast("حذف فایل از سرور غیرفعال است — فایل‌ها و توضیحات حفظ می‌شوند.");
  };

  const removeCard = async (id: string) => {
    if (!confirm("این کارت از سایت حذف شود؟ فایل روی سرور حفظ می‌ماند.")) return;
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

  return (
    <section className="admin-media" data-testid="admin-media-center">
      <div className="dash-hero">
        <h2>
          <HardDrive size={22} style={{ display: "inline", verticalAlign: "middle", marginLeft: 8 }} />
          مرکز رسانه
        </h2>
        <p>
          مدیریت Portfolio، Backstage و Creative Partners — متادیتا در{" "}
          <code>data/media-center.json</code> و فایل‌ها روی سرور
        </p>
        {syncStatus ? (
          <p className="admin-media-sync-status">
            <Loader2 className="spin" size={14} /> {syncStatus}
          </p>
        ) : null}
      </div>

      <div className="admin-media-toolbar">
        <input
          className="admin-media-search"
          placeholder="جستجو در فایل‌ها…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="btn-outline admin-media-sync-btn"
          disabled={!!busy || !!syncStatus}
          onClick={() => void manualSync()}
          title="همگام‌سازی دسته‌ها با پوشه‌های سرور"
        >
          <RefreshCw size={14} className={syncStatus ? "spin" : ""} />
          همگام‌سازی
        </button>
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
            <button
              type="button"
              className="btn-sm"
              onClick={openCategoryModal}
            >
              <FolderPlus size={14} /> دسته جدید
            </button>
            <button
              type="button"
              className="btn-sm admin-media-category-delete"
              disabled={busy === "cat-del"}
              title={selectedCategoryId === "all" ? "ابتدا دسته اصلی یا زیردسته را انتخاب کنید" : "حذف دسته"}
              onClick={openDeleteCategoryModal}
            >
              <Trash2 size={14} /> حذف دسته
            </button>
          </div>

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
                <span className="admin-media-delete-modal-name">{selectedCategoryForDelete.name}</span>{" "}
                از لیست دسته‌ها حذف می‌شود. فایل‌ها، کارت‌ها و توضیحات روی سرور حفظ می‌مانند.
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
              پوشه در مسیر <code>public/media</code> روی سرور ساخته می‌شود و در سایت ثبت می‌گردد.
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
                {busy === "cat" ? <Loader2 className="spin" size={16} /> : "ایجاد در سرور"}
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
        title="انتخاب از کتابخانه سرور"
        section={section}
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
