// LinuxVerse main.js
(function () {
  // Theme persistence
  const saved = localStorage.getItem('lv-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  window.toggleTheme = function () {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lv-theme', next);
    document.querySelector('.theme-toggle').textContent = next === 'dark' ? '☀' : '🌙';
  };

  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = saved === 'dark' ? '☀' : '🌙';
})();