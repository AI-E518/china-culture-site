import type { APIRoute } from 'astro';

// Decap CMS 的 GitHub OAuth 回调：用 code 换 access_token，写入 localStorage 后跳回后台
export const GET: APIRoute = async ({ url, locals }) => {
  const env: Record<string, string> = (locals as any)?.runtime?.env ?? {};
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const redirectUri = `${url.origin}/callback`;

  if (!clientId || !clientSecret) {
    return new Response(
      'Decap auth 未配置：请在 Cloudflare Pages 项目设置里添加环境变量 GITHUB_CLIENT_ID 与 GITHUB_CLIENT_SECRET。',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  // 用 code 换 access_token
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
  const data: any = await resp.json();
  const token = data.access_token || '';

  // 把 token 写进 localStorage，Decap 后台会读取它
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
};
