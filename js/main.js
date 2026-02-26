// 嵌入式技术博客 - 前端交互脚本

document.addEventListener('DOMContentLoaded', function() {
  // 初始化主题
  initTheme();

  // 初始化搜索
  initSearch();

  // 初始化回到顶部按钮
  initBackToTop();

  // 初始化智能导航栏
  initSmartHeader();

  // 初始化导航高亮
  initNavHighlight();

  // 初始化 Mermaid
  initMermaid();

  // 代码块增强
  enhanceCodeBlocks();

  // 平滑滚动到锚点
  initSmoothScroll();

  // 目录高亮
  initTocHighlight();

  // 日历高亮今天
  initCalendarToday();

  // 博客运行时间
  initBlogUptime();
});

// 回到顶部功能
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  // 监听滚动事件
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }, { passive: true });

  // 点击回到顶部
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 智能导航栏（滚动时隐藏）
function initSmartHeader() {
  // 仅在文章阅读页启用智能导航栏
  if (!document.querySelector('.post-page')) return;

  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        // 向下滚动且超过导航栏高度时隐藏
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          header.classList.add('nav-hidden');
        }
        // 向上滚动时显示
        else if (currentScrollY < lastScrollY) {
          header.classList.remove('nav-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// 导航高亮功能 - 路径标准化算法
function initNavHighlight() {
  const navLinks = document.querySelectorAll('.site-header .nav-link');
  if (navLinks.length === 0) return;

  // 路径标准化函数
  function normalizePath(path) {
    // 移除末尾斜杠（保留根路径 /）
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    // 移除 .html 后缀
    if (path.endsWith('.html')) {
      path = path.slice(0, -5);
    }
    // 标准化空路径为 /
    if (path === '' || path === '/index') {
      path = '/';
    }
    return path;
  }

  // 标准化当前页面路径
  const currentPath = normalizePath(window.location.pathname);

  // 清除所有旧高亮
  navLinks.forEach(link => link.classList.remove('active'));

  // 遍历导航链接进行匹配
  navLinks.forEach(link => {
    let href = link.getAttribute('href');
    if (!href) return;

    // 标准化链接路径
    href = normalizePath(href);

    // 首页特殊处理：/ 或空路径
    if (href === '/' || href === '') {
      if (currentPath === '/' || currentPath === '') {
        link.classList.add('active');
      }
      return;
    }

    // 其他页面：当前路径以链接路径开头且后面是斜杠或结束
    if (currentPath === href || currentPath.startsWith(href + '/')) {
      link.classList.add('active');
    }
  });
}

// 主题切换功能
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle?.querySelector('.theme-icon');

  // 读取保存的主题
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  // 点击切换主题
  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // 更新图标
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }
}

