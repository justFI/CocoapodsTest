# Quantumult X Pro V1.5 工具箱

V1.5 在 V1.4 的开发工具箱、场景切换和流量面板基础上，增加了 8 个按钮。

## 新增工具

### 🌍 JMS 节点出口地图

逐个通过 s1、s2、s3、s4、s5、s801 请求 Cloudflare Trace，展示：

- 出口 IP
- 出口国家
- Cloudflare POP
- HTTP/TLS 协议
- 请求耗时
- 节点是否离线

### ⚡ 开发与 AI 服务测速

检查 OpenAI、Anthropic、Gemini、GitHub、npm、PyPI、Swift Package Index、Hugging Face。HTTP 401/403/404 通常仍表示链路可达；0、超时或 TLS 失败才需要重点排查。

### 🧯 远程资源体检

检查当前配置依赖的解析器、BlackMatrix7 规则、自维护规则和工具脚本，快速发现 404 或 GitHub Raw 无法访问。

### 🧹 清理 DNS 缓存

调用 Quantumult X 官方 `dns_clear_cache` API。适合切换节点、修改规则或网络变化后，域名仍命中旧解析结果的情况。

### 🛡 配置安全巡检

检查：

- 是否处于分流模式
- AI/默认/社交是否选 s3
- 开发/流媒体是否选 s4
- 下载是否选 s801
- 非下载策略是否误选 s801

### 🌐 运行模式状态

查看当前是分流、全局代理还是全局直连。

### 🚀 全局代理-s3

临时将 Quantumult X 切换为全局代理，并把内置 `proxy` 选到 s3。适合排错，不建议长期保持。

### 🔙 恢复分流模式

把运行模式切回 `filter`，恢复按业务规则分流。

## 使用入口

Quantumult X 主开关开启后，长按首页节点或策略，在 UI Action/交互任务列表中选择工具。

## 安全说明

- 出口地图只请求 Cloudflare Trace，不上传配置、订阅或证书。
- 资源体检只访问配置中公开的远程文件地址。
- 全局代理会影响所有可接管流量；使用后请恢复分流。
- 私人 `.conf` 包含订阅与 MITM 数据，不要上传公开仓库。
