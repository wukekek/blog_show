/**
 * Search Module - Fuse.js 模糊搜索
 */
const Search = (function () {
  let searchInput, sidebarSearch, searchResults;
  let fuse = null;
  let searchIndex = null;
  let isLoading = false;

  const typeColors = {
    post: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
    moment: { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333ea' },
    bookmark: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
    project: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
    about: { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }
  };

  function getSearchScope() {
    const path = window.location.pathname || '/';
    const normalizedPath = path.replace(/\.html$/, '').replace(/\/$/, '') || '/';

    if (normalizedPath === '/' || normalizedPath === '/index') {
      return null;
    }
    if (normalizedPath.includes('/bookmarks')) {
      return 'bookmark';
    }
    if (normalizedPath.includes('/projects')) {
      return 'project';
    }
    if (normalizedPath.includes('/moments')) {
      return 'moment';
    }
    if (normalizedPath.includes('/about')) {
      return null;
    }
    if (normalizedPath.includes('/posts')) {
      return 'post';
    }
    if (normalizedPath.includes('/categories') || normalizedPath.includes('/tags')) {
      return 'post';
    }

    return null;
  }

  async function loadSearchIndex() {
    if (fuse) return fuse;
    if (isLoading) return null;

    isLoading = true;
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) {
        console.error('Search index load failed:', res.status);
        return null;
      }
      searchIndex = await res.json();

      fuse = new Fuse(searchIndex, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'searchText', weight: 0.3 },
          { name: 'excerpt', weight: 0.2 },
          { name: 'date', weight: 0.1 }
        ],
        threshold: 0.3,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true
      });
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
    isLoading = false;
    return fuse;
  }

  async function performSearch(query) {
    if (!query || query.length < 2) {
      searchResults && searchResults.classList.remove('active');
      return [];
    }

    const fuseInstance = await loadSearchIndex();
    if (!fuseInstance) return [];

    const scope = getSearchScope();
    const results = fuseInstance.search(query);

    let filteredResults = results.map(function (r) {
      return r.item;
    });
    if (scope) {
      filteredResults = filteredResults.filter(function (item) {
        return item.type === scope;
      });
    }

    return filteredResults.slice(0, 10);
  }

  function highlightMatch(text, query) {
    const regex = new RegExp('(' + query + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function showResults(results, query) {
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML =
        '<div class="search-result-item"><div class="search-result-empty">未找到相关内容</div></div>';
    } else {
      searchResults.innerHTML = results
        .map(function (item) {
          const colors = typeColors[item.type] || typeColors.post;
          const tagLabel =
            { post: '文章', moment: '碎语', bookmark: '书签', project: '项目' }[item.type] ||
            item.type;
          const highlightedTitle = highlightMatch(item.title, query);
          const url = item.url.startsWith('http') ? item.url : item.url;

          return (
            '<a href="' +
            url +
            '" class="search-result-item" target="' +
            (item.url.startsWith('http') ? '_blank' : '_self') +
            '">' +
            '<div class="search-result-header">' +
            '<span class="search-result-tag" style="background: ' +
            colors.bg +
            '; color: ' +
            colors.color +
            ';">' +
            tagLabel +
            '</span>' +
            '<div class="search-result-title">' +
            highlightedTitle +
            '</div>' +
            '</div>' +
            (item.excerpt ? '<div class="search-result-excerpt">' + item.excerpt + '</div>' : '') +
            '</a>'
          );
        })
        .join('');
    }
    searchResults.classList.add('active');
  }

  function hideResults() {
    setTimeout(function () {
      searchResults && searchResults.classList.remove('active');
    }, 200);
  }

  function init() {
    searchInput = document.getElementById('searchInput');
    sidebarSearch = document.getElementById('sidebarSearch');
    searchResults = document.getElementById('searchResults');

    // 点击空白处关闭
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-box')) {
        hideResults();
      }
    });

    // 导航栏搜索
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        performSearch(e.target.value).then(function (results) {
          showResults(results, e.target.value);
        });
      });

      searchInput.addEventListener('focus', function (e) {
        if (!fuse) {
          loadSearchIndex();
        }
        if (e.target.value.length >= 2) {
          searchResults && searchResults.classList.add('active');
        }
      });

      searchInput.addEventListener('blur', hideResults);
    }

    // 侧边栏搜索
    if (sidebarSearch) {
      sidebarSearch.addEventListener('input', function (e) {
        performSearch(e.target.value).then(function (results) {
          if (results.length > 0 && e.target.value.length >= 2) {
            window.location.href = results[0].url;
          }
        });
      });
    }
  }

  return { init: init };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Search.init);
} else {
  Search.init();
}
