import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// 站点根域名
export default defineConfig({
  site: 'https://askoldai.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ja', 'ko'],
    routing: {
      prefixDefaultLocale: true, // /en 英文，/zh 中文，/ja 日文，/ko 韩文
    },
  },
  // Cloudflare 2026 对 Astro 项目自动走 Worker 部署（@astrojs/cloudflare 适配器）
  // 用 server 模式，路由（含 /auth、/callback API routes）由 Worker 处理
  output: 'server',
  adapter: cloudflare(),
  integrations: [sitemap()],
});
