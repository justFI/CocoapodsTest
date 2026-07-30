/** Quantumult X policy and running-mode safety check. */

const EXPECTED = {
  "默认代理-推荐s3": "c12s3",
  "AI服务-推荐s3": "c12s3",
  "开发服务-推荐s4": "c12s4",
  "下载服务-固定s801": "c12s801",
  "TikTok-推荐s4": "c12s4",
  "Netflix-推荐s4": "c12s4",
  "DisneyPlus-推荐s3": "c12s3",
  "YouTube-推荐s4": "c12s4",
  "Spotify-推荐s4": "c12s4",
  "社交通信-推荐s3": "c12s3"
};

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

function shortNode(name) {
  const match = String(name || "").match(/c12s(?:801|[1-5])/i);
  return match ? match[0].toLowerCase() : String(name || "未选择");
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Promise.all([
  sendConfiguration({ action: "get_running_mode" }),
  sendConfiguration({ action: "get_policy_state" })
]).then(function (data) {
  const modeRet = data[0] || {};
  const states = data[1] || {};
  const mode = modeRet.running_mode || modeRet.mode || String(modeRet || "unknown");
  const warnings = [];
  const rows = [];

  if (mode !== "filter") warnings.push("当前不是分流模式，而是 " + mode);

  Object.keys(EXPECTED).forEach(function (policy) {
    const chain = states[policy];
    const selected = Array.isArray(chain) && chain.length ? shortNode(chain[chain.length - 1]) : "未选择";
    const expected = EXPECTED[policy];
    const ok = selected === expected;
    if (!ok) warnings.push(policy + " 当前为 " + selected + "，推荐 " + expected);
    if (policy !== "下载服务-固定s801" && selected === "c12s801") warnings.push(policy + " 不应使用不保证质量的 s801");
    rows.push(`<tr><td>${ok ? "✅" : "⚠️"} ${escapeHtml(policy)}</td><td><b>${escapeHtml(selected)}</b></td><td>${escapeHtml(expected)}</td></tr>`);
  });

  const html = `
  <div style="font-family:-apple-system;padding:4px 2px">
    <h2 style="text-align:center">🛡 配置安全巡检</h2>
    <p style="text-align:center">运行模式：<b>${escapeHtml(mode)}</b><br>${warnings.length ? `<font color="#d35400"><b>${warnings.length} 项需要注意</b></font>` : `<font color="#168a45"><b>全部符合推荐设置</b></font>`}</p>
    <table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px" border="1" cellpadding="5">
      <tr><th>策略</th><th>当前</th><th>推荐</th></tr>${rows.join("")}
    </table>
    ${warnings.length ? `<h3>建议</h3><ol>${warnings.map(function (x) { return `<li>${escapeHtml(x)}</li>`; }).join("")}</ol><p>可点击“恢复推荐设置”和“恢复分流模式”自动修正。</p>` : ""}
  </div>`;
  $done({ title: "配置安全巡检", htmlMessage: html });
}).catch(function (error) {
  $done({ title: "配置安全巡检", message: "读取失败：" + (error && error.message ? error.message : String(error)) });
});
