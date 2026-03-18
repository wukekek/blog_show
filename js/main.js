/**
 * Main Entry - 前端交互入口
 */

// 全局变量存储打字机定时器
let typewriterTimer = null;

// 打字机效果 - 封装为可重复调用的函数
function initTypewriter() {
  // 清除之前的定时器
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }

  const typewriterElement = document.getElementById('typewriter');
  if (!typewriterElement) return;

  const texts = ['代码改变世界', '探索硬件与软件的边界', '让技术更有温度'];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    const currentText = texts[textIndex];

    if (isDeleting) {
      typewriterElement.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50;
    } else {
      typewriterElement.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100;
    }

    if (!isDeleting && charIndex === currentText.length) {
      isDeleting = true;
      typingSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typingSpeed = 500;
    }

    typewriterTimer = setTimeout(type, typingSpeed);
  }

  type();
}

// 页面加载时初始化
initTypewriter();

// 标题逐字动画
function initTitleAnimation() {
  const titleChars = document.querySelectorAll('.hero-title span');
  titleChars.forEach((char, index) => {
    char.style.animationDelay = `${index * 0.1}s`;
  });
}

initTitleAnimation();

// 首屏滚动按钮
(function () {
  const scrollBtn = document.querySelector('.hero-scroll');
  if (!scrollBtn) return;

  scrollBtn.addEventListener('click', function () {
    const mainContent =
      document.querySelector('.main-content') || document.querySelector('.page-container-wrap');
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  });
})();

// 智能导航栏 - 滚动方向与位置感知
(function () {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  let lastScrollY = 0;
  let ticking = false;
  const HIDE_THRESHOLD = 50; // 向下滚动超过50px隐藏

  // 页面加载或显示时重置滚动状态
  function resetScrollState() {
    // 检查是否在首页
    const isHomePage = document.querySelector('.hero-banner');
    if (!isHomePage) return;

    // 强制移除隐藏状态
    toolbar.classList.remove('nav-hidden');
    lastScrollY = 0;
  }

  // 页面加载完成时重置
  window.addEventListener('load', function () {
    // 短暂延迟确保其他脚本完成
    setTimeout(resetScrollState, 50);
  });

  // 页面可见性变化时重置状态（从其他页面返回时）
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      setTimeout(resetScrollState, 100);
    }
  });

  // popstate 事件（浏览器前进后退时）
  window.addEventListener('popstate', function () {
    setTimeout(resetScrollState, 100);
  });

  function updateNavbar() {
    const scrollY = window.scrollY;
    const heroHeight =
      document.querySelector('.hero-banner')?.offsetHeight || window.innerHeight * 0.5;

    // 1. 顶部状态 - 不在顶部时添加毛玻璃效果
    if (scrollY > 10) {
      toolbar.classList.add('nav-scrolled');
    } else {
      toolbar.classList.remove('nav-scrolled');
    }

    // 2. 滚动方向 - 向上显示，向下隐藏
    const isScrollingDown = scrollY > lastScrollY;
    const isScrollingUp = scrollY < lastScrollY;

    if (scrollY > heroHeight + HIDE_THRESHOLD) {
      if (isScrollingDown) {
        // 向下滚动超过阈值 → 隐藏
        toolbar.classList.add('nav-hidden');
      } else if (isScrollingUp) {
        // 向上滚动 → 显示
        toolbar.classList.remove('nav-hidden');
      }
    } else {
      // 在首屏范围内始终显示
      toolbar.classList.remove('nav-hidden');
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  // 初始检查
  updateNavbar();

  // 使用 requestAnimationFrame 优化滚动性能
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  });
})();

// 下拉菜单控制 - 使用 class 控制
(function () {
  const dropdowns = document.querySelectorAll('.toolbar-dropdown');
  if (!dropdowns.length) return;

  // 初始化：确保所有菜单收起
  dropdowns.forEach(function (dropdown) {
    dropdown.classList.remove('dropdown-open');
  });

  // 点击下拉按钮时切换菜单
  dropdowns.forEach(function (dropdown) {
    const toggleBtn = dropdown.querySelector('.toolbar-link-dropdown');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // 关闭其他下拉菜单
      dropdowns.forEach(function (other) {
        if (other !== dropdown) {
          other.classList.remove('dropdown-open');
        }
      });

      // 切换当前菜单
      dropdown.classList.toggle('dropdown-open');
    });
  });

  // 点击子菜单链接后关闭所有菜单
  document.querySelectorAll('.dropdown-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('dropdown-open');
      });
    });
  });

  // 点击页面其他地方关闭菜单
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.toolbar-dropdown')) {
      dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('dropdown-open');
      });
    }
  });

  // 页面加载完成后重置菜单状态
  window.addEventListener('load', function () {
    dropdowns.forEach(function (dropdown) {
      dropdown.classList.remove('dropdown-open');
    });
  });
})();

