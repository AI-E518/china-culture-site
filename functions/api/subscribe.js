// Cloudflare Pages Function：锦囊订阅服务端代理
// 前端把 { email, name, lang } POST 到这里，本函数再转发到 Kit(ConvertKit) API。
// 好处：API Key 留在服务端（不暴露给前端）、无跨域问题、可返回 JSON 给前端弹成功提示。
//
// 需要在 Cloudflare Pages 项目 Settings → Variables and Secrets 配置：
//   KIT_API_KEY   Kit 账号的 API Key（Settings → Advanced → API）
//   KIT_FORM_ID   Kit 里「中国旅行锦囊」订阅表单的 Form ID
//   KIT_LANG_FIELD（可选）Kit 自定义字段名，用于写入语言偏好；不配则忽略该字段
//
// GET /api/subscribe?imp=1 仅用于 CTA 曝光埋点（返回 204，不落库）。

const KIT_ENDPOINT = 'https://api.convertkit.com/v3/forms';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  if (url.searchParams.get('imp') === '1') {
    return new Response(null, { status: 204 });
  }
  return new Response('Method not allowed', { status: 405 });
}

export async function onRequestPost({ request, env }) {
  const apiKey = (env.KIT_API_KEY || '').trim();
  const formId = (env.KIT_FORM_ID || '').trim();

  if (!apiKey || !formId) {
    return json(
      { ok: false, error: '订阅服务未配置：请在 Cloudflare 添加 KIT_API_KEY 与 KIT_FORM_ID。' },
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

  const payload = { api_key: apiKey, email, ...(name ? { first_name: name } : {}) };
  // 语言偏好写入 Kit 自定义字段（需先在 Kit 建好同名字段，否则忽略）
  const langField = (env.KIT_LANG_FIELD || '').trim();
  if (langField && lang) {
    payload.fields = { [langField]: lang };
  }

  try {
    const res = await fetch(`${KIT_ENDPOINT}/${formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    // Kit 成功时返回 200 且含 subscription；业务错误会带 error 字段
    if (res.ok && !data.error) {
      return json({ ok: true }, 200);
    }
    return json(
      { ok: false, error: data.error || '订阅失败，请稍后重试。' },
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
