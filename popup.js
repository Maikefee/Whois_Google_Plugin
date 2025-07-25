// 获取元素
const domainInput = document.getElementById('domainInput');
const queryBtn = document.getElementById('queryBtn');
const autoBtn = document.getElementById('autoBtn');
const resultDiv = document.getElementById('result');

// 提取主域名（如www.baidu.com→baidu.com）
function getRootDomain(hostname) {
  // 简单处理常见域名，复杂情况可用更强库
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  // 处理如 xxx.co.uk 这类后缀
  const common2ndLevel = ['co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'com.cn', 'net.cn', 'org.cn'];
  const last2 = parts.slice(-2).join('.');
  const last3 = parts.slice(-3).join('.');
  if (common2ndLevel.includes(last2)) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

// 查询 whois
async function queryWhois(domain) {
  resultDiv.textContent = '查询中...';
  try {
    const resp = await fetch(`https://api.whoiscx.com/whois/?domain=${encodeURIComponent(domain)}`);
    const data = await resp.json();
    if (data.status === 1 && data.data) {
      const info = data.data.info || {};
      resultDiv.innerHTML = `
        <b>域名：</b>${data.data.domain || '-'}<br>
        <b>注册商：</b>${info.registrar_name || '-'}<br>
        <b>注册时间：</b>${info.creation_time || '-'}<br>
        <b>到期时间：</b>${info.expiration_time || '-'}<br>
        <b>状态：</b>${Array.isArray(info.domain_status) ? info.domain_status.join(', ') : '-'}<br>
        <b>DNS：</b>${Array.isArray(info.name_server) ? info.name_server.join(', ') : '-'}<br>
      `;
    } else {
      resultDiv.textContent = '未查询到信息或域名格式错误。';
    }
  } catch (e) {
    resultDiv.textContent = '查询失败，请稍后重试。';
  }
}

// 手动查询
queryBtn.onclick = () => {
  const domain = domainInput.value.trim();
  if (!domain) {
    resultDiv.textContent = '请输入域名。';
    return;
  }
  queryWhois(getRootDomain(domain));
};

// 自动获取当前标签页主域名并查询
autoBtn.onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    try {
      const url = new URL(tabs[0].url);
      const rootDomain = getRootDomain(url.hostname);
      domainInput.value = rootDomain;
      queryWhois(rootDomain);
    } catch {
      resultDiv.textContent = '无法获取当前标签页域名。';
    }
  });
};

// 弹窗打开时自动查询当前标签页主域名
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    try {
      const url = new URL(tabs[0].url);
      const rootDomain = getRootDomain(url.hostname);
      domainInput.value = rootDomain;
      queryWhois(rootDomain);
    } catch {
      resultDiv.textContent = '无法获取当前标签页域名。';
    }
  });
}); 