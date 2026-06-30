(function() {
  function sanitizeHtml(html) {
    var doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = html;
    Array.from(doc.body.querySelectorAll('*')).forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
        if (attr.name === 'href' && /^\s*javascript:/i.test(attr.value)) el.removeAttribute('href');
      });
    });
    Array.from(doc.body.querySelectorAll('script, iframe, object, embed')).forEach(function (el) { el.remove(); });
    return doc.body.innerHTML;
  }

  // Search modal
  var searchModal = document.getElementById('search-modal');
  var searchInput = document.getElementById('modal-search-input');
  var searchResults = document.getElementById('modal-search-results');
  var searchBackdrop = document.getElementById('search-modal-backdrop');
  var closeSearch = document.getElementById('close-search-modal');
  var searchTriggers = document.querySelectorAll('.open-search-btn');

  // Share modal
  var shareModal = document.getElementById('share-modal');
  var shareBackdrop = document.getElementById('share-modal-backdrop');
  var closeShare = document.getElementById('close-share-modal');
  var shareTriggers = document.querySelectorAll('.open-share-btn');
  var shareUrlInput = document.getElementById('share-url-input');
  var copyBtn = document.getElementById('copy-link-btn');

  var fuse = null;
  var lastResults = [];
  var selectedIdx = -1;
  var lastFocused = null;

  function initFuse() {
    var index = [];
    try { index = window.__SEARCH_INDEX || []; } catch(e) {}
    if (!index.length) return;
    fuse = new Fuse(index, {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'description', weight: 2 },
        { name: 'tags', weight: 2 },
        { name: 'sectionsText', weight: 1.5 },
        { name: 'code', weight: 1.5 },
        { name: 'detailsText', weight: 1 },
        { name: 'category', weight: 1 },
        { name: 'phaseName', weight: 1 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2
    });
  }

  function highlightText(text, matches, key) {
    if (!matches || !matches.length) return escapeHtml(text);
    var fieldMatches = matches.filter(function(m) { return m.key === key; });
    if (!fieldMatches.length) return escapeHtml(text);

    var indices = [];
    fieldMatches.forEach(function(m) {
      (m.indices || []).forEach(function(idx) {
        indices.push(idx);
      });
    });
    if (!indices.length) return escapeHtml(text);

    indices.sort(function(a, b) { return a[0] - b[0]; });

    var result = '';
    var lastEnd = 0;
    for (var i = 0; i < indices.length; i++) {
      var start = indices[i][0];
      var end = indices[i][1] + 1;
      if (start < lastEnd) continue;
      result += escapeHtml(text.substring(lastEnd, start));
      result += '<mark>' + escapeHtml(text.substring(start, end)) + '</mark>';
      lastEnd = end;
    }
    result += escapeHtml(text.substring(lastEnd));
    return result;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getPhaseBadge(phase, phaseName) {
    if (!phase && phase !== 0) return '';
    var label = phaseName || ('Phase ' + phase);
    if (phase === 0) label = 'Study Plan';
    else label = 'Phase ' + phase + ': ' + (phaseName || '');
    return '<span class="search-phase-badge">' + escapeHtml(label) + '</span>';
  }

  function openSearch() {
    if (!searchModal) return;
    lastFocused = document.activeElement;
    searchModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    selectedIdx = -1;
    setTimeout(function() {
      if (searchInput) searchInput.focus();
      // Re-run search if there's already a query
      if (searchInput && searchInput.value) performSearch(searchInput.value);
    }, 100);
  }

  function closeSearchModal() {
    if (!searchModal) return;
    searchModal.classList.add('hidden');
    document.body.style.overflow = '';
    if (searchInput) searchInput.value = '';
    if (searchResults) {
      searchResults.innerHTML = '<div class="search-empty">Type to search CDS artifacts...</div>';
    }
    lastResults = [];
    selectedIdx = -1;
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  }

  function openShare() {
    if (!shareModal) return;
    lastFocused = document.activeElement;
    shareModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (shareUrlInput) {
      shareUrlInput.focus();
      shareUrlInput.select();
    }
    if (copyBtn) copyBtn.textContent = 'Copy Link';
  }

  function closeShareModal() {
    if (!shareModal) return;
    shareModal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  }

  function navigateResults(dir) {
    if (!lastResults.length) return;
    var items = searchResults.querySelectorAll('.search-result-item');
    if (!items.length) return;

    // Remove previous selection
    if (selectedIdx >= 0 && items[selectedIdx]) {
      items[selectedIdx].classList.remove('search-result-selected');
    }

    selectedIdx += dir;
    if (selectedIdx < 0) selectedIdx = 0;
    if (selectedIdx >= items.length) selectedIdx = items.length - 1;

    items[selectedIdx].classList.add('search-result-selected');
    items[selectedIdx].scrollIntoView({ block: 'nearest' });
  }

  function performSearch(query) {
    if (!searchResults) return;
    var q = query.trim();
    if (!q) {
      searchResults.innerHTML = '<div class="search-empty">Type to search CDS artifacts...</div>';
      lastResults = [];
      selectedIdx = -1;
      return;
    }

    if (!fuse) initFuse();
    var results = fuse ? fuse.search(q) : [];
    lastResults = results;
    selectedIdx = -1;

    if (!results.length) {
      searchResults.innerHTML = '<div class="search-empty">No results found for "' + escapeHtml(q) + '"</div>';
      return;
    }

    var html = '<div class="search-results-list">';
    html += results.slice(0, 20).map(function(result, idx) {
      var item = result.item;
      var matches = result.matches || [];
      var phaseBadge = getPhaseBadge(item.phase, item.phaseName);
      var desc = item.description || '';
      var descHighlighted = highlightText(desc.substring(0, 200), matches, 'description');
      var titleHighlighted = highlightText(item.title, matches, 'title');

      // Section matches
      var sectionMatches = matches.filter(function(m) { return m.key === 'sectionsText'; });
      var sectionHints = '';
      if (sectionMatches.length && item.sections && item.sections.length) {
        var matchedSections = [];
        sectionMatches.forEach(function(m) {
          (m.indices || []).forEach(function(idx) {
            var text = item.sectionsText.substring(idx[0], idx[1] + 1);
            item.sections.forEach(function(s) {
              if (s.toLowerCase().indexOf(text.toLowerCase()) !== -1) {
                if (matchedSections.indexOf(s) === -1) matchedSections.push(s);
              }
            });
          });
        });
        if (matchedSections.length) {
          sectionHints = '<div class="search-section-hints">' +
            matchedSections.slice(0, 3).map(function(s) {
              return '<span class="search-section-tag">' + escapeHtml(s) + '</span>';
            }).join('') + '</div>';
        }
      }

      return '<a href="' + escapeHtml(item.url) + '" class="search-result-item" data-index="' + idx + '">' +
        '<div class="search-result-header">' +
          phaseBadge +
          '<span class="search-result-key">' + escapeHtml(item.url.replace('docs.html#', '')) + '</span>' +
        '</div>' +
        '<div class="search-result-title">' + titleHighlighted + '</div>' +
        (desc ? '<div class="search-result-desc">' + descHighlighted + '</div>' : '') +
        sectionHints +
        '</a>';
    }).join('');
    html += '</div>';

    // Add meta info at top
    var metaHtml = '<div class="search-meta">' + results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for "' + escapeHtml(q) + '"</div>';
    searchResults.innerHTML = metaHtml + html;
  }

  // Event listeners
  searchTriggers.forEach(function(t) {
    t.addEventListener('click', openSearch);
  });

  if (closeSearch) closeSearch.addEventListener('click', closeSearchModal);
  if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearchModal);

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      performSearch(this.value);
    });
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeSearchModal();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateResults(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateResults(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIdx >= 0 && lastResults[selectedIdx]) {
          window.location.href = lastResults[selectedIdx].item.url;
          closeSearchModal();
        }
      }
    });
  }

  // Delegate click on search results
  if (searchResults) {
    searchResults.addEventListener('click', function(e) {
      var item = e.target.closest('.search-result-item');
      if (item) {
        closeSearchModal();
      }
    });
  }

  shareTriggers.forEach(function(t) {
    t.addEventListener('click', openShare);
  });

  if (closeShare) closeShare.addEventListener('click', closeShareModal);
  if (shareBackdrop) shareBackdrop.addEventListener('click', closeShareModal);

  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      if (!shareUrlInput) return;
      var url = shareUrlInput.value;
      navigator.clipboard.writeText(url).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy Link'; }, 2000);
      }).catch(function() {
        copyBtn.textContent = 'Copy Link';
      });
    });
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (searchModal && !searchModal.classList.contains('hidden')) closeSearchModal();
      if (shareModal && !shareModal.classList.contains('hidden')) closeShareModal();
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (searchModal && searchModal.classList.contains('hidden')) {
        openSearch();
      } else {
        closeSearchModal();
      }
    }
  });

  // Init on load
  initFuse();
})();
