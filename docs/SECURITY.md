# 安全与私有配置

## 永远不要提交

- `getsub.php` 等订阅完整 URL
- 节点密码、UUID、Token
- `[mitm]` 中的 `p12`
- `[mitm]` 中的 `passphrase`
- Cookie、Session、私有 API Key

## 推荐工作流

1. GitHub 只保存 `QuantumultX-Pro.template.conf`。
2. 本地复制为 `QuantumultX-Pro.private.conf`。
3. 在 private 文件中填入订阅和 MITM 数据。
4. private 文件由 `.gitignore` 排除。
5. 分享排障配置前，先删除 `[server_remote]` 与 `[mitm]` 的私密值。

## 泄漏后的处理

- 订阅 URL 泄漏：立即在服务商后台重置订阅。
- MITM 证书泄漏：删除旧证书，重新生成并安装。
- GitHub 历史已有秘密：仅删除当前文件不够，还要轮换凭证；必要时清理 Git 历史。
