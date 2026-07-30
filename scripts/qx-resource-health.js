/** Quantumult X remote resource availability checker. */

const RESOURCES = [
  ["资源解析器", "https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js"],
  ["AdvertisingLite 规则", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/AdvertisingLite/AdvertisingLite.list"],
  ["AdvertisingLite 重写", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rewrite/QuantumultX/AdvertisingLite/AdvertisingLite.conf"],
  ["AI 自维护规则", "https://raw.githubusercontent.com/justFI/CocoapodsTest/master/rules/AI.list"],
  ["开发自维护规则", "https://raw.githubusercontent.com/justFI/CocoapodsTest/master/rules/Developer.list"],
  ["下载自维护规则", "https://raw.githubusercontent.com/justFI/CocoapodsTest/master/rules/Download.list"],
  ["社交自维护规则", "https://raw.githubusercontent.com/justFI/CocoapodsTest/master/rules/Social.list"],
  ["游戏自维护规则", "https://raw.githubusercontent.com/justFI/CocoapodsTest/master/rules/Game.list"],
  ["OpenAI 规则", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/OpenAI/OpenAI.list"],
  ["Claude 规则", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Claude/Claude.list"],
  ["Gemini 规则", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Gemini/Gemini.list"],
  ["GitHub 规则", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/GitHub/GitHub.list"],
  ["Apple 规则", "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Apple/Apple.list"],
  ["工具脚本", "https://raw.githubusercontent.com/justFI/CocoapodsTest/master/scripts/qx-dev-toolbox.js"]
];

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function check(item) {
  const started = Date.now();
  return $task.fetch({
    url: item[1],
    method: "GET",
    timeout: 7000,
    headers: { Range: "bytes=0-32", "User-Agent": "QuantumultX-Pro-Resource-Check/1.5" },
    opts: { policy: "开发服务-推荐s4", redirection: true }
  }).then(function (response) {
    const status = Number(response.statusCode || 0);
    return { name: item[0], url: item[1], status: status, ms: Date.now() - started, ok: status >= 200 && status < 400 };
  }, function (reason) {
    return { name: item[0], url: item[1], status: 0, ms: Date.now() - started, ok: false, error: reason && reason.error ? reason.error : "连接失败" };
  });
}

Promise.all(RESOURCES.map(check)).then(function (items) {
  const failed = items.filter(function (x) { return !x.ok; });
  const rows = items.map(function (item) {
    const icon = item.ok ? "✅" : "❌";
    const result = item.status ? String(item.status) : escapeHtml(item.error || "失败");
    return `<tr><td>${icon} ${escapeHtml(item.name)}</td><td>${result}</td><td>${item.ms} ms</td></tr>`;
  }).join("");
  const html = `
  <div style="font-family:-apple-system;padding:4px 2px">
    <h2 style="text-align:center">🧯 远程资源体检</h2>
    <p style="text-align:center"><b>${items.length - failed.length}/${items.length} 正常</b>${failed.length ? ` · <font color="#d35400">${failed.length} 个异常</font>` : ""}</p>
    <table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px" border="1" cellpadding="5">
      <tr><th>资源</th><th>HTTP</th><th>耗时</th></tr>${rows}
    </table>
    <p style="font-size:12px;color:#666">出现 404 说明远程路径大概率失效；出现 0/超时可能是当前节点、DNS 或 GitHub Raw 连接问题。该检查不会读取或上传你的订阅与证书。</p>
  </div>`;
  $done({ title: "远程资源体检", htmlMessage: html });
});
