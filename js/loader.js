(function() {
  var main = document.getElementById('docs-dynamic-content');
  var rightOutline = document.getElementById('docs-right-outline');
  var shareUrlInput = document.getElementById('share-url-input');
  var shareTrigger = document.querySelector('.open-share-btn');
  var loadingHTML = '<div class="flex items-center justify-center py-16"><div class="flex items-center gap-3 text-slate-400"><span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span><span class="text-sm">Loading content...</span></div></div>';
  var errorHTML = '<div class="text-center py-16"><div class="text-slate-400 mb-4"><span class="material-symbols-outlined text-[48px]">error_outline</span></div><p class="text-slate-600 dark:text-slate-400 text-sm mb-4">Failed to load content. Please try again.</p><button id="retryBtn" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">Retry</button></div>';

  var routeMap = window.__ROUTE_MAP || {};
  var contentCache = {};
  var currentHash = null;
  var scrollObserver = null;
  var allLinks = document.querySelectorAll('#left-sidebar .sidebar-link');
  var backdrop = document.getElementById('sidebar-backdrop');

  function closeMobileSidebar() {
    if (backdrop && !backdrop.classList.contains('hidden')) {
      backdrop.click();
    }
  }

  function setActiveLink(hash) {
    allLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href === hash) {
        link.classList.add('active-doc-link');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active-doc-link');
        link.removeAttribute('aria-current');
      }
    });
  }

  function updatePageTitle(title, description, phase, phaseName) {
    document.title = title + ' - CDS Bytes';
    var badgeHtml = '';
    if (phase) {
      badgeHtml = '<span class="phase-badge">Phase ' + phase + (phaseName ? ': ' + phaseName : '') + '</span>';
    }
    var headerHTML = '<div class="mb-6 flex flex-col gap-2">' + 
                     (badgeHtml ? '<div class="flex">' + badgeHtml + '</div>' : '') +
                     '<h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">' + title + '</h1>' + 
                     (description ? '<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">' + description + '</p>' : '') + 
                     '</div>';
    return headerHTML;
  }

  function updateShareUrl(hash) {
    if (!shareUrlInput) return;
    var url = window.location.origin + window.location.pathname + '#' + hash;
    shareUrlInput.value = url;
    if (shareTrigger) {
      shareTrigger.setAttribute('data-href', url);
    }
    window.history.replaceState(null, '', '#' + hash);
  }

  function renderContent(data, hash) {
    if (!main) return;
    var title = data.title || data.id || hash.replace('#', '');
    var description = data.description || '';
    var sections = data.sections || [];

    // Build sections HTML
    var sectionsHtml = '';
    if (data.content) {
      sectionsHtml = data.content;
    } else if (sections.length > 0) {
      sectionsHtml = sections.map(function(s) {
        var id = s.title.toLowerCase().replace(/\s+/g, '-');
        if (s.codeBlock) {
          return '<h2 id="section-' + id + '">' + s.title + '</h2>\n<pre><code class="language-abap">' + s.codeBlock + '</code></pre>';
        }
        if (s.description) {
          return '<h2 id="section-' + id + '">' + s.title + '</h2>\n' + s.description;
        }
        return '';
      }).join('\n');
    }

    var header = updatePageTitle(title, description, data.phase, data.phaseName);

    main.innerHTML = header + '<div class="content">' + sectionsHtml + '</div>';

    // Highlight code blocks
    if (typeof hljs !== 'undefined') {
      main.querySelectorAll('pre code').forEach(function(block) {
        hljs.highlightElement(block);
      });
    }

    // Update right outline
    updateRightOutline(data);
    updateShareUrl(hash);
    setActiveLink('#' + data.id);
    setupScrollSpy();
  }

  function updateRightOutline(data) {
    if (!rightOutline) return;
    var sections = data.sections || [];
    var artifactId = data.id || '';
    if (!sections || sections.length === 0) {
      rightOutline.innerHTML = '<p class="text-xs text-slate-400">No sections</p>';
      return;
    }
    var html = sections.map(function(s) {
      var sectionId = s.id || s.title.toLowerCase().replace(/\s+/g, '-');
      return '<a href="#section-' + artifactId + '-' + sectionId + '" class="outline-link">' + s.title + '</a>';
    }).join('');
    rightOutline.innerHTML = html;

    // Add smooth scroll click handlers
    rightOutline.querySelectorAll('.outline-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('href').replace('#', '');
        var target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function setupScrollSpy() {
    if (scrollObserver) scrollObserver.disconnect();
    var h2s = document.querySelectorAll('#docs-dynamic-content h2');
    if (!h2s.length || !rightOutline) return;
    scrollObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var id = entry.target.getAttribute('id');
        var link = rightOutline.querySelector('[href="#' + id + '"]');
        if (!link) return;
        if (entry.isIntersecting) {
          rightOutline.querySelectorAll('.active-outline').forEach(function(l) { l.classList.remove('active-outline'); });
          link.classList.add('active-outline');
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px' });
    h2s.forEach(function(h2) { scrollObserver.observe(h2); });
  }

  function loadContent(hash) {
    if (!hash) return;
    if (currentHash === hash) return;
    currentHash = hash;

    var contentPath = routeMap[hash];
    if (!contentPath) {
      main.innerHTML = errorHTML;
      return;
    }

    main.innerHTML = loadingHTML;
    setActiveLink(hash);

    var cached = contentCache[hash];
    if (cached) {
      renderContent(cached, hash);
      return;
    }
    fetch(contentPath)
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        contentCache[hash] = data;
        renderContent(data, hash);
      })
      .catch(function(err) {
        console.error('Failed to load content:', err);
        main.innerHTML = errorHTML;
        var retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', function() { loadContent(hash); });
        }
      });
  }

  // Handle sidebar link clicks
  allLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var hash = this.getAttribute('href');
      if (hash) {
        loadContent(hash);
        closeMobileSidebar();
      }
    });
  });

  // Handle hashchange
  window.addEventListener('hashchange', function() {
    var hash = window.location.hash;
    if (hash && routeMap[hash]) {
      loadContent(hash);
    }
  });

  // Initial load
  document.addEventListener('DOMContentLoaded', function() {
    var hash = window.location.hash;
    if (!hash || !routeMap[hash]) {
      hash = '#ZPRAC_CDS_SIMPLE';
      window.history.replaceState(null, '', hash);
    }
    loadContent(hash);
  });
})();
