// Cloudflare Pages Function：全站唯一表单入口 POST /api/submit
// 所有表单（锦囊订阅 / 咨询）都提交到这里，API Key 只在服务端，前端不含任何第三方密钥。
//
// 按 type 分流：
//   type=kit      → ① 写入 Brevo 联系人列表（含来源属性）② 同步发一封带两本 PDF 附件的欢迎信
//                    两步都成功才返回 ok；信发不出去就明确报错，绝不出现「收了邮箱却不给资料」
//   type=consult  → ① 同步发通知邮件到站长邮箱（replyTo = 访客邮箱，点回复即可回客户）
//                    ② 尽力把访客记进 Brevo（失败只记日志，不影响通知送达）
//
// 来源追踪：前端提交时自动带 src_url / src_article / src_lang / src_slot，
// 服务端清洗后写入 Brevo 联系人自定义属性：
//   SRC_URL 来源页面路径 / SRC_ARTICLE 文章 slug / SRC_LANG 页面语种 /
//   SRC_SLOT 表单位置(mid|end|footer|contact) / LEAD_TYPE 线索类型(kit|consult)
// 这 5 个属性须先在 Brevo「Contact attributes」建好（Text 类型）。
// 兜底：万一属性漏建导致 Brevo 拒绝，自动去掉自定义属性重试一次，保证订阅不中断。
//
// Cloudflare Pages 项目 Settings → Variables and Secrets 需要（沿用现有配置，无需新增）：
//   BREVO_API_KEY     Brevo API Key；权限 Contacts = All 且 Transactional email = All
//   BREVO_LIST_ID     接收订阅者的列表 ID（纯数字，如 3）
// 可选（都有内置默认值，不必配置）：
//   BREVO_SENDER_EMAIL / BREVO_SENDER_NAME / BREVO_REPLY_TO / CONSULT_TO_EMAIL
//   BREVO_LANG_ATTR   兼容旧版：额外写入语言偏好的自定义属性名，不配则忽略
//
// 合规：前端表单已含「同意 + 隐私链接」，此处为 single opt-in。
// GET /api/submit?imp=1 仅用于 CTA 曝光埋点（返回 204，不落库）。

import { KIT_ATTACHMENTS } from '../_kit-data.js';

const BREVO_CONTACTS = 'https://api.brevo.com/v3/contacts';
const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';

const LANGS = ['en', 'zh', 'ja', 'ko'];
const SLOTS = ['mid', 'end', 'footer', 'contact'];
const INTERESTS = ['visa', 'itinerary', 'food', 'culture', 'other'];

const KIT_SUBJECTS = {
  en: 'Your China Travel Kit is attached 🎒',
  zh: '你的《中国旅行锦囊》在附件里 🎒',
  ja: '中国旅行キットを添付しました 🎒',
  ko: '중국 여행 키트를 첨부했어요 🎒',
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  if (url.searchParams.get('imp') === '1') {
    return new Response(null, { status: 204 });
  }
  return new Response('Method not allowed', { status: 405 });
}

