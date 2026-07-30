/**
 * Quantumult X JMS exit map.
 * Shows each JMS node's public IP, country, Cloudflare POP and protocol.
 */

const SOURCE_POLICY = "默认代理-推荐s3";
const TRACE_URL = "https://www.cloudflare.com/cdn-cgi/trace";

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

function nodeOrder(name) {
  const id = shortNode(name);
  if (id === "c12s801") return 801;
  const m = id.match(/c12s(\d+)/);
  return m ? Number(m[1]) : 9999;
}

function parseTrace(text) {
  const out = {};
  String(text || "").split(/\r?\n/).forEach(function (line) {
    const index = line.indexOf("=");
    if (index > 0) out[line.slice(0, index)] = line.slice(index + 1);
  });
  return out;
}

function inspectNode(node) {
  const started = Date.now();
  return $task.fetch({
    url: TRACE_URL,
    method: "GET",
    timeout: 6500,
    opts: { policy: node, redirection: true }
  }).then(function (response) {
    const trace = parseTrace(response.body);
    return {
      node: node,
      ok: true,
      ms: Date.now() - started,
      ip: trace.ip || "未知",
      country: trace.loc || "未知",
      colo: trace.colo || "未知",
      http: trace.http || "-",
      tls: trace.tls || "-",
      warp: trace.warp || "off"
    };
  }, function (reason) {
    return {
      node: node,
      ok: false,
      ms: Date.now() - started,
      error: reason && reason.error ? reason.error : "连接失败"
    };
  });
}

sendConfiguration({ action: "get_customized_policy", content: SOURCE_POLICY }).then(function (ret) {
  const info = ret[SOURCE_POLICY] || {};
  const nodes = (info.candidates || [])
    .filter(function (name) { return /c12s(?:801|[1-5])/i.test(name); })
    .sort(function (a, b) { return nodeOrder(a) - nodeOrder(b); });

  if (!nodes.length) throw new Error("没有找到 JMS 节点，请先更新节点订阅");
  return Promise.all(nodes.map(inspectNode));
}).then(function (rows) {
  const body = rows.map(function (item) {
    if (!item.ok) {
      return `<tr><td><b>${escapeHtml(shortNode(item.node))}</b></td><td colspan="5">❌ ${escapeHtml(item.error)}</td></tr>`;
    }
    return `<tr><td><b>${escapeHtml(shortNode(item.node))}</b></td><td>${escapeHtml(item.ip)}</td><td>${escapeHtml(item.country)}</td><td>${escapeHtml(item.colo)}</td><td>${item.ms} ms</td><td>${escapeHtml(item.http)} / ${escapeHtml(item.tls)}</td></tr>`;
  }).join("");

  const html = `
  <div style="font-family:-apple-system;padding:4px 2px">
    <h2 style="text-align:center">🌍 JMS 节点出口地图</h2>
    <table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px" border="1" cellpadding="5">
      <tr><th>节点</th><th>出口 IP</th><th>国家</th><th>CF POP</th><th>耗时</th><th>协议</th></tr>
      ${body}
    </table>
    <p style="font-size:12px;color:#666">国家与 POP 来自 Cloudflare Trace。该工具同时验证每个节点是否真的能够建立 HTTPS 请求；s801 离线时显示失败属于其线路特性。</p>
  </div>`;
  $done({ title: "JMS 节点出口地图", htmlMessage: html });
}).catch(function (error) {
  $done({ title: "JMS 节点出口地图", message: "检查失败：" + (error && error.message ? error.message : String(error)) });
});
