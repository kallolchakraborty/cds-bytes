(function() {
  // Local storage key to store user's selected theme preference
  var key = 'cdsbytes-theme';

  /**
   * Retrieves the current theme preference.
   * If a preference is stored in localStorage, it returns it.
   * Otherwise, it defaults to 'light' mode unconditionally.
   */
  function getTheme() {
    var t = localStorage.getItem(key);
    if (t === 'dark' || t === 'light') return t;
    return 'light'; // Default to light theme
  }

  /**
   * Applies the selected theme ('light' or 'dark') to the document.
   * Toggles the 'dark' class on the html element and sets the stylesheet
   * for syntax highlighting (highlight.js) accordingly.
   */
  function apply(theme) {
    var html = document.documentElement;
    var isDark = theme === 'dark';
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Dynamically swap highlight.js theme stylesheet depending on active mode
    var hlLink = document.getElementById('hljs-theme');
    if (hlLink) {
      hlLink.href = isDark 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css' 
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }
    localStorage.setItem(key, theme);
  }

  /**
   * Updates the icon of the theme toggle button to reflect current state.
   */
  function setIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = theme === 'dark' ? 'dark_mode' : 'light_mode';
  }

  /**
   * Toggles the theme between 'light' and 'dark'.
   */
  function toggle() {
    var html = document.documentElement;
    var isDark = html.classList.contains('dark');
    var next = isDark ? 'light' : 'dark';
    apply(next);
    setIcon(next);
  }

  // Load and apply the theme immediately to avoid styling flash
  var theme = getTheme();
  apply(theme);

  // Setup DOM event listeners for the toggle button once DOM is ready
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
