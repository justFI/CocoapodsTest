# QuantumultX Pro · AI Developer Edition

一套面向 **AI / iOS / 全栈开发** 场景的 Quantumult X 配置，针对 Just My Socks `c12s1...c12s5 + c12s801` 节点命名优化。

## 核心设计

- **JMS 线路语义化分组**：LA Direct、CN2 GIA、Osaka POP、Netherlands POP、Freedom s801。
- **JMS 优选**：只在 `s1...s5` 中进行延迟优选，不把无质量保证的 `s801` 纳入自动组。
- **业务分流**：AI、开发、下载、Apple、TikTok、流媒体、社交、游戏。
- **下载省流量**：GitHub Release、Docker/GHCR、Homebrew Bottle、Xcode/Apple 下载可切到 `s801`。
- **低耦合规则**：主流服务使用 BlackMatrix7；个性化规则保存在 `rules/`。
- **安全默认值**：仓库不保存订阅 URL、MITM 私钥或证书密码。
- **自动检查**：GitHub Actions 每周检查远程资源 404 和敏感信息泄漏。

## 使用

1. 下载 [`config/QuantumultX-Pro.template.conf`](config/QuantumultX-Pro.template.conf)。
2. 将 `https://YOUR_SUBSCRIPTION_URL` 替换为自己的订阅地址。
3. 在 Quantumult X 中导入配置。
4. 更新节点订阅和分流资源。
5. 在策略中确认：
   - AI：默认 `LA CN2 GIA`
   - 开发：默认 `Osaka POP`
   - TikTok：默认 `Osaka POP`
   - 下载：默认 `Freedom s801`

## JMS 节点映射

| 节点标识 | 配置组 | 线路定位 |
|---|---|---|
| `c12s1` / `c12s2` | LA Direct | 三网直连，两个节点路由不同以增强冗余 |
| `c12s3` | LA CN2 GIA | 中国电信 CN2 GIA |
| `c12s4` | Osaka POP | 经日本大阪 SoftBank POP |
| `c12s5` | Netherlands POP | 经荷兰 POP，回程支持三网 CN2 GIA |
| `c12s801` | Freedom s801 | 按动态倍率节省套餐流量，不保证质量和在线率 |

详细说明见 [`docs/JMS.md`](docs/JMS.md)。

## 安全

不要提交以下内容：

- JMS 或其他机场订阅链接
- Quantumult X `p12` 内容
- MITM `passphrase`
- 任何 Token、Cookie、私有节点

本仓库的 `.gitignore` 和检查脚本会阻止常见泄漏，但提交前仍需人工确认。

## 目录

```text
config/                     可导入模板
rules/                      自维护 Quantumult X 分流规则
docs/                       线路与维护文档
scripts/check_resources.py  404 与敏感信息检查
.github/workflows/          定时校验
```

## 说明

规则只负责网络分流，不提供服务解锁保证。服务可用性还取决于出口 IP、账号地区、客户端版本和服务方策略。
