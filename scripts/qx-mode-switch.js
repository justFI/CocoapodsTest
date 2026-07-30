/**
 * Quantumult X one-tap scenario switcher.
 * URL fragment examples: #mode=ai / dev / download / streaming / restore
 */

const POLICIES = {
  default: "默认代理-推荐s3",
  ai: "AI服务-推荐s3",
  dev: "开发服务-推荐s4",
  download: "下载服务-固定s801",
  tiktok: "TikTok-推荐s4",
  netflix: "Netflix-推荐s4",
  disney: "DisneyPlus-推荐s3",
  youtube: "YouTube-推荐s4",
  spotify: "Spotify-推荐s4",
  social: "社交通信-推荐s3",
  game: "游戏平台-推荐s1或s2"
};

function getMode() {
  if ($environment.variables && $environment.variables.mode) return String($environment.variables.mode).toLowerCase();
  const source = String($environment.sourcePath || "");
  const match = source.match(/[#&]mode=([^&]+)/i);
  return match ? decodeURIComponent(match[1]).toLowerCase() : "restore";
}

function sendConfiguration(message) {
  return $configuration.sendMessage(message).then(function (result) {
    if (result && result.error) throw new Error(result.error);
    return result && result.ret ? result.ret : {};
  });
}

function nodeFor(candidates, suffix) {
  const pattern = new RegExp("c12s" + suffix + "(?:\\.|\\b)", "i");
  for (let i = 0; i < candidates.length; i += 1) {
    if (pattern.test(String(candidates[i]))) return candidates[i];
  }
  return "";
}

function shortNode(name) {
  const match = String(name || "").match(/c12s(?:801|[1-5])/i);
  return match ? match[0].toLowerCase() : String(name || "");
}

const mode = getMode();
const allPolicies = Object.keys(POLICIES).map(function (key) { return POLICIES[key]; });

sendConfiguration({ action: "get_customized_policy", content: allPolicies }).then(function (customized) {
  let candidates = [];
  allPolicies.forEach(function (policy) {
    const item = customized[policy];
    if (item && Array.isArray(item.candidates)) candidates = candidates.concat(item.candidates);
  });
  candidates = candidates.filter(function (value, index, array) { return array.indexOf(value) === index; });

  const nodes = {
    s1: nodeFor(candidates, "1"),
    s2: nodeFor(candidates, "2"),
    s3: nodeFor(candidates, "3"),
    s4: nodeFor(candidates, "4"),
    s5: nodeFor(candidates, "5"),
    s801: nodeFor(candidates, "801")
  };

  const plans = {
    ai: {
      title: "AI 稳定模式",
      choices: { default: "s3", ai: "s3", social: "s3" },
      note: "默认代理、AI 与社交通信切到 CN2 GIA s3。"
    },
    dev: {
      title: "开发模式",
      choices: { default: "s4", dev: "s4", youtube: "s4", spotify: "s4" },
      note: "默认代理与开发服务切到大阪 SoftBank s4；AI 仍保持独立策略。"
    },
    download: {
      title: "下载省流量模式",
      choices: { download: "s801" },
      note: "仅命中下载规则的流量走 s801，其他业务不受影响。"
    },
    streaming: {
      title: "流媒体模式",
      choices: { tiktok: "s4", netflix: "s4", youtube: "s4", spotify: "s4", disney: "s3" },
      note: "TikTok/Netflix/YouTube/Spotify 使用 s4，Disney+ 使用 s3。"
    },
    restore: {
      title: "恢复推荐设置",
      choices: {
        default: "s3", ai: "s3", dev: "s4", download: "s801",
        tiktok: "s4", netflix: "s4", disney: "s3", youtube: "s4",
        spotify: "s4", social: "s3", game: "s1"
      },
      note: "已恢复 QuantumultX Pro 推荐配置。游戏平台先用 s1，实际体验不佳时改试 s2。"
    }
  };

  const plan = plans[mode] || plans.restore;
  const dict = {};
  const changed = [];
  const missing = [];

  Object.keys(plan.choices).forEach(function (key) {
    const nodeKey = plan.choices[key];
    const policy = POLICIES[key];
    const node = nodes[nodeKey];
    if (policy && node) {
      dict[policy] = node;
      changed.push(policy + " → " + shortNode(node));
    } else {
      missing.push(policy + " 缺少 " + nodeKey);
    }
  });

  if (!Object.keys(dict).length) throw new Error("未找到可切换的 JMS 节点，请先更新节点订阅。" + (missing.length ? "\n" + missing.join("\n") : ""));

  return sendConfiguration({ action: "set_policy_state", content: dict }).then(function () {
    return { plan: plan, changed: changed, missing: missing };
  });
}).then(function (result) {
  let message = result.plan.note + "\n\n" + result.changed.join("\n");
  if (result.missing.length) message += "\n\n未处理：\n" + result.missing.join("\n");
  $done({ title: "✅ " + result.plan.title, message: message });
}).catch(function (error) {
  $done({ title: "场景切换失败", message: error && error.message ? error.message : String(error) });
});
