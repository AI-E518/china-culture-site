// 自动翻译脚本：把中文文章（*-zh.md）翻译成 en/ja/ko 草稿
// 运行：node scripts/translate.mjs <中文文件1> <中文文件2> ...
// 依赖：环境变量 QWEN_API_KEY（百炼 API Key），调用 qwen-mt-flash
// 护栏：仅当目标语言文件【不存在】时生成草稿（draft:true），避免覆盖已发布/已润色内容

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');
const TARGET_LANGS = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

const API_KEY = process.env.QWEN_API_KEY;
if (!API_KEY) {
  console.error('❌ 缺少环境变量 QWEN_API_KEY，请在 GitHub Secrets 中配置');
  process.exit(1);
}

// ---- 解析 / 生成 frontmatter（零依赖，手写简单 YAML）----
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const fmText = m[1];
  const body = m[2];
  const fm = {};
  for (const line of fmText.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return { fm, body };
}

function buildMarkdown(fm, body) {
  let out = '---\n';
  for (const [k, v] of Object.entries(fm)) {
    if (k === 'body') continue;
    out += `${k}: ${JSON.stringify(v)}\n`;
  }
  out += `---\n${body}`;
  return out;
}

// ---- 调用 qwen-mt-flash 翻译 ----
async function translate(text, targetName) {
  const sys = `You are a professional translator for a China culture/food/heritage website. Translate the following Chinese text into ${targetName}. Preserve ALL markdown syntax exactly: headings (#, ##), bold/italic, lists (-, 1.), links [text](url), and line breaks. Keep place names and proper nouns natural. Output ONLY the translated text, no commentary, no code fences.`;
  const res = await fetch(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-mt-flash',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`翻译 API 失败 ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// 单篇文章：生成三种语言草稿
async function translatePost(zhFile) {
  const abs = join(POSTS_DIR, zhFile);
  if (!existsSync(abs)) {
    console.log(`⚠️ 文件不存在，跳过：${zhFile}`);
    return;
  }
  const raw = readFileSync(abs, 'utf8');
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    console.log(`⚠️ 无法解析 frontmatter，跳过：${zhFile}`);
    return;
  }
  const { fm, body } = parsed;
  if (fm.lang !== 'zh') {
    console.log(`↪️ 非中文源，跳过：${zhFile}`);
    return;
  }
  // base slug：去掉 .md 及末尾语言后缀(-zh/-en/-ja/-ko)
  const base = zhFile.replace(/\.md$/, '').replace(/-(en|ja|ko|zh)$/, '');

  for (const { code, name } of TARGET_LANGS) {
    const targetFile = `${base}-${code}.md`;
    const targetAbs = join(POSTS_DIR, targetFile);
    // 护栏：已存在且非草稿（已发布）→ 跳过，不覆盖人工润色
    if (existsSync(targetAbs)) {
      const existing = parseFrontmatter(readFileSync(targetAbs, 'utf8'));
      if (existing && existing.fm.draft !== 'true' && existing.fm.draft !== true) {
        console.log(`↪️ 已发布，跳过：${targetFile}`);
        continue;
      }
    }
    try {
      console.log(`🔄 翻译 ${zhFile} → ${targetFile}`);
      const [tTitle, tSummary, tBody] = await Promise.all([
        translate(fm.title || '', name),
        translate(fm.summary || '', name),
        translate(body || '', name),
      ]);
      const outFm = {
        ...fm,
        title: tTitle,
        summary: tSummary,
        lang: code,
        draft: true, // 草稿：后台可编辑，构建时不发布
      };
      // tags/location/category/pubDate/cover/faq 保留原值（待人工顺稿时调整）
      writeFileSync(targetAbs, buildMarkdown(outFm, tBody), 'utf8');
      console.log(`✅ 生成草稿：${targetFile}`);
    } catch (e) {
      console.error(`❌ ${targetFile} 失败：${e.message}`);
    }
  }
}

// ---- 主流程 ----
const files = process.argv.slice(2).filter((f) => f.endsWith('.md'));
if (files.length === 0) {
  console.log('无中文文章传入，退出');
  process.exit(0);
}
for (const f of files) {
  await translatePost(f);
}
console.log('🎉 翻译完成');
