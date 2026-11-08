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
  // 《中国旅行锦囊》订阅漏斗：本站 /api/subscribe（functions/api/subscribe.js）作为服务端代理：
  // 写联系人进 Brevo 列表 + 当场发欢迎信（含 PDF 直链）。下列值不暴露给前端，
  // 需到 Cloudflare Pages 项目 Settings → Variables and Secrets 配置：
  //   BREVO_API_KEY        API Key；权限需 Contacts = All 且 Transactional email = All
  //   BREVO_LIST_ID        接收订阅者的列表 ID（纯数字）
  //   BREVO_LANG_ATTR      可选，Brevo 自定义属性名，用于写入语言偏好；不配则忽略
  // 发件人三项（BREVO_SENDER_EMAIL / NAME / REPLY_TO）已有内置默认值，无需配置变量。
  // 默认发件人 hello@askoldai.com：QQ/Gmail 等免费邮箱因 DMARC 策略不能作为 Brevo 发件人，
  // 需先在 Brevo「Domains」认证 askoldai.com（Cloudflare DNS 加 Brevo code / DKIM / DMARC），
  // 再到 Brevo「Senders」添加该地址。回信仍走 56861701@qq.com。
};
