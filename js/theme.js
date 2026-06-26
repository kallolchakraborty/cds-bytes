(function() {
  var key = 'cdsbytes-theme';

  function getTheme() {
    var t = localStorage.getItem(key);
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    var html = document.documentElement;
    var isDark = theme === 'dark';
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(key, theme);
  }

  function setIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
  }

  function toggle() {
    var html = document.documentElement;
    var isDark = html.classList.contains('dark');
    var next = isDark ? 'light' : 'dark';
    apply(next);
    setIcon(next);
  }

  var theme = getTheme();
  apply(theme);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setIcon(theme);
      var btn = document.getElementById('themeToggle');
      if (btn) btn.addEventListener('click', toggle);
    });
  } else {
    setIcon(theme);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggle);
  }
})();
