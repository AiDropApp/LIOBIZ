import { uploadBlogMedia } from "@/components/admin/landing/MediaUrlField";

export type CmsUploadKind = "hero" | "about" | "blog" | "backstage" | "creative-partners";

export async function cmsUploadFile(file: File, kind: CmsUploadKind): Promise<string> {
  if (kind === "blog") {
    return uploadBlogMedia(file);
  }
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind === "hero" ? "hero" : kind);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "آپلود ناموفق");
  return data.url as string;
}
