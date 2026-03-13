/**
 * Navigation Module - 导航高亮和智能导航栏
 */
const Navigation = (function () {
  // 路径标准化函数
  function normalizePath(path) {
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    if (path.endsWith('.html')) {
      path = path.slice(0, -5);
    }
    if (path === '' || path === '/index') {
      path = '/';
    }
    return path;
  }

  // 导航高亮
  function highlightNav() {
    const navLinks = document.querySelectorAll('.site-header .nav-link');
    if (navLinks.length === 0) return;

    const currentPath = normalizePath(window.location.pathname);

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      let href = link.getAttribute('href');
      if (!href) return;

      href = normalizePath(href);

      if (href === '/' || href === '') {
        if (currentPath === '/' || currentPath === '') {
          link.classList.add('active');
        }
        return;
      }

      if (currentPath === href || currentPath.startsWith(href + '/')) {
        link.classList.add('active');
      }
    });
  }

  // 智能导航栏（滚动隐藏）
  function initSmartHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 80) {
              header.classList.add('nav-hidden');
            } else if (currentScrollY < lastScrollY) {
              header.classList.remove('nav-hidden');
            }

            lastScrollY = currentScrollY;
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function init() {
    highlightNav();
    initSmartHeader();
  }

  return {
    init: init,
    normalizePath: normalizePath
  };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Navigation.init);
} else {
  Navigation.init();
}
