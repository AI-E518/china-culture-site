import type { APIRoute } from 'astro';

// Decap CMS 的 GitHub OAuth 登录入口
// Decap 会访问 /auth?provider=github&site_id=...&scope=...，这里重定向到 GitHub 授权页
export const GET: APIRoute = ({ url, locals }) => {
  const env: Record<string, string> = (locals as any)?.runtime?.env ?? {};
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

  return new Response(null, { status: 302, headers: { Location: authUrl } });
};
