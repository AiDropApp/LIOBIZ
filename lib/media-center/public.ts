import type { BlogPost } from "@/lib/blog-defaults";
import type { CreativePartnerItem } from "@/lib/landing-defaults";
import { normalizeMediaFields } from "@/lib/media-types";
import type { MediaAssetRef, MediaCard, MediaCategory, MediaCenterStore } from "@/lib/filesir/types";
import { categoryPath } from "@/lib/media-center/categories";
import { publicMediaUrl } from "@/lib/media-center/local-url";
import { slugify } from "@/lib/media-center/store";
import type { BackstageItem, PortfolioItem } from "@/lib/content-store";
import type { PortfolioCategory } from "@/lib/portfolio";
import { existsSync } from "fs";
import path from "path";
import { getMediaRootDir } from "@/lib/media-center/local-map";

function thumbUrlForEntry(entryId?: number | null): string | null {
  if (!entryId || !Number.isFinite(Number(entryId))) return null;
  const abs = path.join(getMediaRootDir(), ".thumbs", `${Number(entryId)}.webp`);
  if (!existsSync(abs)) return null;
  return `/media/.thumbs/${Number(entryId)}.webp`;
}

function primaryEntryId(card: MediaCard): number | undefined {
  const ref = card.video || card.image || card.cover || card.avatar;
  return ref?.entryId;
}

function stableNumericId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash || Date.now();
}

function assetUrl(ref?: MediaAssetRef | null): string {
  return ref?.shareUrl?.trim() || "";
}

function localAssetUrl(ref?: MediaAssetRef | null): string | null {
  const localPath = ref?.localPath?.trim();
  if (!localPath) return null;
  return publicMediaUrl(localPath);
}

function imageDisplayUrl(ref?: MediaAssetRef | null, fallback = "/images/logo.png"): string {
  const local = localAssetUrl(ref);
  if (local && ref?.kind !== "video") return local;
  if (ref?.entryId && ref.kind !== "video") {
    return `/api/media/filesir/${ref.entryId}`;
  }
  const direct = assetUrl(ref);
  if (direct && !direct.includes("my.files.ir/drive/s/")) return direct;
  return fallback;
}

function videoDisplayUrl(ref?: MediaAssetRef | null): string | undefined {
  const local = localAssetUrl(ref);
  if (local && ref?.kind === "video") return local;
  if (ref?.entryId && ref.kind === "video") {
    return `/api/media/filesir/${ref.entryId}`;
  }
  const direct = assetUrl(ref);
  if (direct && !direct.includes("my.files.ir/drive/s/")) return direct;
  return undefined;
}

function videoPosterUrl(card: MediaCard): string {
  if (card.cover || card.image || card.avatar) {
    return imageDisplayUrl(card.cover || card.image || card.avatar, "/images/logo.png");
  }
  return "/images/logo.png";
}

function categoryName(categories: MediaCategory[], categoryId?: string | null): string {
  return categoryPath(categories, categoryId);
}

function categoryIdOrFallback(categories: MediaCategory[], categoryId?: string | null): string {
  if (categoryId && categories.some((c) => c.id === categoryId)) return categoryId;
  return categories[0]?.id || "uncategorized";
}

