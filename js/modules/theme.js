/**
 * Theme Module - 主题切换功能
 */
const Theme = (function () {
  const STORAGE_KEY = 'theme';

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function init() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const themeIcon = themeToggle.querySelector('.theme-icon');

    // 读取保存的主题
    const savedTheme = localStorage.getItem(STORAGE_KEY) || 'light';
    setTheme(savedTheme);

    // 点击切换主题
    themeToggle.addEventListener('click', function () {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });

    // 更新图标
    function updateIcon(theme) {
      if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
      }
    }

    // 初始化图标
    updateIcon(savedTheme);
  }

  return {
    init: init,
    setTheme: setTheme
  };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Theme.init);
} else {
  Theme.init();
}
