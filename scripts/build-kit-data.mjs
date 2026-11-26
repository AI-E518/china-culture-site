// 把两本《中国旅行锦囊》PDF 转成 base64，生成 functions/_kit-data.js，供 /api/submit 作为邮件附件发送。
//
// 何时运行：换了 PDF 之后，在仓库根目录执行 `node scripts/build-kit-data.mjs`，
//           然后用 GitHub Desktop 把生成的 functions/_kit-data.js 一起提交推送即可。
//
// 为什么这样做：PDF 不再放在 public/ 下（放那儿等于谁都能直接下载，访客就不用留邮箱了）。
// 源 PDF 保留在 assets/kit/（Astro 不会把它输出到网站），函数把内容内置后从邮件附件发给订阅者。
//
// 约束：两本 PDF 原始体积合计不要超过 ~10MB，否则会逼近 Brevo 事务邮件 20MB 的附件上限，
//       也会让 Cloudflare Pages Functions 的 _worker.js 压缩后超过 1MiB 限额。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  {
    src: 'assets/kit/china-travel-kit.pdf',
    varName: 'KIT_EN_PDF',
    attachmentName: 'China-Travel-Kit-EN.pdf',
    label: 'English edition',
  },
  {
    src: 'assets/kit/china-travel-kit-zh.pdf',
    varName: 'KIT_ZH_PDF',
    attachmentName: 'China-Travel-Kit-ZH.pdf',
    label: '中文版',
  },
];

const blocks = [];
const attachments = [];
let total = 0;

for (const f of files) {
  const buf = readFileSync(resolve(root, f.src));
  total += buf.length;
  const b64 = buf.toString('base64');
  blocks.push(`// ${f.label} · 源文件 ${f.src} · ${buf.length} bytes\nexport const ${f.varName} = '${b64}';`);
  attachments.push(`  { name: '${f.attachmentName}', content: ${f.varName} },`);
}

const out = `// 本文件由 scripts/build-kit-data.mjs 自动生成，请勿手改。
// 文件名以下划线开头：Cloudflare Pages 不会把它注册成公开路由，只能通过 /api/submit 内部 import。
// 两本 PDF 以 base64 内置，随欢迎信作为附件发出；公网没有任何下载链接。

${blocks.join('\n\n')}

// Brevo /v3/smtp/email 的 attachment 参数：content 为 base64 字符串，name 用纯英文（中文名会被拒收）。
export const KIT_ATTACHMENTS = [
${attachments.join('\n')}
];
`;

mkdirSync(resolve(root, 'functions'), { recursive: true });
writeFileSync(resolve(root, 'functions/_kit-data.js'), out, 'utf8');

console.log(`已生成 functions/_kit-data.js：${files.length} 本 PDF，原始合计 ${total} bytes，base64 约 ${Math.round((total * 4) / 3)} bytes。`);
