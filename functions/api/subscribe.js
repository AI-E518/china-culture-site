// Cloudflare Pages Function：锦囊订阅服务端代理
// 前端把 { email, name, lang } POST 到这里，本函数再转发到 Brevo(Sendinblue) API。
// 好处：API Key 留在服务端（不暴露给前端）、无跨域问题、可返回 JSON 给前端弹成功提示。
//
// 需要在 Cloudflare Pages 项目 Settings → Variables and Secrets 配置：
//   BREVO_API_KEY    Brevo 账号的 API Key（Settings → SMTP & API → API Keys → 新建/复制，选 V3）
//   BREVO_LIST_ID    接收《中国旅行锦囊》订阅者的列表 ID（Contacts → Lists → 新建列表后看地址栏数字）
//   BREVO_LANG_ATTR  （可选）Brevo 自定义属性名（需先在 Contacts → Settings → Attributes 建一个
//                     text 属性，例如 LANGUAGE），用于写入语言偏好；不配则忽略该字段。
//
// 合规说明：前端表单已含「同意 + 隐私链接」，此处为 single opt-in，符合 GDPR 对「可证明同意」的要求。
// 若需标准 double opt-in（确认邮件二次点击），可在 Brevo 后台建一个开启 Double opt-in 的 Form 另行触发。
//
// GET /api/subscribe?imp=1 仅用于 CTA 曝光埋点（返回 204，不落库）。

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/contacts';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  if (url.searchParams.get('imp') === '1') {
    return new Response(null, { status: 204 });
  }
  return new Response('Method not allowed', { status: 405 });
}

export async function onRequestPost({ request, env }) {
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
  // 语言偏好写入 Brevo 自定义属性（需先在 Brevo 建好同名字段，否则忽略该字段避免 400）
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
    const res = await fetch(BREVO_ENDPOINT, {
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

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
