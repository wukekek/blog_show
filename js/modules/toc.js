/**
 * TOC Module - 目录高亮（带锁定机制）
 */
const TOC = (function () {
  let observer = null;

  function cleanup() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function init() {
    // 先清理旧的监听器
    cleanup();

    const tocLinks = document.querySelectorAll('.post-toc a, .post-toc-sidebar .toc-link');
    if (tocLinks.length === 0) return;

    // 收集标题元素
    const headings = [];
    tocLinks.forEach(function (link) {
      let id = link.getAttribute('href');
      if (id) {
        id = id.substring(1);
        const heading = document.getElementById(id);
        if (heading) {
          headings.push({ id: id, element: heading, link: link });
        }
      }
    });

    if (headings.length === 0) return;

    // 锁定机制
    let isManualScrolling = false;
    let isClickScrolling = false;
    let scrollTimeout = null;

    function setManualScroll() {
      isManualScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        isManualScrolling = false;
      }, 800);
    }

    let activeLink = null;
    function setActiveToc(link, fromClick) {
      if (!link || activeLink === link) return;
      activeLink = link;

      // 更新高亮样式
      tocLinks.forEach(function (l) {
        if (l.parentElement) l.parentElement.classList.remove('active');
      });
      if (link.parentElement) link.parentElement.classList.add('active');

      // 目录内部滚动跟随
      if (!fromClick && !isClickScrolling) {
        const tocContainer = document.querySelector('.post-toc-sidebar');

        if (link === tocLinks[0] || window.scrollY < 100) {
          if (tocContainer) {
            tocContainer.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          const container = link.closest('.post-toc-sidebar, .post-toc');
          if (container) {
            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const isAbove = linkRect.top < containerRect.top;
            const isBelow = linkRect.bottom > containerRect.bottom;

            if (isAbove || isBelow) {
              link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }
    }

    // 点击目录
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        isClickScrolling = true;
        setActiveToc(link, true);
        setManualScroll();
        setTimeout(function () {
          isClickScrolling = false;
        }, 1000);
      });
    });

    // IntersectionObserver
    let ticking = false;
    observer = new IntersectionObserver(
      function (entries) {
        if (isManualScrolling || ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !isManualScrolling) {
              const activeLinkSel =
                '.post-toc a[href="#' +
                entry.target.id +
                '"], .post-toc-sidebar .toc-link[href="#' +
                entry.target.id +
                '"]';
              const activeLinkDom = document.querySelector(activeLinkSel);
              setActiveToc(activeLinkDom, false);
            }
          });
          ticking = false;
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );

    headings.forEach(function (h) {
      observer.observe(h.element);
    });

    // 初始化高亮第一个
    setActiveToc(tocLinks[0], false);
  }

  // 兼容旧名称
  function initTocHighlight() {
    init();
  }

  return {
    init: init,
    initTocHighlight: initTocHighlight,
    cleanup: cleanup
  };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', TOC.init);
} else {
  TOC.init();
}
