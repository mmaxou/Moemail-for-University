# MRI Mail

<div align="center">
  <h3>一个现代化的邮局服务，基于MoeMail修改</h3>
</div>

## 关于本项目

本项目基于 [beilunyang/moemail](https://github.com/beilunyang/moemail) 的源代码，根据 MIT 协议进行二次开发。感谢原作者的优秀工作！

## 功能特性

### 原有功能
- 创建临时邮箱，支持自定义有效期
- 实时接收邮件，支持 HTML 和纯文本格式查看
- 用户系统和角色权限管理
- API 接口支持，便于系统集成
- Webhook 集成支持

### 修改&新增功能
#### 管理员端
- **用户查询**：现在可以通过搜索查看用户名及等级
  ![image](https://github.com/user-attachments/assets/f9a8e735-ed76-4a6b-9580-24b3eb4fd135)
- **用户数量统计**：查看当前邮箱注册/各等级人数，支持一键删除最低等级（未授权）的账户
  ![image](https://github.com/user-attachments/assets/570e49d5-dc79-4947-b21e-2b764b415d4c)
- **禁用邮箱删除功能**：用户无法自主删除已经注册的邮箱
- **默认邮箱时限**：目前只能创建永久时限的邮箱，可以替换[beilunyang/moemail](https://github.com/beilunyang/moemail)中的app/types/email.ts文件恢复
- **管理单个成员邮箱数量**:<img width="650" height="145" alt="{BD76F2DB-B0E6-4E0F-9236-F6BD7F0B0C49}" src="https://github.com/user-attachments/assets/1d7f20ee-cf1b-4f1b-b510-f49c7d245de2" />

#### 用户端
- **邮件查询**：可以在邮件列表中输入关键词（发件人、邮件内容、邮件主题）自动检索对应的邮件
  ![image](https://github.com/user-attachments/assets/7ead0f40-9aaa-456b-943e-bf9fbd637c05)
- **发送邮件**：支持通过 Resend 邮件服务发送邮件（附件功能开发中）
  ![image](https://github.com/user-attachments/assets/a47d1c6c-0b4a-4714-ac24-471b791f4fb0)
  ![image](https://github.com/user-attachments/assets/936c0af0-5556-438b-b111-959a7f512ca5)



### 未来计划
- [x] 接入SMTP Server新增发件功能
- [x] 增加发件记录
- [x] 增加收件回复
- [x] 管理员可单独设置成员创建邮箱数量 
- [ ] 接入Linux Do Connect
- [ ] 更多的功能For Admin+Users

## 技术栈

- 前端：Next.js, React, Tailwind CSS
- 后端：Node.js
- 数据存储：Cloudflare KV, D1
- 部署：Cloudflare Pages, Workers

## 部署教程
- 与Moemail一致，请前往 [beilunyang/moemail页面](https://github.com/beilunyang/moemail) 进行查看
- 如已部署过Moemail，可直接下载源码覆盖部署

### SMTP 配置（发件功能）
如需启用发件功能，推荐使用 Resend 邮件服务（支持 Cloudflare Edge Runtime）：

1. 前往 [Resend](https://resend.com) 注册账户
2. 获取 API Key
3. 在 cloudflare worker&pages 设置中配置以下环境变量：
   - `RESEND_API_KEY`: 你的 Resend API 密钥

**注意事项：**
- Resend 免费账户每月可发送 3,000 封邮件
- 发件功能需要配置有效的邮件服务，否则发送邮件时会提示错误
- 当前版本暂不支持附件功能（开发中）

**其他邮件服务：**
如果你希望使用其他邮件服务（如 SendGrid），可以修改 `/app/api/emails/[id]/send/route.ts` 文件中的 `sendEmailViaSMTP` 函数。

## 许可证

本项目遵循 [MIT 许可证](LICENSE)，与原项目保持一致。

## 致谢

- 原项目作者 [beilunyang](https://github.com/beilunyang) 提供的优秀代码基础
- 所有为本项目做出贡献的开发者
