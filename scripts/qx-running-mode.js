/** Quantumult X running mode status/switcher. */

function parseMode() {
  const source = String(($environment && $environment.sourcePath) || "");
  const match = source.match(/[#&]mode=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "status";
}

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

function getS3Node() {
  return sendConfiguration({ action: "get_customized_policy", content: "默认代理-推荐s3" }).then(function (ret) {
    const info = ret["默认代理-推荐s3"] || {};
    const candidates = info.candidates || [];
    const node = candidates.filter(function (name) { return /c12s3/i.test(name); })[0];
    if (!node) throw new Error("未找到 c12s3，请先更新 JMS 订阅");
    return node;
  });
}

const requested = parseMode();

if (requested === "status") {
  sendConfiguration({ action: "get_running_mode" }).then(function (ret) {
    const mode = ret.running_mode || ret.mode || JSON.stringify(ret);
    const names = { filter: "分流模式", all_proxy: "全局代理", all_direct: "全局直连" };
    $done({ title: "当前运行模式", message: (names[mode] || mode) + "\n\n推荐长期保持“分流模式”。全局代理仅适合临时排错或需要所有流量统一出境的场景。" });
  }).catch(function (error) {
    $done({ title: "读取运行模式失败", message: String(error && error.message ? error.message : error) });
  });
} else if (requested === "all_proxy") {
  getS3Node().then(function (node) {
    return sendConfiguration({ action: "set_policy_state", content: { proxy: node } }).then(function () { return node; });
  }).then(function (node) {
    return sendConfiguration({ action: "set_running_mode", content: { running_mode: "all_proxy" } }).then(function () { return node; });
  }).then(function (node) {
    $done({ title: "已开启全局代理", message: "所有可接管流量将通过内置 proxy，并已将它设为 " + node + "。\n\n用完后请点击“恢复分流模式”。" });
  }).catch(function (error) {
    $done({ title: "切换失败", message: String(error && error.message ? error.message : error) });
  });
} else if (requested === "filter") {
  sendConfiguration({ action: "set_running_mode", content: { running_mode: "filter" } }).then(function () {
    $done({ title: "已恢复分流模式", message: "流量重新按照 AI、开发、下载、流媒体等规则分别选择线路。" });
  }).catch(function (error) {
    $done({ title: "切换失败", message: String(error && error.message ? error.message : error) });
  });
} else {
  $done({ title: "未知模式", message: requested });
}
