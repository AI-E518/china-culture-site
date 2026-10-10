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
  output: 'static', // 纯静态，部署到 Cloudflare Pages 免服务器
  integrations: [sitemap()],
});
