/** Quantumult X ad-block master switch for policy 广告拦截-拒绝. */

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
      title: mode === "on" ? "🛡 已开启强力广告拦截" : "🟢 已临时关闭广告拦截",
      message: POLICY + " → " + target + (mode === "off" ? "\n排查结束后记得重新开启。" : "")
    });
  }).catch(function (error) {
    $done({ title: "广告拦截切换失败", message: String(error && error.message ? error.message : error) });
  });
} else {
  sendConfiguration({ action: "get_policy_state" }).then(function (states) {
    const chain = states[POLICY] || [];
    const current = Array.isArray(chain) && chain.length ? chain[chain.length - 1] : "未知";
    $done({ title: "广告拦截状态", message: POLICY + " → " + current });
  }).catch(function (error) {
    $done({ title: "广告拦截状态读取失败", message: String(error && error.message ? error.message : error) });
  });
}
