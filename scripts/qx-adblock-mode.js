/** Quantumult X domain/filter ad-block switch for policy 广告拦截-拒绝. */

function getMode() {
  const source = String(($environment && $environment.sourcePath) || "");
  const match = source.match(/[#&]mode=([^&]+)/i);
  return match ? decodeURIComponent(match[1]).toLowerCase() : "status";
}

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

const POLICY = "广告拦截-拒绝";
const mode = getMode();

if (mode === "on" || mode === "off") {
  const target = mode === "on" ? "reject" : "direct";
  sendConfiguration({ action: "set_policy_state", content: { [POLICY]: target } }).then(function () {
    $done({
      title: mode === "on" ? "🛡 已开启域名广告拦截" : "🟢 已临时关闭域名拦截",
      message: POLICY + " → " + target + (mode === "off" ? "\n注意：Rewrite/MITM 去广告仍然启用；排查结束后记得重新开启域名拦截。" : "")
    });
  }).catch(function (error) {
    $done({ title: "域名广告拦截切换失败", message: String(error && error.message ? error.message : error) });
  });
} else {
  sendConfiguration({ action: "get_policy_state" }).then(function (states) {
    const chain = states[POLICY] || [];
    const current = Array.isArray(chain) && chain.length ? chain[chain.length - 1] : "未知";
    $done({ title: "域名广告拦截状态", message: POLICY + " → " + current + "\nRewrite/MITM 去广告资源需在重写资源中单独启停。" });
  }).catch(function (error) {
    $done({ title: "域名广告拦截状态读取失败", message: String(error && error.message ? error.message : error) });
  });
}
