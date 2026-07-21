export type FilesIrFileEntry = {
  id: number;
  name: string;
  file_name?: string;
  file_size?: number;
  parent_id?: number | null;
  workspace_id?: number;
  mime?: string;
  url?: string;
  hash?: string;
  type: "folder" | "image" | "video" | "text" | "audio" | "pdf";
  description?: string;
  created_at?: string;
  updated_at?: string;
  path?: string;
};

export type FilesIrSpaceUsage = {
  status?: string;
  used: number;
  available: number | null;
  remaining: number | null;
};

export type FilesIrUploadMode = "single" | "s3-single" | "s3-multipart" | "tus";

export type FilesIrUploadInitResponse = {
  status: string;
  uploadSessionId: string;
  uploadMode: FilesIrUploadMode;
  partSize?: number | null;
  next?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    completeUrl?: string;
    metadata?: Record<string, string>;
  } | null;
};

export type FilesIrShareableLink = {
  id: number;
  hash: string;
  entry_id: number;
  allow_download?: boolean;
  allow_edit?: boolean;
  expires_at?: string | null;
};

export type MediaSection = "portfolio" | "backstage" | "creative-partners" | "blog";

export const MEDIA_SECTIONS: { id: MediaSection; label: string; folderName: string }[] = [
  { id: "portfolio", label: "نمونه کار", folderName: "portfolio" },
  { id: "backstage", label: "پشت صحنه", folderName: "backstage" },
  { id: "creative-partners", label: "همکاران خلاق", folderName: "creative-partners" },
  { id: "blog", label: "بلاگ", folderName: "blog" },
];

/** Sections shown in admin media center (blog is managed in the blog editor). */
export const ADMIN_MEDIA_SECTIONS = MEDIA_SECTIONS.filter((s) => s.id !== "blog");

export type MediaAssetRef = {
  entryId: number;
  shareUrl: string;
  shareHash?: string;
  mime?: string;
  fileName?: string;
  kind: "image" | "video" | "other";
};

export type MediaCategory = {
  id: string;
  section: MediaSection;
  name: string;
  slug: string;
  folderId: number;
  parentId?: string | null;
  sortOrder: number;
  createdAt: string;
};

export type MediaCard = {
  id: string;
  section: MediaSection;
  categoryId?: string | null;
  title: string;
  description?: string;
  caption?: string;
  role?: string;
  city?: string;
  cover?: MediaAssetRef | null;
  video?: MediaAssetRef | null;
  image?: MediaAssetRef | null;
  avatar?: MediaAssetRef | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MediaCenterStore = {
  version: 1;
  rootFolderId?: number;
  sectionFolderIds: Partial<Record<MediaSection, number>>;
  categories: MediaCategory[];
  cards: MediaCard[];
};

export const EMPTY_MEDIA_STORE: MediaCenterStore = {
  version: 1,
  sectionFolderIds: {},
  categories: [],
  cards: [],
};