export function mediaCategoriesToPortfolio(
  categories: MediaCategory[],
  section: "portfolio" | "blog",
): PortfolioCategory[] {
  return categories
    .filter((c) => c.section === section && !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fa"))
    .map((c) => ({
      id: c.id,
      name: c.name,
      order: c.sortOrder,
    }));
}

function hasPlayableVideo(ref?: MediaAssetRef | null): boolean {
  return Boolean(ref?.kind === "video" && (ref.localPath || ref.entryId));
}

function hasPlayableImage(ref?: MediaAssetRef | null): boolean {
  return Boolean(ref && ref.kind !== "video" && (ref.localPath || ref.entryId));
}

export function cardToPortfolioItem(card: MediaCard, categories: MediaCategory[]): PortfolioItem {
  const hasVideo = hasPlayableVideo(card.video);
  const videoSrc = hasVideo ? videoDisplayUrl(card.video) : undefined;
  const fullImage = hasVideo
    ? videoPosterUrl(card)
    : imageDisplayUrl(card.image || card.cover || card.avatar, "/images/logo.png");
  const thumb =
    thumbUrlForEntry(primaryEntryId(card)) ||
    thumbUrlForEntry(card.cover?.entryId) ||
    thumbUrlForEntry(card.image?.entryId);
  const image = thumb || fullImage;

  return normalizeMediaFields({
    id: stableNumericId(card.id),
    title: card.title,
    category: categoryName(categories, card.categoryId),
    categoryId: categoryIdOrFallback(categories, card.categoryId),
    image,
    imageFull: image !== fullImage && fullImage !== "/images/logo.png" ? fullImage : undefined,
    videoSrc,
    mediaKind: hasVideo ? "video" : "image",
    description: card.description?.trim() || undefined,
  }) as PortfolioItem;
}

export function cardToBackstageItem(card: MediaCard): BackstageItem {
  const videoRef = hasPlayableVideo(card.video) ? card.video : null;
  const imageRef = hasPlayableImage(card.image)
    ? card.image
    : hasPlayableImage(card.cover)
      ? card.cover
      : null;
  const caption = card.caption?.trim() || card.description?.trim() || card.title;

  if (videoRef) {
    const videoSrc = videoDisplayUrl(videoRef);
    return normalizeMediaFields({
      id: stableNumericId(card.id),
      image: imageRef ? imageDisplayUrl(imageRef, "") : "",
      caption,
      videoSrc,
      mediaKind: "video",
    }) as BackstageItem;
  }

  if (imageRef) {
    return normalizeMediaFields({
      id: stableNumericId(card.id),
      image: imageDisplayUrl(imageRef, ""),
      caption,
      mediaKind: "image",
    }) as BackstageItem;
  }

  return normalizeMediaFields({
    id: stableNumericId(card.id),
    image: "",
    caption,
    mediaKind: "image",
  }) as BackstageItem;
}

function backstageItemHasMedia(item: BackstageItem): boolean {
  if (item.videoSrc?.trim()) return true;
  return Boolean(item.image?.trim());
}

export function cardToCreativePartner(card: MediaCard): CreativePartnerItem {
  const showcaseVideo = hasPlayableVideo(card.video) ? card.video : null;
  const avatarRef = card.avatar?.localPath || card.avatar?.entryId ? card.avatar : null;

  const avatarVideoSrc = hasPlayableVideo(avatarRef) ? videoDisplayUrl(avatarRef) : undefined;

  let avatarSrc = "/images/logo.png";
  if (hasPlayableImage(avatarRef)) {
    avatarSrc = imageDisplayUrl(avatarRef, "/images/logo.png");
  }

  const videoRef = showcaseVideo || (hasPlayableVideo(avatarRef) ? avatarRef : null);
  const hasVideo = Boolean(videoRef);
  const videoSrc = hasVideo ? videoDisplayUrl(videoRef) : undefined;

  return normalizeMediaFields({
    id: card.id,
    name: card.title,
    role: card.role?.trim() || "همکار خلاق",
    showcase: card.city?.trim() || card.caption?.trim() || "نمونه کار",
    bio: card.description?.trim() || "",
    quote: card.caption?.trim() || card.description?.trim() || card.title,
    avatarSrc,
    avatarVideoSrc,
    videoSrc,
    mediaKind: hasVideo ? "video" : "image",
    image: avatarVideoSrc || avatarSrc,
    aspectRatio: "landscape",
  }) as CreativePartnerItem;
}

export function cardToBlogPost(card: MediaCard, categories: MediaCategory[]): BlogPost {
  const coverImage = imageDisplayUrl(card.cover || card.image, "/images/logo.png");
  const excerpt = card.description?.trim() || card.caption?.trim() || "";
  const tag = categoryName(categories, card.categoryId);

  return {
    id: card.id,
    slug: slugify(card.title) || card.id,
    title: card.title,
    excerpt,
    content: card.description?.trim() || excerpt,
    coverImage,
    author: "تیم لیوبیز",
    publishedAt: card.updatedAt || card.createdAt,
    published: true,
    tags: tag !== "سایر" ? [tag] : [],
  };
}

export function applyMediaCenterToSiteContent<T extends {
  portfolio: PortfolioItem[];
  portfolioCategories: PortfolioCategory[];
  backstage: BackstageItem[];
  creativePartners: CreativePartnerItem[];
  blogPosts: BlogPost[];
}>(content: T, store: MediaCenterStore): T {
  const published = store.cards.filter((c) => c.published);

  const portfolioCards = published
    .filter((c) => c.section === "portfolio")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (portfolioCards.length > 0) {
    const cats = mediaCategoriesToPortfolio(store.categories, "portfolio");
    content.portfolioCategories = cats.length > 0 ? cats : content.portfolioCategories;
    content.portfolio = portfolioCards.map((c) => cardToPortfolioItem(c, store.categories));
  }

  if (store.cards.some((c) => c.section === "backstage")) {
    const backstageCards = published
      .filter((c) => c.section === "backstage")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => cardToBackstageItem(c))
      .filter(backstageItemHasMedia);
    content.backstage = backstageCards;
  }

  const partnerCards = published
    .filter((c) => c.section === "creative-partners")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (partnerCards.length > 0) {
    content.creativePartners = partnerCards.map(cardToCreativePartner);
  }

  return content;
}

export async function readPublicSiteContentWithMedia<T extends {
  portfolio: PortfolioItem[];
  portfolioCategories: PortfolioCategory[];
  backstage: BackstageItem[];
  creativePartners: CreativePartnerItem[];
  blogPosts: BlogPost[];
}>(content: T): Promise<T> {
  const { readMediaCenterStore } = await import("@/lib/media-center/store");
  const { maybePruneCardsFromMyFile } = await import("@/lib/media-center/sync-prune");
  await maybePruneCardsFromMyFile();
  const store = await readMediaCenterStore();
  return applyMediaCenterToSiteContent(content, store);
}
