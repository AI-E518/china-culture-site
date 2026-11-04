// 站点级配置：上线前把下面两项换成你自己的。
// 表单与邮件订阅都用 Web3Forms（免费、无需服务器）：去 https://web3forms.com 输入邮箱即可拿到 Access Key。
export const SITE = {
  name: 'China Living',
  url: 'https://askoldai.com', // 真实域名
  // Web3Forms Access Key：咨询表单与邮件订阅共用一个即可（靠 subject 区分）
  formAccessKey: 'd49445fe-5562-43c8-99f0-f451e56a4347',
  // 接收咨询邮件的邮箱（用于页脚/联系页提示）
  contactEmail: '56861701@qq.com',
  // Cloudflare Web Analytics 令牌（隐私友好、无需 Cookie 同意）。
  // 获取路径：Cloudflare 控制台 → 你的站点 askoldai.com → Analytics & Logs → Web Analytics →
  //   「Add a site / Set up」→ 选 Manual setup → 复制 beacon 里的 token（形如 9xxxxxxx 的一串）填这里。
  // 留空则不高载分析脚本（不影响网站运行）。
  analyticsToken: 'bbbf6f9d5db134467a5960b41d0081e3e',
  // 《中国旅行锦囊》订阅漏斗：本站 /api/subscribe（functions/api/subscribe.js）作为服务端代理转发到 Kit。
  // 下列值不在前端暴露，需到 Cloudflare Pages 项目 Settings → Variables and Secrets 配置：
  //   KIT_API_KEY      Kit 账号 API Key（Settings → Advanced → API）
  //   KIT_FORM_ID      Kit 里「中国旅行锦囊」订阅表单的 Form ID
  //   KIT_LANG_FIELD   （可选）Kit 自定义字段名，用于写入语言偏好；不配则忽略
};