export async function onRequestPost({ request, env }) {
  const apiKey = (env.BREVO_API_KEY || '').trim();
  const listIdNum = parseInt((env.BREVO_LIST_ID || '').trim(), 10);

  if (!apiKey || isNaN(listIdNum)) {
    return json({ ok: false, error: 'server_not_configured' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // 蜜罐：机器人填了隐藏字段就静默丢弃（不报错，避免试探）
  if (body.botcheck) return json({ ok: true }, 200);

  const type = body.type === 'consult' ? 'consult' : 'kit';
  const email = clean(body.email, 200).toLowerCase();
  const name = clean(body.name, 100);
  const lang = LANGS.includes(body.lang) ? body.lang : 'en'; // 访客在表单里选的偏好语言 → 决定邮件主题
  const srcLang = LANGS.includes(body.src_lang) ? body.src_lang : ''; // 页面语种 → 写入来源属性
  const slot = SLOTS.includes(body.src_slot) ? body.src_slot : '';
  const srcUrl = cleanPath(body.src_url);
  const srcArticle = clean(body.src_article, 200);
  const message = cleanMultiline(body.message, 4000);
  const travelDates = clean(body.travel_dates, 120);
  const interests = (Array.isArray(body.interest) ? body.interest : body.interest ? [body.interest] : [])
    .map((v) => clean(v, 30))
    .filter((v) => INTERESTS.includes(v));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }
  if (type === 'consult' && (!name || !message)) {
    return json({ ok: false, error: 'missing_fields' }, 400);
  }

  const senderEmail = (env.BREVO_SENDER_EMAIL || 'hello@askoldai.com').trim();
  const senderName = (env.BREVO_SENDER_NAME || 'Lao Ai · China Living').trim();
  const replyTo = (env.BREVO_REPLY_TO || '56861701@qq.com').trim();
  const ownerEmail = (env.CONSULT_TO_EMAIL || '56861701@qq.com').trim();
  const langAttr = (env.BREVO_LANG_ATTR || '').trim();

  // 写入 Brevo 的联系人属性（只写有值且已清洗过的）
  const attributes = {};
  if (name) attributes.FIRSTNAME = name;
  if (langAttr && lang) attributes[langAttr] = lang; // 兼容旧配置
  if (srcUrl) attributes.SRC_URL = srcUrl;
  if (srcArticle) attributes.SRC_ARTICLE = srcArticle;
  if (srcLang) attributes.SRC_LANG = srcLang;
  if (slot) attributes.SRC_SLOT = slot;
  attributes.LEAD_TYPE = type;

  const source = {
    SRC_URL: srcUrl,
    SRC_ARTICLE: srcArticle,
    SRC_LANG: srcLang,
    SRC_SLOT: slot,
  };

  if (type === 'kit') {
    // ① 落库
    const contact = await upsertContact({ apiKey, listIdNum, email, attributes });
    if (!contact.ok) {
      console.warn(`[submit] 联系人写入失败 ${contact.status}: ${contact.message}`);
      return json({ ok: false, error: 'contact_failed' }, 502);
    }

    // ② 同步发带附件的欢迎信（失败即返回错误，前端提示重试）
    const mail = await sendMail(apiKey, {
      sender: { name: senderName, email: senderEmail },
      to: [{ email, ...(name ? { name } : {}) }],
      replyTo: { email: replyTo, name: 'Lao Ai' },
      subject: KIT_SUBJECTS[lang] || KIT_SUBJECTS.en,
      htmlContent: kitEmailHtml(lang, name),
      attachment: KIT_ATTACHMENTS,
      tags: ['china-travel-kit'],
    });
    if (!mail.ok) {
      console.warn(`[submit] 欢迎邮件发送失败 ${mail.status}: ${mail.message}`);
      return json({ ok: false, error: 'mail_failed' }, 502);
    }
    return json({ ok: true }, 200);
  }

  // consult：通知邮件是主目标，必须成功
  const notify = await sendMail(apiKey, {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: ownerEmail, name: 'Lao Ai' }],
    replyTo: { email, name: name || email }, // 直接点「回复」就能回给访客
    subject: `[China Living] 新咨询 · ${name}${srcLang ? ' · ' + srcLang.toUpperCase() : ''}`,
    htmlContent: consultEmailHtml({ name, email, travelDates, interests, message, source }),
    tags: ['consult'],
  });
  if (!notify.ok) {
    console.warn(`[submit] 咨询通知发送失败 ${notify.status}: ${notify.message}`);
    return json({ ok: false, error: 'mail_failed' }, 502);
  }

  // 尽力把访客也记进 Brevo，便于在名单里串起「先领锦囊后咨询」；失败不影响已送达的通知
  const contact = await upsertContact({ apiKey, listIdNum, email, attributes });
  if (!contact.ok) {
    console.warn(`[submit] 咨询线索入 Brevo 失败（通知邮件已送达）${contact.status}: ${contact.message}`);
  }
  return json({ ok: true }, 200);
}

// 写入 / 更新联系人。Brevo 若因自定义属性不存在而拒绝，降级为只保留 FIRSTNAME 重试一次。
async function upsertContact({ apiKey, listIdNum, email, attributes }) {
  const base = { email, listIds: [listIdNum], updateEnabled: true };
  let r = await brevoPost(BREVO_CONTACTS, apiKey, { ...base, attributes });
  if (!r.ok && /attribut|parameter|unknown|invalid/i.test(r.message || '')) {
    const minimal = {};
    if (attributes.FIRSTNAME) minimal.FIRSTNAME = attributes.FIRSTNAME;
    console.warn('[submit] Brevo 拒绝自定义属性，降级重试：' + r.message);
    r = await brevoPost(BREVO_CONTACTS, apiKey, { ...base, attributes: minimal });
  }
  return r;
}

