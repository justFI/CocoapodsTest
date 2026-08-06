/**
 * Quantumult X JMS hourly latency watcher.
 * - Runs silently from cron every hour.
 * - Stores the latest TCP/HTTP latency result in $prefs.
 * - Shows a detailed panel for event-interaction.
 *
 * Important: Quantumult X's documented scripting API can benchmark nodes,
 * but it does not expose a documented "refresh one server_remote resource now" action.
 * The companion configuration therefore uses update-interval=3600 for JMS.
 */

const GROUPS = ["默认代理-推荐s3", "Freedom-s801"];
const TIMEOUT_MS = 3000;
const CACHE_KEY = "qx.jms.hourly.latency.v1";

function mode() {
  const source = String(($environment && $environment.sourcePath) || "");
  const match = source.match(/[#&]mode=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "cron";
}

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

function unique(values) {
  const seen = {};
  return values.filter(function (value) {
    if (!value || seen[value]) return false;
    seen[value] = true;
    return true;
  });
}

function shortNode(name) {
  const match = String(name || "").match(/c12s(?:801|[1-5])/i);
  return match ? match[0].toLowerCase() : String(name || "");
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function getCandidates(group) {
  return sendConfiguration({ action: "get_customized_policy", content: group }).then(function (ret) {
    const info = ret[group] || {};
    return Array.isArray(info.candidates) ? info.candidates : [];
  });
}

function timeoutPromise(ms) {
  return new Promise(function (_, reject) {
    setTimeout(function () { reject(new Error("TIMEOUT")); }, ms);
  });
}

function benchmark(nodes) {
  return sendConfiguration({ action: "url_latency_benchmark", content: nodes });
}

function normalize(nodes, raw, timedOut) {
  const rows = nodes.map(function (node) {
    const value = raw && raw[node];
    const tcp = Array.isArray(value) ? Number(value[0]) : -1;
    const http = Array.isArray(value) ? Number(value[1]) : -1;
    const hasData = tcp >= 0 || http >= 0;
    return {
      node: node,
      short: shortNode(node),
      tcp: tcp,
      http: http,
      ok: hasData,
      missing: !hasData
    };
  });
  return {
    timestamp: Date.now(),
    timeoutMs: TIMEOUT_MS,
    timedOut: !!timedOut,
    rows: rows,
    missing: rows.filter(function (row) { return row.missing; }).map(function (row) { return row.short; })
  };
}

function save(result) {
  try { $prefs.setValueForKey(JSON.stringify(result), CACHE_KEY); } catch (_) {}
}

function load() {
  try {
    const text = $prefs.valueForKey(CACHE_KEY);
    return text ? JSON.parse(text) : null;
  } catch (_) {
    return null;
  }
}

function ms(value) {
  return Number(value) >= 0 ? Number(value) + " ms" : "—";
}

function formatTime(timestamp) {
  if (!timestamp) return "未知";
  try { return new Date(timestamp).toLocaleString(); } catch (_) { return String(timestamp); }
}

function panel(result, title) {
  if (!result || !Array.isArray(result.rows)) {
    $done({ title: title || "节点延迟面板", message: "暂无测速记录。请先点击“立即测速”，或等待每小时自动测速。" });
    return;
  }

  const rows = result.rows.map(function (row) {
    const status = row.ok ? "✅" : "⚠️";
    return "<tr><td>" + status + " " + escapeHtml(row.short) + "</td><td>" + ms(row.tcp) + "</td><td>" + ms(row.http) + "</td></tr>";
  }).join("");

  const warning = result.missing && result.missing.length
    ? "<p style=\"color:#c0392b\"><b>3 秒内无有效数据：</b>" + escapeHtml(result.missing.join(", ")) + "</p>"
    : "<p style=\"color:#16834a\"><b>全部节点均返回测速数据。</b></p>";

  const html = `
  <div style="font-family:-apple-system;padding:4px">
    <h2 style="text-align:center">⏱ JMS 节点延迟</h2>
    <p style="text-align:center;color:#666">最近测速：${escapeHtml(formatTime(result.timestamp))}<br>超时阈值：${TIMEOUT_MS} ms</p>
    ${warning}
    <table style="width:100%;border-collapse:collapse;text-align:center" border="1" cellpadding="7">
      <tr><th>节点</th><th>TCP</th><th>HTTP</th></tr>${rows}
    </table>
    <p style="font-size:12px;color:#666">macOS 菜单栏原生节点小弹窗只显示当前选择，不显示 ms；这里是独立测速面板。JMS 订阅已设置为每小时自动更新。</p>
  </div>`;

  $done({ title: title || "节点延迟面板", htmlMessage: html });
}

function notifyFailure(result) {
  const missing = result.missing && result.missing.length ? result.missing.join(", ") : "测速整体超时";
  $notify("JMS 节点测速异常", "3 秒内未取得完整数据", missing + "\n订阅已配置为每小时自动更新。可在 QX 中手动刷新后重试。" );
}

function runTest(interactive) {
  return Promise.all(GROUPS.map(getCandidates)).then(function (parts) {
    const nodes = unique([].concat.apply([], parts));
    if (!nodes.length) throw new Error("未找到 JMS 节点，请先更新节点订阅");

    return Promise.race([
      benchmark(nodes).then(function (raw) { return { raw: raw, timedOut: false }; }),
      timeoutPromise(TIMEOUT_MS).then(function () { return { raw: {}, timedOut: true }; }, function () { return { raw: {}, timedOut: true }; })
    ]).then(function (payload) {
      const result = normalize(nodes, payload.raw, payload.timedOut);
      save(result);
      if (result.timedOut || result.missing.length) notifyFailure(result);
      if (interactive) panel(result, "立即测速");
      else $done();
    });
  }).catch(function (error) {
    const message = error && error.message ? error.message : String(error);
    if (interactive) $done({ title: "节点测速失败", message: message });
    else {
      $notify("JMS 每小时测速失败", "任务未完成", message);
      $done();
    }
  });
}

const currentMode = mode();
if (currentMode === "show") {
  panel(load(), "最近测速结果");
} else if (currentMode === "test") {
  runTest(true);
} else {
  runTest(false);
}
