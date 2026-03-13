/**
 * Uptime Module - 博客运行时间统计
 */
const Uptime = (function () {
  let intervalId = null;

  function init() {
    const uptimeEl = document.getElementById('blog-uptime');
    if (!uptimeEl) return;

    // 清除之前的定时器
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    // 设定建站时间
    const startDate = new Date('2026-02-24T09:00:00').getTime();

    function format(num) {
      return num.toString().padStart(2, '0');
    }

    function updateUptime() {
      const now = new Date().getTime();
      const diff = Math.floor((now - startDate) / 1000);

      if (diff < 0) return;
      const _d = Math.floor(diff / (24 * 3600));
      const _h = Math.floor((diff % (24 * 3600)) / 3600);
      const _m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      // 只更新秒数的显示
      const secondsEl = uptimeEl.querySelector('.time-seconds');
      if (secondsEl) {
        secondsEl.textContent = format(s);
      }
    }

    // 立即渲染一次
    const now = new Date().getTime();
    const diff = Math.floor((now - startDate) / 1000);
    if (diff >= 0) {
      const d = Math.floor(diff / (24 * 3600));
      const h = Math.floor((diff % (24 * 3600)) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      uptimeEl.innerHTML =
        '<div class="uptime-clock-inline">' +
        '<span class="time-badge">' +
        d +
        '</span><span class="time-unit">天</span>' +
        '<span class="time-badge">' +
        format(h) +
        '</span><span class="time-unit">时</span>' +
        '<span class="time-badge">' +
        format(m) +
        '</span><span class="time-unit">分</span>' +
        '<span class="time-badge time-seconds">' +
        format(s) +
        '</span><span class="time-unit">秒</span>' +
        '</div>';

      // 每秒更新
      intervalId = setInterval(updateUptime, 1000);
    }
  }

  return { init: init };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Uptime.init);
} else {
  Uptime.init();
}
