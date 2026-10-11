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
  // Cloudflare Pages（Git 关联）原生部署：构建命令跑完，Cloudflare 自动把 dist 上线。
  // 不需要写任何 Deploy command，也不要 wrangler.jsonc（它会逼 Cloudflare 走命令行部署并卡 token 权限，报 code 10000）。
  // 用 server 模式，路由（含 /auth、/callback 这两个 API routes）由 Pages Functions/Worker 运行时处理。
  output: 'server',
  adapter: cloudflare(),
  integrations: [sitemap()],
  // Cloudflare Workers 不支持 sharp 运行时：本站未使用 astro:assets，直接关闭图片优化服务，
  // 避免 sharp 被打包进 Worker 导致部署报 child_process/fs 解析错误。
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
  },
});
