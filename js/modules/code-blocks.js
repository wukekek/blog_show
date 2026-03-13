/**
 * Code Blocks Module - 代码块增强（顶部装饰栏、复制按钮、语言标签）
 */
const CodeBlocks = (function () {
  function init() {
    const codeBlocks = document.querySelectorAll('pre code');

    codeBlocks.forEach(function (block) {
      const pre = block.parentElement;

      // 避免重复处理
      if (pre.querySelector('.code-header')) return;

      // 获取语言
      const className = block.className || '';
      const langMatch = className.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1].toLowerCase() : 'code';

      const code = block.textContent;

      // 创建顶部装饰栏
      const header = document.createElement('div');
      header.className = 'code-header';

      // 三个圆点
      const dots = document.createElement('div');
      dots.className = 'code-dots';
      dots.innerHTML =
        '<span class="code-dot red"></span><span class="code-dot yellow"></span><span class="code-dot green"></span>';

      // 语言标签
      const langTag = document.createElement('span');
      langTag.className = 'code-lang-tag';
      langTag.textContent = lang;

      header.appendChild(dots);
      header.appendChild(langTag);

      // 添加复制按钮
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.innerHTML = '<span class="copy-text">复制</span>';
      copyBtn.title = '复制代码';

      // 复制功能
      copyBtn.addEventListener('click', function () {
        navigator.clipboard
          .writeText(code)
          .then(function () {
            copyBtn.querySelector('.copy-text').textContent = '已复制';
            copyBtn.classList.add('copied');
            setTimeout(function () {
              copyBtn.querySelector('.copy-text').textContent = '复制';
              copyBtn.classList.remove('copied');
            }, 2000);
          })
          .catch(function (err) {
            console.error('复制失败:', err);
            copyBtn.querySelector('.copy-text').textContent = '复制失败';
          });
      });

      pre.appendChild(header);
      pre.appendChild(copyBtn);
    });
  }

  return { init: init };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CodeBlocks.init);
} else {
  CodeBlocks.init();
}
