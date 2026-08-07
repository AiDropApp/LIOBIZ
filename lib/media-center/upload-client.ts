type InitResponse = {
  ok: boolean;
  fileEntry?: { id: number; name: string; mime?: string; type: string };
  message?: string;
  publicUrl?: string;
  localPath?: string;
  shareHash?: string;
};

export type UploadProgress = { percent: number; stage: string };

export async function uploadMediaFile(
  file: File,
  opts: {
    section?: string;
    categoryId?: string;
    categoryDiskPath?: string;
    onProgress?: (p: UploadProgress) => void;
  },
) {
  const { section, categoryId, categoryDiskPath, onProgress } = opts;
  onProgress?.({ percent: 2, stage: "آماده‌سازی…" });

  const form = new FormData();
  form.append("file", file);
  if (section) form.append("section", section);
  if (categoryId) form.append("categoryId", categoryId);
  if (categoryDiskPath) form.append("categoryDiskPath", categoryDiskPath);
  onProgress?.({ percent: 30, stage: "آپلود…" });
  const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
  const data = (await res.json()) as InitResponse;
  if (!res.ok) throw new Error(data.message || "آپلود ناموفق");
  onProgress?.({ percent: 100, stage: "تمام" });
  return {
    fileEntry: data.fileEntry!,
    publicUrl: data.publicUrl || "",
    shareHash: data.shareHash,
    localPath: data.localPath,
  };
}

export function toAssetRefFromUpload(
  upload: Awaited<ReturnType<typeof uploadMediaFile>>,
): {
  entryId: number;
  shareUrl: string;
  shareHash?: string;
  mime?: string;
  fileName?: string;
  kind: "image" | "video" | "other";
  localPath?: string;
} {
  const kind =
    upload.fileEntry.type === "video" || upload.fileEntry.mime?.startsWith("video/")
      ? "video"
      : upload.fileEntry.type === "image" || upload.fileEntry.mime?.startsWith("image/")
        ? "image"
        : "other";
  return {
    entryId: upload.fileEntry.id,
    shareUrl: upload.publicUrl,
    shareHash: upload.shareHash,
    mime: upload.fileEntry.mime,
    fileName: upload.fileEntry.name,
    kind,
    localPath: upload.localPath,
  };
}
