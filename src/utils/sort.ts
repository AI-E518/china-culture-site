// 文章列表统一排序工具：置顶(pinned) → 手动序号(order 升序) → 发布日期(pubDate 倒序)
// 不填任何字段的文章行为与原来完全一致（按发布日期倒序），向后兼容。
import type { CollectionEntry } from 'astro:content';

export function sortPosts(
  posts: CollectionEntry<'posts'>[]
): CollectionEntry<'posts'>[] {
  return [...posts].sort((a, b) => {
    // 1. 置顶优先：pinned 的文章压在所有非置顶之前
    const pa = a.data.pinned ? 1 : 0;
    const pb = b.data.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa; // pb-pa：pinned 多的排前面
    // 2. 手动序号：数字越小越靠前
    const oa = a.data.order ?? 0;
    const ob = b.data.order ?? 0;
    if (oa !== ob) return oa - ob;
    // 3. 兜底：发布日期新的在前
    return b.data.pubDate.getTime() - a.data.pubDate.getTime();
  });
}
