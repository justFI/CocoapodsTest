/** Quantumult X developer and AI service speed test. */

const TARGETS = [
  { name: "OpenAI API", url: "https://api.openai.com/v1/models", policy: "AI服务-推荐s3" },
  { name: "Anthropic API", url: "https://api.anthropic.com/v1/models", policy: "AI服务-推荐s3" },
  { name: "Gemini API", url: "https://generativelanguage.googleapis.com/v1beta/models", policy: "AI服务-推荐s3" },
  { name: "GitHub API", url: "https://api.github.com/zen", policy: "开发服务-推荐s4" },
  { name: "npm Registry", url: "https://registry.npmjs.org/-/ping", policy: "开发服务-推荐s4" },
  { name: "PyPI", url: "https://pypi.org/pypi/pip/json", policy: "开发服务-推荐s4" },
  { name: "Swift Package Index", url: "https://swiftpackageindex.com/api/search?query=alamofire", policy: "开发服务-推荐s4" },
  { name: "Hugging Face", url: "https://huggingface.co/api/whoami-v2", policy: "开发服务-推荐s4" }
];

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function test(target) {
  const started = Date.now();
  return $task.fetch({
    url: target.url,
    method: "GET",
    timeout: 7000,
    headers: { "User-Agent": "QuantumultX-Pro-Network-Test/1.5" },
    opts: { policy: target.policy, redirection: true }
  }).then(function (response) {
    const status = Number(response.statusCode || 0);
    const reachable = status >= 200 && status < 500;
    return { name: target.name, policy: target.policy, status: status, ms: Date.now() - started, ok: reachable };
  }, function (reason) {
    return { name: target.name, policy: target.policy, status: 0, ms: Date.now() - started, ok: false, error: reason && reason.error ? reason.error : "超时或连接失败" };
  });
}

Promise.all(TARGETS.map(test)).then(function (items) {
  const sorted = items.slice().sort(function (a, b) {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    return a.ms - b.ms;
  });
  const rows = sorted.map(function (item) {
    const icon = item.ok ? "✅" : "❌";
    const status = item.status ? String(item.status) : escapeHtml(item.error || "失败");
    return `<tr><td>${icon} ${escapeHtml(item.name)}</td><td>${status}</td><td>${item.ms} ms</td><td>${escapeHtml(item.policy.replace(/-推荐.*/, ""))}</td></tr>`;
  }).join("");
  const okCount = items.filter(function (x) { return x.ok; }).length;
  const html = `
  <div style="font-family:-apple-system;padding:4px 2px">
    <h2 style="text-align:center">⚡ 开发与 AI 服务测速</h2>
    <p style="text-align:center"><b>${okCount}/${items.length} 个服务链路可达</b></p>
    <table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px" border="1" cellpadding="5">
      <tr><th>服务</th><th>HTTP</th><th>耗时</th><th>策略</th></tr>${rows}
    </table>
    <p style="font-size:12px;color:#666">401、403、404 通常说明网络链路已经连通，只是接口需要凭证或路径不提供公开数据；0 或连接失败才更像 DNS、TLS、节点或网络问题。</p>
  </div>`;
  $done({ title: "开发与 AI 服务测速", htmlMessage: html });
});
