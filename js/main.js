/**
 * Main Entry - 前端交互入口
 * 保留无法拆分的代码（内联样式等）
 */

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
})();