// 添加必要样式
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .post-toc a.active {
      color: var(--primary-color);
      font-weight: 600;
    }

    /* 搜索高亮 */
    .search-result-title mark {
      background: rgba(59, 130, 246, 0.3);
      color: var(--primary-color);
      padding: 0 2px;
      border-radius: 2px;
    }

    /* 行号按钮激活状态 */
    .code-action-btn.active {
      background: var(--primary-color);
      color: #fff;
    }
  `;
  document.head.appendChild(style);
})();

// 文章卡片整卡点击跳转
(function () {
  const cards = document.querySelectorAll('.post-card-grid');
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      // 如果点击的是标签或分类，不触发整卡跳转
      if (e.target.closest('.post-card-category') || e.target.closest('.post-card-tag')) {
        return;
      }

      const link = card.querySelector('.post-card-title a');
      if (link) {
        // 添加点击反馈
        document.body.classList.add('page-loading');

        // 延迟跳转，让动画播放
        setTimeout(() => {
          window.location.href = link.href;
        }, 150);
      }
    });
  });
})();

// PJAX 无刷新跳转
(function () {
  // 检查是否支持 History API
  if (!window.history || !window.history.pushState) return;

  // 初始化页面脚本
  function initPageScripts() {
    // 重新初始化打字机效果（首页）
    if (typeof initTypewriter === 'function') {
      initTypewriter();
    }

    // 重新初始化标题动画（首页）
    if (typeof initTitleAnimation === 'function') {
      initTitleAnimation();
    }

    // 重新初始化搜索
    if (window.initSearch) window.initSearch();

    // 重新初始化代码高亮
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach((block) => {
        window.hljs.highlightElement(block);
      });
    }

    // 重新初始化目录
    if (window.initToc) window.initToc();

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 拦截所有内部链接
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) {
      return;
    }

    // 阻止默认跳转
    e.preventDefault();

    // 添加加载状态
    document.body.classList.add('page-loading');
    document.body.classList.remove('page-loaded');

    // 使用 fetch 获取新页面
    fetch(href)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 更新 hero-banner（如果存在）
        const newHeroBanner = doc.querySelector('.hero-banner');
        const oldHeroBanner = document.querySelector('.hero-banner');
        if (newHeroBanner && oldHeroBanner) {
          oldHeroBanner.innerHTML = newHeroBanner.innerHTML;
        } else if (newHeroBanner && !oldHeroBanner) {
          // 新页面有 banner，旧页面没有 - 插入 banner
          const header = document.querySelector('header');
          if (header && header.nextSibling) {
            header.parentNode.insertBefore(newHeroBanner, header.nextSibling);
          }
        } else if (!newHeroBanner && oldHeroBanner) {
          // 新页面没有 banner，旧页面有 - 移除 banner
          oldHeroBanner.remove();
        }

        // 更新内容容器（替换整个元素以保留正确的class）
        const newContainer = doc.querySelector('#pjax-container');
        const oldContainer = document.querySelector('#pjax-container');
        if (newContainer && oldContainer && newContainer.outerHTML !== oldContainer.outerHTML) {
          oldContainer.parentNode.replaceChild(newContainer, oldContainer);
        } else if (newContainer && oldContainer) {
          oldContainer.innerHTML = newContainer.innerHTML;
        }

        // 更新标题
        document.title = doc.title;

        // 更新 URL
        window.history.pushState({}, '', href);

        // 移除加载状态，添加完成状态
        document.body.classList.remove('page-loading');
        document.body.classList.add('page-loaded');

        // 0.5秒后移除完成状态
        setTimeout(() => {
          document.body.classList.remove('page-loaded');
        }, 500);

        // 重新初始化页面脚本
        initPageScripts();
      })
      .catch((error) => {
        console.error('页面加载失败:', error);
        document.body.classList.remove('page-loading');
        // 失败时使用传统跳转
        window.location.href = href;
      });
  });

  // 处理浏览器前进后退
  window.addEventListener('popstate', function () {
    document.body.classList.add('page-loading');
    document.body.classList.remove('page-loaded');

    fetch(window.location.href)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 更新 hero-banner（如果存在）
        const newHeroBanner = doc.querySelector('.hero-banner');
        const oldHeroBanner = document.querySelector('.hero-banner');
        if (newHeroBanner && oldHeroBanner) {
          oldHeroBanner.innerHTML = newHeroBanner.innerHTML;
        } else if (newHeroBanner && !oldHeroBanner) {
          const header = document.querySelector('header');
          if (header && header.nextSibling) {
            header.parentNode.insertBefore(newHeroBanner, header.nextSibling);
          }
        } else if (!newHeroBanner && oldHeroBanner) {
          oldHeroBanner.remove();
        }

        // 更新内容容器（替换整个元素以保留正确的class）
        const newContainer = doc.querySelector('#pjax-container');
        const oldContainer = document.querySelector('#pjax-container');
        if (newContainer && oldContainer && newContainer.outerHTML !== oldContainer.outerHTML) {
          oldContainer.parentNode.replaceChild(newContainer, oldContainer);
        } else if (newContainer && oldContainer) {
          oldContainer.innerHTML = newContainer.innerHTML;
        }

        document.title = doc.title;
        document.body.classList.remove('page-loading');
        document.body.classList.add('page-loaded');

        setTimeout(() => {
          document.body.classList.remove('page-loaded');
        }, 500);

        initPageScripts();
      })
      .catch(() => {
        window.location.reload();
      });
  });
})();
