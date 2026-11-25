import { defineCollection, z } from 'astro:content';

// 文章数据模型：网页后台（Decap CMS）发的每一篇文章都遵循这套字段
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    lang: z.enum(['en', 'zh', 'ja', 'ko']),
    category: z.enum(['heritage', 'food', 'travel', 'shopping']), // heritage=非遗, food=美食, travel=旅游实用信息, shopping=购物指南
    cover: z.string().optional(), // 封面图路径，可空（空则显示占位色块）
    tags: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    author: z.string().optional(),
    location: z.string().optional(),
    // FAQ：用于 GEO 结构化数据（AI 搜索可引用）。
    // 兼容后台旧配置写出的 { item: { q, a } } 包壳结构，统一抹平为 { q, a }，
    // 避免单篇文章 frontmatter 结构异常就让整站构建失败。
    faq: z.preprocess(
      (val: unknown) =>
        Array.isArray(val)
          ? val.map((entry: unknown) =>
              entry && typeof entry === 'object' && 'item' in entry
                ? (entry as { item: unknown }).item
                : entry
            )
          : val,
      z.array(z.object({ q: z.string(), a: z.string() })).optional()
    ),
    draft: z.boolean().optional().default(false), // 草稿标记：true 时后台可编辑但不构建发布，供审校后发布
    pinned: z.boolean().optional().default(false), // 置顶：true 时始终排在所有非置顶文章之前
    order: z.number().optional().default(0), // 手动排序序号：数字越小越靠前（同序号按发布日期兜底）
  }),
});

export const collections = { posts };
