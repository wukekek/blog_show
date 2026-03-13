/**
 * Back to Top Module - 回到顶部按钮
 */
const BackToTop = (function () {
  function init() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    // 监听滚动事件
    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 300) {
          backToTopBtn.classList.add('show');
        } else {
          backToTopBtn.classList.remove('show');
        }
      },
      { passive: true }
    );

    // 点击回到顶部
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return { init: init };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', BackToTop.init);
} else {
  BackToTop.init();
}
