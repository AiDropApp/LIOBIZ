export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverAlt?: string;
  author: string;
  publishedAt: string;
  published: boolean;
  tags: string[];
  category?: string;
};

/** Seed posts — production content lives in site-content.json on server */
export const defaultBlogPosts: BlogPost[] = [];

export function slugifyBlogTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const defaultBlogCategories = [
  "برندینگ",
  "دیجیتال مارکتینگ",
  "تولید محتوا",
  "طراحی وب",
];
