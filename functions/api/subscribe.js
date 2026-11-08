// Cloudflare Pages Function：锦囊订阅服务端代理
// 前端把 { email, name, lang } POST 到这里，本函数再转发到 Brevo(Sendinblue) API。
// 好处：API Key 留在服务端（不暴露给前端）、无跨域问题、可返回 JSON 给前端弹成功提示。
//
// 流程：
//   1) POST /v3/contacts      把订阅者写入指定列表（这一步成功即视为订阅成功）
//   2) POST /v3/smtp/email    当场发一封欢迎信，附上《中国旅行锦囊》PDF 下载链接
// 第 2 步失败（未配发件人 / 权限不足 / 额度用完）只写日志，不影响第 1 步结果，
// 且前端成功态本身就会直接给出两个 PDF 直链，访客不会空手而归。
//
// 需要在 Cloudflare Pages 项目 Settings → Variables and Secrets 配置：
//   BREVO_API_KEY        Brevo 账号 API Key（头像 → SMTP & API → API Keys）
//                        ⚠ 权限要求：Contacts = All，Transactional email = All
//                          （Transactional email 只有 None/Read/All 三档，Read 不能发信）
//   BREVO_LIST_ID        接收订阅者的列表 ID（Contacts → Lists，纯数字）
//   BREVO_SENDER_EMAIL   （可选，默认 56861701@qq.com）发件邮箱，需先在 Brevo「Senders」验证
//   BREVO_SENDER_NAME    （可选，默认 'Lao Ai · China Living'）发件人显示名
//   BREVO_REPLY_TO       （可选，默认 56861701@qq.com）回信地址，锦囊「回信四行」钩子
//   BREVO_LANG_ATTR      （可选）Brevo 自定义属性名，用于写入语言偏好；不配则忽略
// 注：发件人三项都有内置默认值，Cloudflare 里不需要额外添加变量；
//     但发件邮箱本身必须先在 Brevo 后台验证通过，否则 Brevo 会拒绝发信。
//
// 合规说明：前端表单已含「同意 + 隐私链接」，此处为 single opt-in，符合 GDPR 对「可证明同意」的要求。
//
// GET /api/subscribe?imp=1 仅用于 CTA 曝光埋点（返回 204，不落库）。

const BREVO_CONTACTS = 'https://api.brevo.com/v3/contacts';
const BREVO_EMAIL = 'https://api.brevo.com/v3/smtp/email';

const KIT_EN = 'https://askoldai.com/kit/china-travel-kit.pdf';
const KIT_ZH = 'https://askoldai.com/kit/china-travel-kit-zh.pdf';

const SUBJECTS = {
  en: 'Your China Travel Kit is ready 🎒',
  zh: '你的《中国旅行锦囊》已备好 🎒',
  ja: '中国旅行キットをお届けします 🎒',
  ko: '중국 여행 키트가 준비됐어요 🎒',
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  if (url.searchParams.get('imp') === '1') {
    return new Response(null, { status: 204 });
  }
  return new Response('Method not allowed', { status: 405 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = (env.BREVO_API_KEY || '').trim();
  const listId = (env.BREVO_LIST_ID || '').trim();
  const listIdNum = parseInt(listId, 10);

  if (!apiKey || isNaN(listIdNum)) {
    return json(
      { ok: false, error: '订阅服务未配置：请在 Cloudflare 添加 BREVO_API_KEY 与 BREVO_LIST_ID（数字）。' },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '请求格式错误。' }, 400);
  }

  const email = (body.email || '').toString().trim();
  const name = (body.name || '').toString().trim();
  const lang = (body.lang || '').toString().trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: '邮箱格式不正确。' }, 400);
  }

  const attributes = {};
  if (name) attributes.FIRSTNAME = name;
  const langAttr = (env.BREVO_LANG_ATTR || '').trim();
  if (langAttr && lang) {
    attributes[langAttr] = lang;
  }

  const payload = {
    email,
    attributes,
    listIds: [listIdNum],
    updateEnabled: true, // 已订阅用户再次提交时更新而非报错
  };

  try {
    const res = await fetch(BREVO_CONTACTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
    // Brevo 成功：201（新建）或 204（已存在并更新）
    if (res.status === 201 || res.status === 204) {
      // 落库成功即返回；欢迎信异步发送，失败不影响订阅结果
      const mail = sendWelcomeEmail({ apiKey, email, name, lang, env });
      if (typeof context.waitUntil === 'function') {
        context.waitUntil(mail);
      } else {
        await mail;
      }
      return json({ ok: true }, 200);
    }
    const data = await res.json().catch(() => ({}));
    return json(
      { ok: false, error: data.message || '订阅失败，请稍后重试。' },
      res.ok ? 200 : 502
    );
  } catch {
    return json({ ok: false, error: '网络异常，请稍后重试。' }, 502);
  }
}

