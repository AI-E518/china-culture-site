import { defineCollection, z } from 'astro:content';

// 文章数据模型：网页后台（Decap CMS）发的每一篇文章都遵循这套字段
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    lang: z.enum(['en', 'zh', 'ja', 'ko']),
    category: z.enum(['heritage', 'food', 'travel']), // heritage=非遗, food=美食, travel=旅游实用信息
    cover: z.string().optional(), // 封面图路径，可空（空则显示占位色块）
    tags: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    author: z.string().optional(),
    location: z.string().optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(), // 旅游/实用指南的 FAQ，用于 GEO 结构化数据（AI 搜索可引用）
  }),
});

export const collections = { posts };
