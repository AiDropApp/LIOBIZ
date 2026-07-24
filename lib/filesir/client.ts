import { buildShareablePublicUrl } from "@/lib/filesir/config";
import { filesIrFormRequest, filesIrRequest } from "@/lib/filesir/auth";
import type {
  FilesIrFileEntry,
  FilesIrShareableLink,
  FilesIrSpaceUsage,
  FilesIrUploadInitResponse,
} from "@/lib/filesir/types";

export async function getSpaceUsage(): Promise<FilesIrSpaceUsage> {
  return filesIrRequest<FilesIrSpaceUsage>("/user/space-usage");
}

function unwrapFileEntries(payload: unknown): FilesIrFileEntry[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: FilesIrFileEntry[] }).data;
  }
  return [];
}

export async function listFileEntries(params: {
  parentIds?: number[];
  query?: string;
  type?: string;
  perPage?: number;
}): Promise<FilesIrFileEntry[]> {
  const qs = new URLSearchParams();
  if (params.perPage) qs.set("perPage", String(params.perPage));
  if (params.query) qs.set("query", params.query);
  if (params.type) qs.set("type", params.type);
  if (params.parentIds?.length) {
    for (const id of params.parentIds) qs.append("parentIds", String(id));
  }
  const q = qs.toString();
  const payload = await filesIrRequest<unknown>(`/drive/file-entries${q ? `?${q}` : ""}`);
  return unwrapFileEntries(payload);
}

export const LIOBIZ_ROOT_ALIASES = ["Liobiz", "لیوبیز", "liobiz"];

export async function createFolder(name: string, parentId?: number | null): Promise<FilesIrFileEntry> {
  const data = await filesIrRequest<{ status: string; folder: FilesIrFileEntry }>("/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentId: parentId ?? null }),
  });
  return data.folder;
}

export async function findFolderByName(
  parentId: number | null,
  name: string,
  aliases: string[] = [],
): Promise<FilesIrFileEntry | null> {
  const names = new Set([name, ...aliases]);
  const parentIds = parentId != null ? [parentId] : undefined;
  const entries = await listFileEntries({ parentIds, type: "folder", perPage: 100 });
  return entries.find((e) => e.type === "folder" && names.has(e.name)) || null;
}

export async function findLiobizRootFolder(): Promise<FilesIrFileEntry | null> {
  return findFolderByName(null, "Liobiz", LIOBIZ_ROOT_ALIASES);
}

export async function ensureFolder(name: string, parentId?: number | null): Promise<FilesIrFileEntry> {
  const aliases = name === "Liobiz" ? LIOBIZ_ROOT_ALIASES : [];
  const existing = await findFolderByName(parentId ?? null, name, aliases);
  if (existing) return existing;
  return createFolder(name, parentId);
}

export async function deleteEntries(entryIds: number[], deleteForever = false) {
  return filesIrRequest("/file-entries/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryIds, deleteForever: Boolean(deleteForever) }),
  });
}

export async function moveEntries(entryIds: number[], destinationId: number | null) {
  return filesIrRequest<{ status: string; entries: FilesIrFileEntry[] }>("/file-entries/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryIds, destinationId }),
  });
}

export async function updateEntry(entryId: number, patch: { name?: string; description?: string }) {
  return filesIrRequest<{ status: string; fileEntry: FilesIrFileEntry }>(`/file-entries/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function uploadSimple(file: File | Blob, filename: string, parentId?: number | null) {
  const form = new FormData();
  form.append("file", file, filename);
  if (parentId != null) form.append("parentId", String(parentId));
  return filesIrFormRequest<{ status: string; fileEntry: FilesIrFileEntry }>("/uploads", form);
}

export async function initUpload(body: {
  filename: string;
  size: number;
  parentId?: number | null;
}) {
  return filesIrRequest<FilesIrUploadInitResponse>("/uploads-new/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: body.filename,
      size: body.size,
      parentId: body.parentId ?? null,
    }),
  });
}

export async function uploadSessionFile(sessionId: string, file: File | Blob, filename: string) {
  const form = new FormData();
  form.append("file", file, filename);
  return filesIrFormRequest<{ status: string; fileEntry: FilesIrFileEntry }>(
    `/uploads-new/${encodeURIComponent(sessionId)}/file`,
    form,
  );
}

export async function signUploadParts(sessionId: string, partNumbers: number[]) {
  return filesIrRequest<{ status: string; urls: { partNumber: number; url: string }[] }>(
    `/uploads-new/${encodeURIComponent(sessionId)}/parts/sign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partNumbers }),
    },
  );
}

export async function completeUpload(
  sessionId: string,
  body?: { parts?: { PartNumber: number; ETag: string }[]; uploadKey?: string },
) {
  return filesIrRequest<{ status: string; fileEntry: FilesIrFileEntry }>(
    `/uploads-new/${encodeURIComponent(sessionId)}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
}

export async function cancelUploadSession(sessionId: string) {
  return filesIrRequest(`/uploads-new/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

export async function getOrCreateShareableLink(entryId: number): Promise<{ link: FilesIrShareableLink; publicUrl: string }> {
  try {
    const got = await filesIrRequest<{ status: string; link: FilesIrShareableLink }>(
      `/file-entries/${entryId}/shareable-link`,
    );
    if (got.link?.hash) {
      return { link: got.link, publicUrl: buildShareablePublicUrl(got.link.hash) };
    }
  } catch {
    /* create below */
  }

  const created = await filesIrRequest<{ status: string; link: FilesIrShareableLink }>(
    `/file-entries/${entryId}/shareable-link`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allow_download: true, allow_edit: false }),
    },
  );

  return {
    link: created.link,
    publicUrl: buildShareablePublicUrl(created.link.hash),
  };
}

export function entryKind(entry: FilesIrFileEntry): "image" | "video" | "other" {
  if (entry.type === "image") return "image";
  if (entry.type === "video") return "video";
  if (entry.mime?.startsWith("image/")) return "image";
  if (entry.mime?.startsWith("video/")) return "video";
  return "other";
}

export function toAssetRef(entry: FilesIrFileEntry, shareUrl: string, shareHash?: string) {
  return {
    entryId: entry.id,
    shareUrl,
    shareHash,
    mime: entry.mime,
    fileName: entry.name,
    kind: entryKind(entry),
  };
}
