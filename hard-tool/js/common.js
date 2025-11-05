// 选择器函数 区分jq的$
function $$(selector) {
  return document.querySelector(selector);
}
function padZero(num) {
  return (num < 10 ? '0' : '') + num; // 小于 10 的前面加零
}

function getFormattedDate() {
  var date = new Date();
  var year = date.getFullYear();
  var month = padZero(date.getMonth() + 1); // 月份
  var day = padZero(date.getDate());         // 日期
  return year + '-' + month + '-' + day;
}

// 封装提示功能的函数
function showTooltip(message, status) {
  var tooltip = document.getElementById('tooltip');
  tooltip.textContent = message; // 设置提示文本

  // 根据状态设置样式
  tooltip.className = '_tooltip_ ' + status; // 状态类名

  // 设置提示框位置为页面顶部中心
  tooltip.style.top = '20px'; // 固定距离顶部的高度
  tooltip.style.left = '50%'; // 居中显示
  tooltip.style.transform = 'translateX(-50%)'; // 水平居中

  // 显示和渐显
  tooltip.style.display = 'block'; // 显示提示框
  setTimeout(function () {
    tooltip.style.opacity = '1'; // 渐显
    tooltip.style.transform = 'translate(-50%, 0)'; // 返回原位置
  }, 10);

  // 设定 2 秒后自动隐藏提示框
  setTimeout(function () {
    tooltip.style.opacity = '0'; // 渐隐
    tooltip.style.transform = 'translate(-50%, -10px)'; // 向上移动
    setTimeout(function () {
      tooltip.style.display = 'none'; // 隐藏提示框
    }, 300); // 延时以匹配动画时间
  }, 2000);
}