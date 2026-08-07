# Quantumult X 广告拦截设计

V1.8 起，广告拦截由“单一 AdvertisingLite”升级为分层策略。

## 默认启用

- AWAvenue Ads Rule：常见广告 SDK / 广告域名。
- BlackMatrix7 Advertising：完整广告规则。
- BlackMatrix7 Privacy：追踪与统计域名。
- BlackMatrix7 Hijacking：运营商劫持与恶意重定向。
- AdvertisingLite Rewrite：通用轻量重写。
- 墨鱼去开屏 2.0：国内 App 开屏及部分应用内广告。

## 默认关闭的应用级重写

- YouTube 去广告
- 微博去广告
- 小红书净化

应用级重写依赖 MITM 和接口结构，App 更新后更容易失效或产生兼容问题，因此默认关闭，需要时单独开启。

## 总开关

所有广告过滤规则的 `force-policy` 都指向 `广告拦截-拒绝`。该策略包含 `reject` 与 `direct`：

- `reject`：启用广告拦截。
- `direct`：临时关闭广告拦截，用于排查误杀。

UI Action 额外提供：广告拦截状态、开启强力广告拦截、临时关闭广告拦截。

## 能力边界

纯域名规则无法稳定消除所有第一方广告。例如部分 YouTube / 信息流广告与正常内容共用域名，需要应用级 Rewrite/MITM。强力重写的兼容性风险明显高于域名过滤，因此不默认全部开启。
