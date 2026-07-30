/**
 * Quantumult X Developer Toolbox
 * - Shows current policy selections
 * - Benchmarks JMS s1-s5 candidates
 * - Checks proxy egress, OpenAI, Anthropic and GitHub connectivity
 */

const POLICY = {
  default: "默认代理-推荐s3",
  ai: "AI服务-推荐s3",
  dev: "开发服务-推荐s4",
  download: "下载服务-固定s801",
  tiktok: "TikTok-推荐s4"
};

const finishTimer = setTimeout(function () {
  $done({ title: "开发工具箱", message: "检测超时，请确认 Quantumult X 隧道正在运行。" });
}, 20000);

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

function fetchByPolicy(name, url, policy, headers) {
  const startedAt = Date.now();
  return $task.fetch({
    url: url,
    method: "GET",
    headers: headers || { "User-Agent": "QuantumultX-Pro-Toolbox/1.0" },
    opts: { policy: policy, redirection: true, "skip-cert-verify": false }
  }).then(function (response) {
    return {
      name: name,
      ok: Number(response.statusCode) > 0 && Number(response.statusCode) < 500,
      status: Number(response.statusCode),
      ms: Date.now() - startedAt,
      body: response.body || ""
    };
  }, function (reason) {
    return {
      name: name,
      ok: false,
      status: 0,
      ms: Date.now() - startedAt,
      error: reason && reason.error ? reason.error : "请求失败",
      body: ""
    };
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

function parseTrace(body) {
  const result = {};
  String(body || "").split("\n").forEach(function (line) {
    const index = line.indexOf("=");
    if (index > 0) result[line.slice(0, index)] = line.slice(index + 1).trim();
  });
  return result;
}

function currentSelection(states, policy) {
  const chain = states && states[policy];
  if (!Array.isArray(chain) || chain.length < 2) return "未选择";
  return shortNode(chain[chain.length - 1]);
}

function latencyRows(latencies) {
  const rows = Object.keys(latencies || {}).map(function (node) {
    const values = latencies[node] || [];
    const tcp = Number(values[0]);
    const http = Number(values[1]);
    return { node: node, label: shortNode(node), tcp: tcp, http: http };
  });
  rows.sort(function (a, b) {
    const av = a.http >= 0 ? a.http : 999999;
    const bv = b.http >= 0 ? b.http : 999999;
    return av - bv;
  });
  return rows.map(function (row) {
    const httpText = row.http >= 0 ? row.http + " ms" : "不可用";
    const tcpText = row.tcp >= 0 ? row.tcp + " ms" : "-";
    return "<tr><td>" + escapeHtml(row.label) + "</td><td>" + tcpText + "</td><td>" + httpText + "</td></tr>";
  }).join("");
}

function serviceRow(item, extra) {
  const mark = item.ok ? "✅" : "❌";
  const status = item.status ? "HTTP " + item.status : escapeHtml(item.error || "失败");
  return "<tr><td>" + mark + " " + escapeHtml(item.name) + "</td><td>" + status + "</td><td>" + item.ms + " ms" + (extra ? "<br><small>" + escapeHtml(extra) + "</small>" : "") + "</td></tr>";
}

const customizedPromise = sendConfiguration({ action: "get_customized_policy", content: POLICY.default });
const statePromise = sendConfiguration({ action: "get_policy_state" });

Promise.all([customizedPromise, statePromise]).then(function (base) {
  const customized = base[0] || {};
  const states = base[1] || {};
  const candidates = customized[POLICY.default] && Array.isArray(customized[POLICY.default].candidates)
    ? customized[POLICY.default].candidates
    : [];

  const latencyPromise = candidates.length
    ? sendConfiguration({ action: "url_latency_benchmark", content: candidates })
    : Promise.resolve({});

  const checksPromise = Promise.all([
    fetchByPolicy("代理出口", "https://www.cloudflare.com/cdn-cgi/trace", POLICY.default),
    fetchByPolicy("OpenAI API", "https://api.openai.com/v1/models", POLICY.ai),
    fetchByPolicy("Anthropic API", "https://api.anthropic.com/", POLICY.ai),
    fetchByPolicy("GitHub API", "https://api.github.com/zen", POLICY.dev, {
      "User-Agent": "QuantumultX-Pro-Toolbox/1.0",
      "Accept": "application/vnd.github+json"
    })
  ]);

  return Promise.all([latencyPromise, checksPromise, Promise.resolve(states)]);
}).then(function (data) {
  const latencies = data[0] || {};
  const checks = data[1] || [];
  const states = data[2] || {};
  const trace = checks.length ? parseTrace(checks[0].body) : {};

  const policyHtml = [
    [POLICY.default, currentSelection(states, POLICY.default)],
    [POLICY.ai, currentSelection(states, POLICY.ai)],
    [POLICY.dev, currentSelection(states, POLICY.dev)],
    [POLICY.download, currentSelection(states, POLICY.download)],
    [POLICY.tiktok, currentSelection(states, POLICY.tiktok)]
  ].map(function (item) {
    return "<tr><td>" + escapeHtml(item[0]) + "</td><td><b>" + escapeHtml(item[1]) + "</b></td></tr>";
  }).join("");

  const serviceHtml = checks.map(function (item, index) {
    let extra = "";
    if (index === 0 && trace.ip) {
      extra = "IP " + trace.ip + (trace.loc ? " · " + trace.loc : "") + (trace.colo ? " · " + trace.colo : "");
    }
    return serviceRow(item, extra);
  }).join("");

  const html = `
  <div style="font-family:-apple-system;padding:4px 2px;color:#222">
    <h2 style="text-align:center">🧰 开发工具箱</h2>
    <h3>当前策略</h3>
    <table style="width:100%;border-collapse:collapse" border="1" cellpadding="6">${policyHtml}</table>
    <h3>JMS 节点延迟</h3>
    <table style="width:100%;border-collapse:collapse;text-align:center" border="1" cellpadding="6">
      <tr><th>节点</th><th>TCP</th><th>HTTP</th></tr>${latencyRows(latencies)}
    </table>
    <h3>服务连通性</h3>
    <table style="width:100%;border-collapse:collapse" border="1" cellpadding="6">
      <tr><th>服务</th><th>状态</th><th>耗时</th></tr>${serviceHtml}
    </table>
    <p style="font-size:12px;color:#666">HTTP 401/403/404 也代表服务器已连通；这里只判断网络链路，不判断账号权限或地区解锁。</p>
  </div>`;

  clearTimeout(finishTimer);
  $done({ title: "开发工具箱", htmlMessage: html });
}).catch(function (error) {
  clearTimeout(finishTimer);
  $done({ title: "开发工具箱", message: "检测失败：" + (error && error.message ? error.message : String(error)) });
});
