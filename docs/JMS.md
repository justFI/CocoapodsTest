# JMS c12 线路说明与策略

## s1 / s2：Los Angeles Direct

`c12s1` 和 `c12s2` 都使用中国电信、中国联通、中国移动直连，但两台服务器路由并不完全相同，用于提高容灾能力。

建议：普通网页、游戏或作为 CN2 线路异常时的备用。

## s3：Los Angeles CN2 GIA

`c12s3` 使用中国电信 CN2 GIA。

建议：ChatGPT、Claude、Cursor、API、长连接等对稳定性敏感的服务。

## s4：Osaka POP

`c12s4` 经日本大阪 SoftBank POP。

建议：GitHub、开发依赖、TikTok、YouTube 和常见海外 CDN。实际效果仍取决于本地运营商。

## s5：Netherlands POP

`c12s5` 经荷兰 POP，回程对三网提供 CN2 GIA 支持。

建议：欧美服务备用线路，或在其他节点拥塞时手动测试。

## s801：Freedom

Freedom 服务器以动态倍率减少套餐流量计费。例如倍率为 10 时，下载 20 GB 只按约 2 GB 计入套餐。

但它：

- 不保证速度
- 不保证路由
- 不保证在线率
- 可能随时下线
- 倍率可随时变化

因此配置中：

- 不将 `s801` 加入 `JMS 优选`
- 不用于 AI、语音、SSE、WebSocket 等稳定性敏感业务
- 仅作为 `下载服务` 的默认候选，并保留 Osaka、CN2、PROXY 手动回退

## 为什么不只看延迟

JMS 不同节点的路由设计差异明显。HTTP 延迟最低只说明测试网页响应更快，并不一定代表吞吐、晚高峰稳定性或丢包更好。建议结合：

1. Quantumult X 延迟测试
2. 实际 GitHub/Docker 下载速度
3. AI 长连接稳定性
4. 本地运营商和晚高峰表现

`JMS 优选` 适合日常兜底，但关键业务仍使用明确的线路组。
