// Decap CMS 登录入口：重定向到 GitHub OAuth 授权页
// 路由：GET /auth  （由 config.yml 的 backend.base_url 指向本站）
export async function onRequest(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  const origin = new URL(context.request.url).origin;
  const redirectUri = `${origin}/callback`;

  // 没有配置 Client ID 时给出明确提示，避免静默失败
  if (!clientId) {
    return new Response(
      'Decap auth 未配置：请在 Cloudflare Pages 项目设置里添加环境变量 GITHUB_CLIENT_ID。',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const authUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('repo')}` +
    `&state=askoldai`;

  return Response.redirect(authUrl, 302);
}