// 搜索功能
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const sidebarSearch = document.getElementById('sidebarSearch');
  const searchResults = document.getElementById('searchResults');

  // FlexSearch 索引和文档缓存
  let searchIndex = null;
  let searchDocs = null;
  let isLoading = false;

  // 根据路由获取搜索范围
  function getSearchScope() {
    const path = window.location.pathname || '/';
    const normalizedPath = path.replace(/\.html$/, '').replace(/\/$/, '') || '/';

    // 首页搜索全量
    if (normalizedPath === '/' || normalizedPath === '/index') {
      return null; // 搜索全部
    }
    // 书签页
    if (normalizedPath.includes('/bookmarks')) {
      return 'bookmark';
    }
    // 项目页
    if (normalizedPath.includes('/projects')) {
      return 'project';
    }
    // 碎语页
    if (normalizedPath.includes('/moments')) {
      return 'moment';
    }
    // 关于页 - 也启用全局搜索
    if (normalizedPath.includes('/about')) {
      return null;
    }
    // 文章详情页
    if (normalizedPath.includes('/posts')) {
      return 'post';
    }
    // 分类/标签页
    if (normalizedPath.includes('/categories') || normalizedPath.includes('/tags')) {
      return 'post';
    }

    return null;
  }

  // 简单分词（中英文混合）
  function tokenize(text) {
    if (!text) return [];
    const tokens = [];
    // 中文：按2个字符分词
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    for (let i = 0; i < chineseChars.length; i += 2) {
      const word = chineseChars.slice(i, i + 2).join('');
      if (word.length === 2) tokens.push(word);
    }
    // 英文：按单词分词
    const englishWords = text.toLowerCase().match(/[a-z0-9]{2,}/g) || [];
    tokens.push(...englishWords);
    return [...new Set(tokens)];
  }

  // 懒加载搜索索引（只加载倒排索引）
  async function loadInvertedIndex() {
    if (searchIndex) return searchIndex;
    if (isLoading) return null;

    isLoading = true;
    try {
      const res = await fetch('/search-index.json');
      if (res.ok) {
        searchIndex = await res.json();
      }
    } catch (error) {
      console.error('加载搜索索引失败:', error);
    }
    isLoading = false;
    return searchIndex;
  }

  // 按需加载文档数据（搜索匹配后才加载）
  async function loadSearchDocs(docIds) {
    if (!searchDocs) {
      try {
        const res = await fetch('/search-docs.json');
        if (res.ok) {
          searchDocs = await res.json();
        }
      } catch (error) {
        console.error('加载文档数据失败:', error);
        return [];
      }
    }
    // 只返回需要的文档
    return docIds.map(id => searchDocs.find(doc => doc.id === id)).filter(Boolean);
  }

  // 执行搜索（使用倒排索引，按需加载文档）
  async function performSearch(query) {
    if (!query || query.length < 2) {
      searchResults?.classList.remove('active');
      return [];
    }

    // 1. 只加载倒排索引（很小，约1-10KB）
    const invertedIndex = await loadInvertedIndex();
    if (!invertedIndex) return [];

    const scope = getSearchScope();
    const tokens = tokenize(query);

    // 2. 使用倒排索引查找匹配的文档ID
    const docScores = {};
    for (const token of tokens) {
      const matchedDocs = invertedIndex[token] || [];
      for (const docId of matchedDocs) {
        docScores[docId] = (docScores[docId] || 0) + 1;
      }
    }

    // 按匹配分数排序，获取文档ID
    const sortedIds = Object.entries(docScores)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => parseInt(id));

    // 3. 按需加载文档数据（只有匹配时才加载）
    const docs = await loadSearchDocs(sortedIds);

    // 4. 根据范围过滤
    let filteredResults = docs;
    if (scope) {
      filteredResults = filteredResults.filter(item => item.type === scope);
    }

    return filteredResults.slice(0, 10);
  }

  // 类型标签颜色映射
  const typeColors = {
    post: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
    moment: { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333ea' },
    bookmark: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
    project: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
    about: { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }
  };

  // 显示搜索结果
  function showResults(results, query) {
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-empty">未找到相关内容</div></div>';
    } else {
      searchResults.innerHTML = results.map(item => {
        const colors = typeColors[item.type] || typeColors.post;
        const highlightedTitle = highlightMatch(item.title, query);
        const excerpt = item.content ? item.content.substring(0, 60) + (item.content.length > 60 ? '...' : '') : '';
        const url = item.url.startsWith('http') ? item.url : item.url;

        return `
          <a href="${url}" class="search-result-item" target="${item.url.startsWith('http') ? '_blank' : '_self'}">
            <div class="search-result-header">
              <span class="search-result-tag" style="background: ${colors.bg}; color: ${colors.color};">${item.tag}</span>
              <div class="search-result-title">${highlightedTitle}</div>
            </div>
            ${excerpt ? `<div class="search-result-excerpt">${excerpt}</div>` : ''}
          </a>
        `;
      }).join('');
    }
    searchResults.classList.add('active');
  }

  // 高亮匹配文本
  function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // 隐藏结果
  function hideResults() {
    setTimeout(() => {
      searchResults?.classList.remove('active');
    }, 200);
  }

  // 点击空白处关闭
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      hideResults();
    }
  });

  // 导航栏搜索
  searchInput?.addEventListener('input', async (e) => {
    const results = await performSearch(e.target.value);
    showResults(results, e.target.value);
  });

  searchInput?.addEventListener('focus', async (e) => {
    // 首次 focus 时预加载倒排索引
    if (!searchIndex) {
      await loadInvertedIndex();
    }
    if (e.target.value.length >= 2) {
      searchResults?.classList.add('active');
    }
  });

  searchInput?.addEventListener('blur', hideResults);

  // 侧边栏搜索（简单实现）
  sidebarSearch?.addEventListener('input', async (e) => {
    const results = await performSearch(e.target.value);
    // 跳转到第一篇匹配的文章
    if (results.length > 0 && e.target.value.length >= 2) {
      window.location.href = results[0].url;
    }
  });
}

