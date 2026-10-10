// Cloudflare Pages 高级模式 Worker（根目录 _worker.js）
// 作用：① 处理 Decap CMS 的 GitHub OAuth 登录（/auth 与 /callback）
//       ② 其余请求交给静态资源（env.ASSETS）返回网站页面
// 注意：本项目已删除 functions/ 目录，全部登录逻辑收口在此文件。

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---- 登录入口：重定向到 GitHub 授权页 ----
    if (url.pathname === '/auth') {
      const clientId = env.GITHUB_CLIENT_ID;
      if (!clientId) {
        return new Response(
          'Decap auth 未配置：请在 Cloudflare Pages 项目设置里添加环境变量 GITHUB_CLIENT_ID。',
          { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }
      const redirectUri = `${url.origin}/callback`;
      const authUrl =
        'https://github.com/login/oauth/authorize' +
        '?client_id=' + encodeURIComponent(clientId) +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&scope=' + encodeURIComponent('repo') +
        '&state=askoldai';
      return Response.redirect(authUrl, 302);
    }

    // ---- 登录回调：用 code 换 token，写入 localStorage 后跳回后台 ----
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const clientId = env.GITHUB_CLIENT_ID;
      const clientSecret = env.GITHUB_CLIENT_SECRET;
      const redirectUri = `${url.origin}/callback`;

      if (!clientId || !clientSecret) {
        return new Response(
          'Decap auth 未配置：请在 Cloudflare Pages 项目设置里添加环境变量 GITHUB_CLIENT_ID 与 GITHUB_CLIENT_SECRET。',
          { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }

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

    // ---- 其余请求：返回静态网站资源 ----
    return env.ASSETS.fetch(request);
  },
};
