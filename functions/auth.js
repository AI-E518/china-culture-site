// Cloudflare Pages Function：Decap CMS 的 GitHub OAuth 登录入口
// 访问 /auth 时，重定向到 GitHub 授权页。
// 环境变量 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 在 Cloudflare 项目 Settings → Variables and Secrets 里配置。
export async function onRequestGet({ request, env }) {
  const clientId = (env.GITHUB_CLIENT_ID || '').trim();
  const url = new URL(request.url);

  if (!clientId) {
    return new Response(
      'Decap auth 未配置：请在 Cloudflare Pages 项目设置里添加环境变量 GITHUB_CLIENT_ID。',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  // 生成随机 state 防 CSRF，写入 cookie（/callback 时校验）
  const state = crypto.randomUUID();
  const redirectUri = url.origin + '/callback';
  const authUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + encodeURIComponent('repo') +
    '&state=' + encodeURIComponent(state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': 'decap_oauth_state=' + state + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300',
    },
  });
}