// 初始化 Mermaid 图表
function initMermaid() {
  if (typeof mermaid !== 'undefined') {
    // 处理 highlight.js 格式的 mermaid 代码块
    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid');
    mermaidBlocks.forEach(block => {
      const pre = block.parentElement;
      const code = block.textContent;

      // 创建 mermaid 容器
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = code;

      // 替换原来的代码块
      pre.parentNode.replaceChild(mermaidDiv, pre);
    });

    // 渲染 mermaid 图表
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true }
    });

    mermaid.run(undefined, document.querySelectorAll('.mermaid'));
  }
}

// 代码块增强
function enhanceCodeBlocks() {
  const codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach(block => {
    const pre = block.parentElement;

    // 避免重复处理
    if (pre.querySelector('.copy-code-btn')) return;

    // 获取语言
    const className = block.className || '';
    const langMatch = className.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1].toLowerCase() : 'code';

    const code = block.textContent;

    // 添加复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-btn';
    copyBtn.textContent = '复制';
    copyBtn.title = '复制代码';

    // 添加语言标签
    const langTag = document.createElement('span');
    langTag.className = 'code-lang-tag';
    langTag.textContent = lang;

    // 复制功能
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = '已复制';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '复制';
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        copyBtn.textContent = '复制失败';
      });
    });

    pre.appendChild(copyBtn);
    pre.appendChild(langTag);
  });
}

// 平滑滚动
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// 日历高亮今天
function initCalendarToday() {
  const calendarDays = document.querySelector('.calendar-days');
  if (!calendarDays) return;

  const today = new Date().getDate();
  const daySpans = calendarDays.querySelectorAll('span[data-date]');

  daySpans.forEach(span => {
    const dateNum = parseInt(span.dataset.date, 10);
    if (dateNum === today) {
      span.classList.add('today');
    }
  });
}

