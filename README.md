# MRI Mail

<div align="center">
  <h3>一个现代化的邮局服务，基于MoeMail进行的二次开发</h3>
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

### 新增功能
- **用户查询**：管理员可以通过用户名或邮箱搜索并管理用户
- **固定邮箱限制**：固定用户只能创建一个永久邮箱，保证资源合理利用
- **邮箱保护**：防止用户误删除重要邮箱

### 未来计划
- 邮件发送功能
- 更多自定义选项
- 增强的安全特性
- 性能优化

## 技术栈

- 前端：Next.js, React, Tailwind CSS
- 后端：Node.js
- 数据存储：Cloudflare KV, D1
- 部署：Cloudflare Pages, Workers

## 开发与贡献
- 请前往 [beilunyang/moemail页面](https://github.com/beilunyang/moemail) 进行查看

## 许可证

本项目遵循 [MIT 许可证](LICENSE)，与原项目保持一致。

## 致谢

- 原项目作者 [beilunyang](https://github.com/beilunyang) 提供的优秀代码基础
- 所有为本项目做出贡献的开发者
