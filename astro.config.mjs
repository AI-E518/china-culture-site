import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  // 纯静态站点（output: 'static'）：所有页面在构建时生成 HTML，Cloudflare Pages 构建完自动上线。
  // 不需要 @astrojs/cloudflare 适配器、不需要 Worker、不需要 wrangler、不需要填任何部署命令。
  // Decap 后台的 GitHub OAuth 登录改由仓库根目录的 functions/（Cloudflare Pages Functions）处理，
  // 见 functions/auth.js 与 functions/callback.js，它们会以 /auth、/callback 路径对外提供服务。
  output: 'static',
  integrations: [sitemap()],
});