// 目录高亮 - 带锁定机制
function initTocHighlight() {
  const tocLinks = document.querySelectorAll('.post-toc a, .post-toc-sidebar .toc-link');
  if (tocLinks.length === 0) return;

  // 收集标题元素
  const headings = [];
  tocLinks.forEach(link => {
    const id = link.getAttribute('href')?.substring(1);
    if (id) {
      const heading = document.getElementById(id);
      if (heading) {
        headings.push({ id, element: heading, link });
      }
    }
  });

  if (headings.length === 0) return;

  // 锁定机制：手动滚动时暂停自动高亮
  let isManualScrolling = false;
  let isClickScrolling = false;
  let scrollTimeout = null;

  const setManualScroll = () => {
    isManualScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isManualScrolling = false;
    }, 800);
  };

  // 简单的高亮更新 - 带内部滚动跟随
  let activeLink = null;
  const setActiveToc = (link, fromClick = false) => {
    if (!link || activeLink === link) return;
    activeLink = link;

    // 1. 更新高亮样式
    tocLinks.forEach(l => l.parentElement?.classList?.remove('active'));
    link.parentElement?.classList?.add('active');

    // 2. 目录内部滚动跟随（仅在非点击触发时）
    if (!fromClick && !isClickScrolling) {
      const tocContainer = document.querySelector('.post-toc-sidebar');

      // 优先检查是否需要滚动到顶部
      // 情况1：高亮的是第一个链接
      // 情况2：页面已经滚到了最顶部附近
      if (link === tocLinks[0] || window.scrollY < 100) {
        if (tocContainer) {
          tocContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      } else {
        // 正常就近滑动
        const container = link.closest('.post-toc-sidebar, .post-toc');
        if (container) {
          const linkRect = link.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          const isAbove = linkRect.top < containerRect.top;
          const isBelow = linkRect.bottom > containerRect.bottom;

          if (isAbove || isBelow) {
            link.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
        }
      }
    }
  };

  // 点击目录时立即高亮并锁定
  tocLinks.forEach(link => {
    link.addEventListener('click', () => {
      isClickScrolling = true; // 标记点击滚动
      setActiveToc(link, true);
      setManualScroll();
      // 1秒后解锁，允许内部滚动跟随
      setTimeout(() => {
        isClickScrolling = false;
      }, 1000);
    });
  });

  // 使用节流的 IntersectionObserver（仅在非手动滚动时触发）
  let ticking = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (isManualScrolling || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isManualScrolling) {
            const activeLink = document.querySelector(`.post-toc a[href="#${entry.target.id}"], .post-toc-sidebar .toc-link[href="#${entry.target.id}"]`);
            setActiveToc(activeLink, false);
          }
        });
        ticking = false;
      });
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
  );

  headings.forEach(h => observer.observe(h.element));

  // 初始化高亮第一个
  setActiveToc(tocLinks[0], false);
}

// 添加必要样式
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

  /* 移动端搜索框 */
  @media (max-width: 768px) {
    .search-box {
      display: none;
    }
  }

  /* 行号按钮激活状态 */
  .code-action-btn.active {
    background: var(--primary-color);
    color: #fff;
  }
`;
document.head.appendChild(style);

// 博客运行时间
let _uptimeIntervalId = null;

function initBlogUptime() {
  const uptimeEl = document.getElementById('blog-uptime');
  if (!uptimeEl) return;

  // 清除之前的定时器，避免多个定时器同时运行
  if (_uptimeIntervalId) {
    clearInterval(_uptimeIntervalId);
    _uptimeIntervalId = null;
  }

  // 设定建站时间
  const startDate = new Date('2026-02-24T09:00:00').getTime();

  // 预先创建静态 DOM 结构，只更新变化的秒数
  const format = (num) => num.toString().padStart(2, '0');

  const updateUptime = () => {
    const now = new Date().getTime();
    const diff = Math.floor((now - startDate) / 1000);

    if (diff < 0) return;
    const d = Math.floor(diff / (24 * 3600));
    const h = Math.floor((diff % (24 * 3600)) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    // 只更新秒数的显示，避免重渲染整个元素
    const secondsEl = uptimeEl.querySelector('.time-seconds');
    if (secondsEl) {
      secondsEl.textContent = format(s);
    }
  };

  // 立即渲染一次（包含完整结构）
  const now = new Date().getTime();
  const diff = Math.floor((now - startDate) / 1000);
  if (diff >= 0) {
    const d = Math.floor(diff / (24 * 3600));
    const h = Math.floor((diff % (24 * 3600)) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    uptimeEl.innerHTML = `
      <div class="uptime-clock-inline">
        <span class="time-badge">${d}</span><span class="time-unit">天</span>
        <span class="time-badge">${format(h)}</span><span class="time-unit">时</span>
        <span class="time-badge">${format(m)}</span><span class="time-unit">分</span>
        <span class="time-badge highlight time-seconds">${format(s)}</span><span class="time-unit">秒</span>
      </div>
    `;
  }

  // 每秒只更新秒数字段
  _uptimeIntervalId = setInterval(updateUptime, 1000);
}
