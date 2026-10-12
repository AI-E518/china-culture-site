// Cloudflare Pages Function：Decap CMS 的 GitHub OAuth 回调
// GitHub 授权后带着 code 跳回 /callback，这里用 code 换取 access_token，
// 写入浏览器 localStorage 后通知后台 /admin/ 完成登录。
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // 校验 state（防 CSRF）：必须和 /auth 写入的 cookie 一致
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)decap_oauth_state=([^;]+)/);
  const savedState = m ? decodeURIComponent(m[1]) : '';
  if (!code || !state || state !== savedState) {
    return new Response('Invalid OAuth state or missing code.', { status: 400 });
  }

  const clientId = (env.GITHUB_CLIENT_ID || '').trim();
  const clientSecret = (env.GITHUB_CLIENT_SECRET || '').trim();

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
      redirect_uri: url.origin + '/callback',
    }),
  });
  const data = await resp.json();
  const token = data.access_token || '';

  if (!token) {
    return new Response('GitHub 授权失败：未获取到 access_token（请检查 Client Secret 是否正确）。', { status: 500 });
  }

  // Decap CMS 的 GitHub OAuth 需要双向握手：
  // 1) 弹窗先向父窗发 "authorizing:github"
  // 2) 父窗回 ack 后，弹窗再发 "authorization:github:success:{token,provider}"
  const content = JSON.stringify({ token, provider: 'github' });
  const successMessage = `authorization:github:success:${content}`;
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><script>
  (function () {
    if (!window.opener) {
      document.body.textContent = '无法与 Decap 后台通信：弹窗被浏览器隔离。请关闭此窗口并允许 askoldai.com 的弹窗。';
      return;
    }
    function receiveMessage(e) {
      window.opener.postMessage(${JSON.stringify(successMessage)}, e.origin);
      window.removeEventListener('message', receiveMessage, false);
      window.close();
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script></head>
<body>Signing in…</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': 'decap_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
}
