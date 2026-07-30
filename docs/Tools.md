# Quantumult X Pro 工具功能

## 入口位置

导入 V1.4 后，打开 Quantumult X 首页，进入任务/工具入口，即可看到 7 个交互式按钮。`event-interaction` 任务只有在 Quantumult X 隧道运行时才可执行。

## 开发工具箱

一次性显示：

- 默认、AI、开发、下载、TikTok 当前选中的节点
- JMS s1～s5 TCP/HTTP 延迟排行
- 当前代理出口 IP 和地区
- OpenAI API、Anthropic API、GitHub API 连通性

HTTP 401/403/404 也可能表示网络已经连通，只是没有携带账号凭证或请求路径不是业务接口。

## 一键场景切换

- **AI 稳定模式**：默认代理、AI、社交通信 → s3
- **开发模式**：默认代理、开发、YouTube、Spotify → s4；AI 仍走独立 s3
- **下载省流量**：下载规则 → s801；不会把所有流量强行切到 s801
- **流媒体模式**：TikTok、Netflix、YouTube、Spotify → s4；Disney+ → s3
- **恢复推荐设置**：恢复所有默认推荐值

## 流量面板

显示 Quantumult X 当前统计周期内：

- TCP/UDP 上传和下载
- 节点流量排行
- 常用策略当前节点
- s801 实际传输字节

这里的 s801 数据是实际网络传输量，**不是** JMS 后台应用动态倍率后的套餐扣除量。

## 排错

1. 按钮点了没反应：确认 Quantumult X 主开关已开启。
2. 场景切换提示未找到节点：先更新 JMS 节点订阅。
3. 工具箱部分服务显示 401/403/404：通常代表链路通了，不等于服务不可用。
4. 图标不显示：检查 `raw.githubusercontent.com` 是否能正常加载，或稍后重试。
