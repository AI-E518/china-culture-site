// Decap CMS 登录回调：用 code 向 GitHub 换取 access_token，写进浏览器 localStorage 后跳回后台
// 路由：GET /callback
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;
  const redirectUri = `${origin}/callback`;

  if (!clientId || !clientSecret) {
    return new Response(
      'Decap auth 未配置：请在 Cloudflare Pages 项目设置里添加环境变量 GITHUB_CLIENT_ID 与 GITHUB_CLIENT_SECRET。',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  // 用授权码换 access_token
  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await resp.json();
  const token = data.access_token || '';

  // 把 token 交给 Decap 前端（写入它读取的 localStorage key），再跳回后台
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><script>
  (function () {
    try { localStorage.setItem('decap-cms-github-token', ${JSON.stringify(token)}); } catch (e) {}
    window.location.replace('/admin/');
  })();
</script></head>
<body>Signing in…</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
