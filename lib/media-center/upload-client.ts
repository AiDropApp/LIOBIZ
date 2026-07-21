type InitResponse = {
  ok: boolean;
  init?: {
    uploadSessionId: string;
    uploadMode: "single" | "s3-single" | "s3-multipart" | "tus";
    partSize?: number | null;
    next?: {
      url?: string;
      headers?: Record<string, string>;
    } | null;
  };
  mode?: string;
  fileEntry?: { id: number; name: string; mime?: string; type: string };
  message?: string;
};

export type UploadProgress = { percent: number; stage: string };

async function attachShareLink(entryId: number) {
  const res = await fetch(`/api/admin/media/entries/${entryId}/shareable-link`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "ساخت لینک اشتراک ناموفق بود.");
  return data as { publicUrl: string; link: { hash: string } };
}

export async function uploadMediaFile(
  file: File,
  opts: {
    section?: string;
    categoryFolderId?: number;
    onProgress?: (p: UploadProgress) => void;
  },
) {
  const { section, categoryFolderId, onProgress } = opts;
  onProgress?.({ percent: 2, stage: "آماده‌سازی…" });

  if (file.size <= 4 * 1024 * 1024) {
    const form = new FormData();
    form.append("file", file);
    if (section) form.append("section", section);
    if (categoryFolderId) form.append("categoryFolderId", String(categoryFolderId));
    onProgress?.({ percent: 30, stage: "آپلود…" });
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
    const data = (await res.json()) as InitResponse;
    if (!res.ok) throw new Error(data.message || "آپلود ناموفق");
    onProgress?.({ percent: 85, stage: "ساخت لینک…" });
    const share = await attachShareLink(data.fileEntry!.id);
    onProgress?.({ percent: 100, stage: "تمام" });
    return { fileEntry: data.fileEntry!, publicUrl: share.publicUrl, shareHash: share.link.hash };
  }

  const initRes = await fetch("/api/admin/media/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, size: file.size, section, categoryFolderId }),
  });
  const initData = (await initRes.json()) as InitResponse;
  if (!initRes.ok || !initData.init) throw new Error(initData.message || "init ناموفق");

  const { init } = initData;
  const sessionId = init.uploadSessionId;

  if (init.uploadMode === "single") {
    onProgress?.({ percent: 20, stage: "آپلود…" });
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/media/upload/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "آپلود ناموفق");
    onProgress?.({ percent: 90, stage: "ساخت لینک…" });
    const share = await attachShareLink(data.fileEntry.id);
    onProgress?.({ percent: 100, stage: "تمام" });
    return { fileEntry: data.fileEntry, publicUrl: share.publicUrl, shareHash: share.link.hash };
  }

  if (init.uploadMode === "s3-single" && init.next?.url) {
    onProgress?.({ percent: 25, stage: "آپلود مستقیم S3…" });
    const headers = new Headers(init.next.headers || {});
    if (!headers.has("Content-Type") && file.type) headers.set("Content-Type", file.type);
    const put = await fetch(init.next.url, { method: "PUT", headers, body: file });
    if (!put.ok) throw new Error("آپلود S3 ناموفق");
    onProgress?.({ percent: 80, stage: "نهایی‌سازی…" });
    const complete = await fetch(`/api/admin/media/upload/${encodeURIComponent(sessionId)}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await complete.json();
    if (!complete.ok) throw new Error(data.message || "complete ناموفق");
    const share = await attachShareLink(data.fileEntry.id);
    onProgress?.({ percent: 100, stage: "تمام" });
    return { fileEntry: data.fileEntry, publicUrl: share.publicUrl, shareHash: share.link.hash };
  }

  if (init.uploadMode === "s3-multipart" && init.partSize) {
    const partSize = init.partSize;
    const totalParts = Math.ceil(file.size / partSize);
    const parts: { PartNumber: number; ETag: string }[] = [];

    for (let batchStart = 0; batchStart < totalParts; batchStart += 5) {
      const batchNums = Array.from(
        { length: Math.min(5, totalParts - batchStart) },
        (_, i) => batchStart + i + 1,
      );
      const signRes = await fetch(
        `/api/admin/media/upload/${encodeURIComponent(sessionId)}/parts/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partNumbers: batchNums }),
        },
      );
      const signed = await signRes.json();
      if (!signRes.ok) throw new Error(signed.message || "sign ناموفق");

      for (const item of signed.urls as { partNumber: number; url: string }[]) {
        const start = (item.partNumber - 1) * partSize;
        const chunk = file.slice(start, start + partSize);
        const put = await fetch(item.url, { method: "PUT", body: chunk });
        if (!put.ok) throw new Error(`آپلود part ${item.partNumber} ناموفق`);
        const etag = put.headers.get("ETag") || put.headers.get("etag");
        if (!etag) throw new Error(`ETag part ${item.partNumber} یافت نشد`);
        parts.push({ PartNumber: item.partNumber, ETag: etag });
        onProgress?.({
          percent: Math.min(95, Math.round((parts.length / totalParts) * 90) + 5),
          stage: `بخش ${parts.length}/${totalParts}`,
        });
      }
    }

    const complete = await fetch(`/api/admin/media/upload/${encodeURIComponent(sessionId)}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts }),
    });
    const data = await complete.json();
    if (!complete.ok) throw new Error(data.message || "complete ناموفق");
    const share = await attachShareLink(data.fileEntry.id);
    onProgress?.({ percent: 100, stage: "تمام" });
    return { fileEntry: data.fileEntry, publicUrl: share.publicUrl, shareHash: share.link.hash };
  }

  throw new Error(`uploadMode پشتیبانی نشده: ${init.uploadMode}`);
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
  };
}
