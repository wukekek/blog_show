/**
 * Mermaid Module - Mermaid 图表渲染
 */
const Mermaid = (function () {
  function init() {
    if (typeof mermaid === 'undefined') return;

    // 处理 highlight.js 格式的 mermaid 代码块
    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid');
    mermaidBlocks.forEach(function (block) {
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

  return { init: init };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Mermaid.init);
} else {
  Mermaid.init();
}