// 欢迎信：事务邮件（免费档含 300 封/天，不依赖营销自动化档位）。
// 内部吞掉所有异常，保证永远不会 reject（waitUntil 里抛错会污染 Worker 日志）。
async function sendWelcomeEmail({ apiKey, email, name, lang, env }) {
  // 三项均有内置默认值，Cloudflare 无需额外配变量；只需该邮箱在 Brevo 已 Verified
  const senderEmail = (env.BREVO_SENDER_EMAIL || '56861701@qq.com').trim();
  const senderName = (env.BREVO_SENDER_NAME || 'Lao Ai · China Living').trim();
  const replyTo = (env.BREVO_REPLY_TO || '56861701@qq.com').trim();
  const subject = SUBJECTS[lang] || SUBJECTS.en;
  const primary = lang === 'zh' ? KIT_ZH : KIT_EN;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const greeting = name ? `<p>Hi ${esc(name)},</p>` : '';

  const htmlContent = `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#333;max-width:640px">
    ${greeting}
    <p>Thanks for subscribing to China Living! Your printable China Travel Kit is ready —
    visas &amp; visa-free entry, paying with a foreign card, staying connected, trains,
    seasons &amp; crowds, etiquette, emergency numbers and a packing list.</p>
    <p style="margin:18px 0">
      <a href="${KIT_EN}" style="background:#d2492a;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;display:inline-block">Download the Kit · English</a>
      &nbsp;
      <a href="${KIT_ZH}" style="background:#f2e3d5;color:#8a3a1f;padding:11px 18px;border-radius:8px;text-decoration:none;display:inline-block">下载中文版《中国旅行锦囊》</a>
    </p>
    <p>Your recommended version: <a href="${primary}">${lang === 'zh' ? '中文版' : 'English edition'}</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:22px 0" />
    <p>感谢订阅「中国生活」！可打印的《中国旅行锦囊》已备好，涵盖免签、外卡支付、上网、火车票、季节人流、礼仪、应急电话与行李清单。上方两个链接任选其一。</p>
    <p>China Living へのご登録ありがとうございます！印刷できるガイド（ビザ・決済・通信・列車・季節・マナー・緊急連絡・持ち物）は上記リンクから（English 版）。</p>
    <p>China Living 구독 감사합니다! 비자·결제·통신·기차·계절·예절·비상연락·짐 목록을 담은 인쇄용 가이드는 위 링크에서 받으실 수 있습니다(English 버전).</p>
    <hr style="border:none;border-top:1px solid #eee;margin:22px 0" />
    <p><strong>One last thing:</strong> this Kit gives you the rules that apply to everyone.
    Your trip needs its own version. Just reply to this email with four lines —
    your country / the month you're coming / how many days / who's travelling with you —
    and I'll work out a plan for your trip.</p>
    <p>回信写四行也行：国籍 / 月份 / 天数 / 同行人。老艾 · 于上海</p>
    <p style="font-size:12px;color:#999;margin-top:24px">You received this because you subscribed at askoldai.com. Reply to unsubscribe.</p>
  </div>`;

  try {
    const res = await fetch(BREVO_EMAIL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, ...(name ? { name } : {}) }],
        replyTo: { email: replyTo, name: 'Lao Ai' },
        subject,
        htmlContent,
        tags: ['china-travel-kit'],
      }),
    });
    if (!res.ok) {
      // 常见：Access denied for resource（Transactional email 权限为 None）或 Sender not authorized
      console.warn(`[subscribe] 欢迎邮件发送失败 ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
  } catch (e) {
    console.warn('[subscribe] 欢迎邮件异常：' + (e && e.message ? e.message : String(e)));
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
