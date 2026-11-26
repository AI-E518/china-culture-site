// 站点级配置。
// 表单提交统一走 Cloudflare Pages Function /api/submit（functions/api/submit.js），
// 由服务端调用 Brevo：写入联系人名单 + 发事务邮件（锦囊 PDF 作为附件）。
// 前端不再含任何第三方密钥，也不再提供 PDF 公开下载链接。
export const SITE = {
  name: 'China Living',
  url: 'https://askoldai.com', // 真实域名
  // 接收咨询邮件的邮箱（页脚/联系页展示用；实际收件地址在 /api/submit 里，默认同下）
  contactEmail: '56861701@qq.com',
  // Cloudflare Web Analytics 令牌（隐私友好、无需 Cookie 同意）。
  // 获取路径：Cloudflare 控制台 → 你的站点 askoldai.com → Analytics & Logs → Web Analytics →
  //   「Add a site / Set up」→ 选 Manual setup → 复制 beacon 里的 token（形如 9xxxxxxx 的一串）填这里。
  // 留空则不高载分析脚本（不影响网站运行）。
  analyticsToken: 'bbbf6f9d5db134467a5960b41d0081e3e',
  // Brevo 相关变量只在 Cloudflare Pages 项目 Settings → Variables and Secrets 配置，绝不写进前端：
  //   BREVO_API_KEY   API Key；权限需 Contacts = All 且 Transactional email = All
  //   BREVO_LIST_ID   接收订阅者的列表 ID（纯数字，如 3）
  // 可选（都有内置默认值，不必配置）：
  //   BREVO_SENDER_EMAIL / BREVO_SENDER_NAME / BREVO_REPLY_TO / CONSULT_TO_EMAIL / BREVO_LANG_ATTR
  // 发件人必须是 Brevo 已认证的自有域名（默认 hello@askoldai.com）：QQ/Gmail 等免费邮箱
  // 因 DMARC 策略不能作为 Brevo 发件人。回信仍走 56861701@qq.com。
  //
  // 《中国旅行锦囊》PDF 只作为邮件附件发送，站内无公开下载链接。
  // 源 PDF 放在 assets/kit/（不会被输出到网站），换 PDF 后执行
  //   node scripts/build-kit-data.mjs
  // 重新生成 functions/_kit-data.js，再提交推送即可。
};
