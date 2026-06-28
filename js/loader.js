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
        var sTitle = s.title || '';
        var id = sTitle.toLowerCase().replace(/\s+/g, '-');
        var heading = sTitle ? '<h2 id="section-' + id + '">' + sTitle + '</h2>\n' : '';
        if (s.codeBlock) {
          return heading + '<pre><code class="language-abap">' + s.codeBlock + '</code></pre>';
        }
        if (s.description) {
          return heading + s.description;
        }
        return '';
      }).join('\n');
    }

    var header = updatePageTitle(title, description, data.phase, data.phaseName);

    main.innerHTML = header + '<div class="content">' + sectionsHtml + '</div>';

    // Enhance code blocks with actions (Copy, Download) and Line Numbers
    main.querySelectorAll('#docs-dynamic-content pre').forEach(function(pre) {
      var code = pre.querySelector('code');
      if (!code) return;

      var rawCode = code.textContent || code.innerText;
      var lines = rawCode.replace(/\r\n/g, '\n').split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      var lineCount = lines.length;

      var lineNumbersHtml = '';
      for (var i = 1; i <= lineCount; i++) {
        lineNumbersHtml += '<div>' + i + '</div>';
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      var header = document.createElement('div');
      header.className = 'code-block-header';
      
      var langLabel = document.createElement('span');
      langLabel.className = 'code-block-lang';
      var lang = code.className.replace('language-', '').toUpperCase() || 'ABAP';
      if (lang.indexOf('HLJS') !== -1) lang = 'ABAP';
      langLabel.textContent = lang;

      var actions = document.createElement('div');
      actions.className = 'code-block-actions';

      var copyBtn = document.createElement('button');
      copyBtn.className = 'code-action-btn copy-btn';
      copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span><span>Copy</span>';
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(rawCode).then(function() {
          copyBtn.innerHTML = '<span class="material-symbols-outlined" style="color: #22C55E !important;">check</span><span style="color: #22C55E !important;">Copied!</span>';
          setTimeout(function() {
            copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span><span>Copy</span>';
          }, 2000);
        });
      });

      var downloadBtn = document.createElement('button');
      downloadBtn.className = 'code-action-btn download-btn';
      downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span><span>Download</span>';
      downloadBtn.addEventListener('click', function() {
        var filename = (data.id || 'source') + '.asddls';
        var blob = new Blob([rawCode], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(downloadBtn);
      header.appendChild(langLabel);
      header.appendChild(actions);

      var container = document.createElement('div');
      container.className = 'code-container';

      var gutter = document.createElement('div');
      gutter.className = 'line-numbers-gutter';
      gutter.innerHTML = lineNumbersHtml;

      pre.parentNode.replaceChild(wrapper, pre);
      
      container.appendChild(gutter);
      container.appendChild(pre);
      wrapper.appendChild(header);
      wrapper.appendChild(container);

      if (typeof hljs !== 'undefined') {
        hljs.highlightElement(code);
      }
    });

    // Format SVG elements and fix text overlapping/overflow issues
    main.querySelectorAll('.docs-diagram svg').forEach(function(svg) {
      svg.querySelectorAll('text').forEach(function(text) {
        text.style.setProperty('font-family', "'Ubuntu', sans-serif", 'important');
      });

      var rects = svg.querySelectorAll('rect');
      rects.forEach(function(rect) {
        var rx = parseFloat(rect.getAttribute('x'));
        var ry = parseFloat(rect.getAttribute('y'));
        var rw = parseFloat(rect.getAttribute('width'));
        var rh = parseFloat(rect.getAttribute('height'));
        if (isNaN(rx) || isNaN(ry) || isNaN(rw) || isNaN(rh)) return;
        
        var fill = rect.getAttribute('fill') || '';
        var isCodeRect = fill.toLowerCase() === '#1e293b';

        // Find all text elements inside this rect
        var insideTexts = [];
        svg.querySelectorAll('text').forEach(function(text) {
          var tx = parseFloat(text.getAttribute('x') || 0);
          var ty = parseFloat(text.getAttribute('y') || 0);
          if (tx >= rx && tx <= rx + rw && ty >= ry && ty <= ry + rh + 30) {
            insideTexts.push(text);
          }
        });

        if (insideTexts.length === 0) return;

        // Sort by original y coordinate
        insideTexts.sort(function(a, b) {
          return parseFloat(a.getAttribute('y') || 0) - parseFloat(b.getAttribute('y') || 0);
        });

        if (isCodeRect) {
          insideTexts.forEach(function(text) {
            text.style.setProperty('font-family', "'JetBrains Mono', monospace", 'important');
            text.style.setProperty('font-size', '9.5px', 'important');
            text.querySelectorAll('tspan').forEach(function(tspan) {
              tspan.style.setProperty('font-family', "'JetBrains Mono', monospace", 'important');
              tspan.style.setProperty('font-size', '9.5px', 'important');
            });
          });
        }

        var lastTextY = parseFloat(insideTexts[insideTexts.length - 1].getAttribute('y') || 0);
        if (lastTextY > ry + rh - 5 || isCodeRect) {
          var paddingStart = isCodeRect ? 18 : 15;
          var paddingEnd = 10;
          var availableHeight = rh - paddingStart - paddingEnd;
          var count = insideTexts.length;
          
          insideTexts.forEach(function(text, index) {
            var newY;
            if (count === 1) {
              newY = ry + rh / 2 + 4;
            } else {
              newY = ry + paddingStart + index * (availableHeight / (count - 1));
            }
            text.setAttribute('y', newY);
            text.querySelectorAll('tspan').forEach(function(tspan) {
              tspan.setAttribute('y', newY);
            });
          });
        }
      });
    });

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
      if (!s.title) return '';
      var sectionId = s.id || s.title.toLowerCase().replace(/\s+/g, '-');
      return '<a href="#section-' + artifactId + '-' + sectionId + '" class="outline-link">' + s.title + '</a>';
    }).filter(Boolean).join('');
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