async function sendMail(apiKey, payload) {
  return brevoPost(BREVO_EMAIL, apiKey, payload);
}

async function brevoPost(url, apiKey, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let message = text.slice(0, 300);
    try {
      const data = text ? JSON.parse(text) : {};
      message = data.message || data.code || message;
    } catch {}
    return { ok: res.ok, status: res.status, message };
  } catch (e) {
    return { ok: false, status: 0, message: e && e.message ? e.message : String(e) };
  }
}

// 欢迎信：两本 PDF 作为附件随信发出，正文不含任何下载链接。
function kitEmailHtml(lang, name) {
  const greeting = name ? `<p>Hi ${esc(name)},</p>` : '';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#333;max-width:640px">
    ${greeting}
    <p><strong>Your China Travel Kit is attached to this email.</strong> Two PDF files are included —
    the English edition and the 中文版. Save them to your phone or print them before you fly.
    Inside: visas &amp; visa-free entry, paying with a foreign card, staying connected, trains,
    seasons &amp; crowds, etiquette, emergency numbers and a packing list.</p>
    <p>《中国旅行锦囊》已作为<strong>附件</strong>放在本邮件里，英文版与中文版各一份 PDF，直接保存或打印即可。内容涵盖免签、外卡支付、上网、火车票、季节人流、礼仪、应急电话与行李清单。</p>
    <p>中国旅行キットはこのメールに添付しました（英語版・中国語版の PDF 2 ファイル）。保存または印刷してご利用ください。</p>
    <p>중국 여행 키트를 이 메일에 첨부했습니다(영문·중문 PDF 2개). 저장하거나 인쇄해 사용하세요.</p>
    <p style="font-size:13px;color:#777;background:#faf6f2;padding:10px 12px;border-radius:8px">
      没看到附件？请先检查垃圾邮件箱，或回信告诉我，我直接补发。<br />
      Attachments missing? Check your spam folder, or just reply and I'll resend them.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:22px 0" />
    <p><strong>One last thing:</strong> this Kit gives you the rules that apply to everyone.
    Your trip needs its own version. Just reply to this email with four lines —
    your country / the month you're coming / how many days / who's travelling with you —
    and I'll work out a plan for your trip.</p>
    <p>回信写四行也行：国籍 / 月份 / 天数 / 同行人。老艾 · 于上海</p>
    <p style="font-size:12px;color:#999;margin-top:24px">You received this because you subscribed at askoldai.com. Reply to unsubscribe.</p>
  </div>`;
}

// 咨询通知：给站长看，包含来源信息，并提示可直接回复。
function consultEmailHtml({ name, email, travelDates, interests, message, source }) {
  const row = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v || '—')}</td></tr>`;
  const srcText = [source.SRC_LANG && source.SRC_LANG.toUpperCase(), source.SRC_SLOT, source.SRC_ARTICLE, source.SRC_URL]
    .filter(Boolean)
    .join(' · ');
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#333;max-width:680px">
    <h2 style="color:#d2492a;font-size:19px">新咨询 / New consultation request</h2>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
      ${row('姓名', name)}
      ${row('邮箱', email)}
      ${row('出行时间', travelDates)}
      ${row('关注方向', interests.join(', '))}
      ${row('来源', srcText || '—')}
    </table>
    <p style="margin:0 0 6px"><strong>留言内容：</strong></p>
    <div style="background:#faf6f2;border-radius:8px;padding:12px 14px;white-space:normal">${esc(message).replace(/\n/g, '<br />')}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
    <p style="font-size:13px;color:#777">本邮件的 replyTo 已设为访客邮箱，直接点「回复」即可回信给对方，无需手动改收件人。</p>
  </div>`;
}

// 清洗：单行文本（去控制字符、截断）
function clean(v, max) {
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

// 清洗：多行留言（保留换行，供邮件里转成 <br>）
function cleanMultiline(v, max) {
  return String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}

// 只接受本站相对路径，杜绝把外部 URL / 协议名写进 Brevo 属性
function cleanPath(v) {
  const p = clean(v, 300);
  if (!p.startsWith('/') || p.startsWith('//')) return '';
  return p.split(/[?#]/)[0];
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
