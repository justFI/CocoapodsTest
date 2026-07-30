/** Clear Quantumult X Tunnel DNS cache. */
const started = Date.now();
$configuration.sendMessage({ action: "dns_clear_cache" }).then(function (result) {
  if (result && result.error) throw new Error(result.error);
  $done({
    title: "DNS 缓存已清理",
    message: "Quantumult X Tunnel 的 DNS 缓存已清空（" + (Date.now() - started) + " ms）。\n\n适合处理：切换节点后解析异常、某网站突然打不开、规则修改后仍命中旧结果。首次重新访问域名可能略慢。"
  });
}, function (error) {
  $done({ title: "DNS 清理失败", message: error && error.message ? error.message : String(error) });
});
