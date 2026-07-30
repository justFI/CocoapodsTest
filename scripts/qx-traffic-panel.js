/**
 * Quantumult X traffic panel.
 * Statistics are the actual bytes recorded by Quantumult X in its current statistics period.
 * JMS s801 multiplier is NOT applied here.
 */

const WATCH_POLICIES = [
  "默认代理-推荐s3",
  "AI服务-推荐s3",
  "开发服务-推荐s4",
  "下载服务-固定s801",
  "TikTok-推荐s4",
  "Netflix-推荐s4",
  "DisneyPlus-推荐s3",
  "YouTube-推荐s4"
];

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortNode(name) {
  const match = String(name || "").match(/c12s(?:801|[1-5])/i);
  return match ? match[0].toLowerCase() : String(name || "");
}

function bytes(value) {
  const n = Number(value || 0);
  if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(2) + " GB";
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
}

Promise.all([
  sendConfiguration({ action: "get_traffic_statistics" }),
  sendConfiguration({ action: "get_policy_state" })
]).then(function (data) {
  const stats = data[0] || {};
  const states = data[1] || {};
  const byNode = {};
  let totalRx = 0;
  let totalTx = 0;
  let tcpRx = 0;
  let tcpTx = 0;
  let udpRx = 0;
  let udpTx = 0;

  Object.keys(stats).forEach(function (key) {
    const item = stats[key] || {};
    const name = item.name || key;
    const rx = Number(item.rx_transfer || 0);
    const tx = Number(item.tx_transfer || 0);
    const type = String(item.type || "").toLowerCase();

    totalRx += rx;
    totalTx += tx;
    if (type === "udp") {
      udpRx += rx;
      udpTx += tx;
    } else {
      tcpRx += rx;
      tcpTx += tx;
    }

    if (!byNode[name]) byNode[name] = { rx: 0, tx: 0 };
    byNode[name].rx += rx;
    byNode[name].tx += tx;
  });

  const ranking = Object.keys(byNode).map(function (name) {
    return { name: name, rx: byNode[name].rx, tx: byNode[name].tx, total: byNode[name].rx + byNode[name].tx };
  }).sort(function (a, b) { return b.total - a.total; }).slice(0, 8);

  const policyRows = WATCH_POLICIES.map(function (policy) {
    const chain = states[policy];
    const selected = Array.isArray(chain) && chain.length ? chain[chain.length - 1] : "未选择";
    return "<tr><td>" + escapeHtml(policy) + "</td><td><b>" + escapeHtml(shortNode(selected)) + "</b></td></tr>";
  }).join("");

  const rankRows = ranking.length ? ranking.map(function (item, index) {
    return "<tr><td>" + (index + 1) + "</td><td>" + escapeHtml(shortNode(item.name)) + "</td><td>" + bytes(item.rx) + "</td><td>" + bytes(item.tx) + "</td><td><b>" + bytes(item.total) + "</b></td></tr>";
  }).join("") : "<tr><td colspan=\"5\">当前统计周期还没有节点流量记录</td></tr>";

  const s801 = ranking.filter(function (item) { return /c12s801/i.test(item.name); })[0];
  const s801Text = s801 ? bytes(s801.total) : "0 B";

  const html = `
  <div style="font-family:-apple-system;padding:4px 2px;color:#222">
    <h2 style="text-align:center">📊 流量面板</h2>
    <p style="text-align:center"><b>总计 ${bytes(totalRx + totalTx)}</b><br>下载 ${bytes(totalRx)} · 上传 ${bytes(totalTx)}</p>
    <table style="width:100%;border-collapse:collapse;text-align:center" border="1" cellpadding="6">
      <tr><th>协议</th><th>下载</th><th>上传</th></tr>
      <tr><td>TCP</td><td>${bytes(tcpRx)}</td><td>${bytes(tcpTx)}</td></tr>
      <tr><td>UDP</td><td>${bytes(udpRx)}</td><td>${bytes(udpTx)}</td></tr>
    </table>
    <h3>节点流量排行</h3>
    <table style="width:100%;border-collapse:collapse;text-align:center" border="1" cellpadding="6">
      <tr><th>#</th><th>节点</th><th>下载</th><th>上传</th><th>合计</th></tr>${rankRows}
    </table>
    <h3>当前策略</h3>
    <table style="width:100%;border-collapse:collapse" border="1" cellpadding="6">${policyRows}</table>
    <p style="font-size:12px;color:#666">当前统计周期内 s801 实际传输：${s801Text}。这里显示 Quantumult X 实际传输字节，不包含 JMS 后台的动态流量倍率折算；统计周期以 Quantumult X 内部记录/重置为准。</p>
  </div>`;

  $done({ title: "流量面板", htmlMessage: html });
}).catch(function (error) {
  $done({ title: "流量面板", message: "读取失败：" + (error && error.message ? error.message : String(error)) });
});
