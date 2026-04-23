/* ============================================================
   INKWELL — Premium Light Novel Platform Engine
   ============================================================ */

const App = (() => {

  /* ========== HELPERS ========== */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const param = k => new URLSearchParams(location.search).get(k);
  const getNovel = id => CONFIG.novels.find(n => n.id === id) || null;

  /* ========== THEME ========== */
  const Theme = {
    KEY: 'inkwell-theme',
    init() {
      const saved = localStorage.getItem(this.KEY) || 'dark';
      this.set(saved);
      const btn = $('#themeToggle');
      if (btn) btn.addEventListener('click', () => {
        const themes = ['dark', 'light', 'sepia'];
        const cur = document.documentElement.getAttribute('data-theme');
        const next = themes[(themes.indexOf(cur) + 1) % themes.length];
        this.set(next);
      });
    },
    set(t) {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(this.KEY, t);
      const btn = $('#themeToggle');
      if (btn) btn.textContent = t === 'dark' ? '☀️' : t === 'light' ? '📜' : '🌙';
      // Update settings swatches if visible
      $$('[data-set-theme]').forEach(s => {
        s.classList.toggle('active', s.dataset.setTheme === t);
      });
    }
  };

  /* ========== MOBILE NAV ========== */
  function initMobileNav() {
    const toggle = $('#navToggle'), links = $('#navLinks');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open'); toggle.textContent = '☰';
    }));
  }

  /* ========== NAV SCROLL SHADOW ========== */
  function initNavScroll() {
    const nav = $('#mainNav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ========== BOOKMARKS ========== */
  const Bookmarks = {
    KEY: 'inkwell-bm',
    _all() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; } },
    save(novelId, chId, scrollPct) {
      const all = this._all();
      all[novelId + '-' + chId] = { novelId, chId, scrollPct: scrollPct || 0, ts: Date.now() };
      localStorage.setItem(this.KEY, JSON.stringify(all));
    },
    get(novelId, chId) { return this._all()[novelId + '-' + chId] || null; },
    latest(novelId) {
      const all = this._all();
      let best = null;
      for (const v of Object.values(all)) {
        if ((!novelId || v.novelId === novelId) && (!best || v.ts > best.ts)) best = v;
      }
      return best;
    }
  };

  /* ========== READING PREFS ========== */
  const Prefs = {
    KEY: 'inkwell-prefs',
    defaults: { fontSize: 1.15, fontFamily: "'Lora', serif", fontId: 'lora', lineHeight: 2, lhId: 'normal', maxWidth: '680px', widthId: 'normal' },
    _data: null,
    load() {
      try { this._data = { ...this.defaults, ...JSON.parse(localStorage.getItem(this.KEY)) }; }
      catch { this._data = { ...this.defaults }; }
      return this._data;
    },
    save() { localStorage.setItem(this.KEY, JSON.stringify(this._data)); },
    get(k) { if (!this._data) this.load(); return this._data[k]; },
    set(k, v) { if (!this._data) this.load(); this._data[k] = v; this.save(); }
  };

  /* ========== TOAST ========== */
  function toast(msg, type = 'info') {
    const wrap = $('#toastWrap'); if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type === 'success' ? 'ok' : type);
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  /* ========== SHARE MODAL ========== */
  function initShare() {
    const bg = $('#shareModalBg'), modal = $('#shareModal'), close = $('#shareClose'), copy = $('#copyLink');
    if (!bg || !modal) return;
    close && close.addEventListener('click', closeShare);
    bg.addEventListener('click', closeShare);
    copy && copy.addEventListener('click', () => {
      const input = $('#shareUrl');
      navigator.clipboard.writeText(input.value).then(() => toast('✅ Link copied!', 'success'));
    });
    $$('.share-btn', modal).forEach(btn => {
      btn.addEventListener('click', () => {
        const url = encodeURIComponent($('#shareUrl').value);
        const text = encodeURIComponent(document.title);
        const map = {
          twitter: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + text,
          whatsapp: 'https://wa.me/?text=' + text + '%20' + url,
          facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
          reddit: 'https://reddit.com/submit?url=' + url + '&title=' + text
        };
        if (map[btn.dataset.platform]) window.open(map[btn.dataset.platform], '_blank', 'width=600,height=400');
        closeShare();
      });
    });
  }
  function openShare(url) {
    const bg = $('#shareModalBg'), modal = $('#shareModal'), input = $('#shareUrl');
    if (input) input.value = url || location.href;
    bg && bg.classList.add('active');
    modal && modal.classList.add('active');
  }
  function closeShare() {
    $('#shareModalBg')?.classList.remove('active');
    $('#shareModal')?.classList.remove('active');
  }

  /* ========== LIBRARY PAGE (index.html) ========== */
  function renderLibrary() {
    const grid = $('#novelGrid'); if (!grid) return;

    // Hero stats
    const statsEl = $('#heroStats');
    if (statsEl) {
      const totalNovels = CONFIG.novels.length;
      const totalChapters = CONFIG.novels.reduce((s, n) => s + n.chapters.filter(c => c.status === 'published').length, 0);
      const totalWords = CONFIG.novels.reduce((s, n) => s + n.chapters.reduce((s2, c) => s2 + (c.wordCount || 0), 0), 0);
      statsEl.innerHTML =
        '<div class="hero-stat"><div class="hero-stat-num">' + totalNovels + '</div><div class="hero-stat-label">Novels</div></div>' +
        '<div class="hero-stat"><div class="hero-stat-num">' + totalChapters + '</div><div class="hero-stat-label">Chapters</div></div>' +
        (totalWords > 0 ? '<div class="hero-stat"><div class="hero-stat-num">' + (totalWords > 1000 ? Math.round(totalWords / 1000) + 'K' : totalWords) + '</div><div class="hero-stat-label">Words</div></div>' : '');
    }

    // Render cards
    CONFIG.novels.forEach(novel => {
      const published = novel.chapters.filter(c => c.status === 'published').length;
      const totalWords = novel.chapters.reduce((s, c) => s + (c.wordCount || 0), 0);
      const card = document.createElement('a');
      card.href = 'novel.html?id=' + novel.id;
      card.className = 'novel-card anim';
      card.innerHTML =
        '<div class="novel-card-cover">' +
          (novel.cover
            ? '<img src="' + novel.cover + '" alt="' + novel.title + '" onerror="this.parentElement.innerHTML=\'<div class=placeholder-cover>' + novel.title.charAt(0) + '</div>\'">'
            : '<div class="placeholder-cover">' + novel.title.charAt(0) + '</div>') +
          '<span class="novel-card-type">' + (novel.type || 'Light Novel') + '</span>' +
        '</div>' +
        '<div class="novel-card-body">' +
          '<h3 class="novel-card-title">' + novel.title + '</h3>' +
          '<p class="novel-card-desc">' + novel.description + '</p>' +
          '<div class="novel-card-tags">' + (novel.genre || []).map(g => '<span class="tag">' + g + '</span>').join('') + '</div>' +
          '<div class="novel-card-meta">' +
            '<span>' + published + ' chapter' + (published !== 1 ? 's' : '') +
            (totalWords > 0 ? ' · ' + (totalWords > 1000 ? Math.round(totalWords / 1000) + 'K' : totalWords) + ' words' : '') + '</span>' +
            '<span class="status-' + novel.status + '">' + novel.status + '</span>' +
          '</div>' +
        '</div>';
      grid.appendChild(card);
    });

    // Continue reading
    renderContinue();
  }

  /* ========== CONTINUE READING ========== */
  function renderContinue(novelId) {
    const bar = $('#continueBar'); if (!bar) return;
    const bm = Bookmarks.latest(novelId);
    if (!bm) return;
    const novel = getNovel(bm.novelId);
    if (!novel) return;
    const ch = novel.chapters.find(c => c.id === bm.chId);
    if (!ch || ch.status !== 'published') return;

    bar.classList.remove('hidden');
    const titleEl = $('#continueTitle');
    const subEl = $('#continueSub');
    const btn = $('#continueBtn');
    if (titleEl) titleEl.textContent = novel.title + ' — ' + ch.title;
    if (subEl) subEl.textContent = Math.round(bm.scrollPct || 0) + '% read';
    if (btn) btn.href = 'read.html?novel=' + novel.id + '&ch=' + ch.id;
  }

  /* ========== NOVEL PAGE (novel.html) ========== */
  function renderNovelPage() {
    const id = param('id'); if (!id) { location.href = 'index.html'; return; }
    const novel = getNovel(id); if (!novel) { location.href = 'index.html'; return; }

    document.title = novel.title + ' — Inkwell';

    // Cover
    const coverEl = $('#novelCover');
    if (coverEl) {
      coverEl.innerHTML = novel.cover
        ? '<img src="' + novel.cover + '" alt="' + novel.title + '" onerror="this.parentElement.innerHTML=\'<div class=placeholder-cover>' + novel.title.charAt(0) + '</div>\'">'
        : '<div class="placeholder-cover">' + novel.title.charAt(0) + '</div>';
    }

    // Meta
    const typeEl = $('#novelType'); if (typeEl) typeEl.textContent = novel.type || 'Light Novel';
    const titleEl = $('#novelTitle'); if (titleEl) titleEl.textContent = novel.title;
    const authorEl = $('#novelAuthor'); if (authorEl) authorEl.textContent = CONFIG.author;
    const synEl = $('#novelSynopsis'); if (synEl) synEl.textContent = novel.description;

    // Info stats
    const infoEl = $('#novelInfo');
    if (infoEl) {
      const published = novel.chapters.filter(c => c.status === 'published').length;
      const total = novel.chapters.length;
      const totalWords = novel.chapters.reduce((s, c) => s + (c.wordCount || 0), 0);
      let html = '<div class="novel-info-item"><div class="novel-info-num">' + published + '/' + total + '</div><div class="novel-info-label">Chapters</div></div>';
      if (totalWords > 0) html += '<div class="novel-info-item"><div class="novel-info-num">' + totalWords.toLocaleString() + '</div><div class="novel-info-label">Words</div></div>';
      const avgTime = totalWords > 0 ? Math.ceil(totalWords / 250) : 0;
      if (avgTime > 0) html += '<div class="novel-info-item"><div class="novel-info-num">' + avgTime + '</div><div class="novel-info-label">Min Read</div></div>';
      html += '<div class="novel-info-item"><div class="novel-info-num status-' + novel.status + '" style="text-transform:capitalize">' + novel.status + '</div><div class="novel-info-label">Status</div></div>';
      infoEl.innerHTML = html;
    }

    // Tags
    const tagsEl = $('#novelTags');
    if (tagsEl && novel.genre) tagsEl.innerHTML = novel.genre.map(g => '<span class="tag">' + g + '</span>').join('');

    // Actions
    const actionsEl = $('#novelActions');
    if (actionsEl) {
      const first = novel.chapters.find(c => c.status === 'published');
      if (first) {
        actionsEl.innerHTML =
          '<a href="read.html?novel=' + novel.id + '&ch=' + first.id + '" class="btn btn-primary btn-sm">📖 Start Reading</a>' +
          '<button class="btn btn-outline btn-sm" onclick="App.openShare()">↗ Share</button>';
      }
    }

    // Continue reading
    renderContinue(novel.id);

    // Chapter count
    const countEl = $('#chapterCount');
    if (countEl) {
      const published = novel.chapters.filter(c => c.status === 'published').length;
      countEl.textContent = published + ' Chapter' + (published !== 1 ? 's' : '');
    }

    // Chapter list
    const listEl = $('#chapterList'); if (!listEl) return;
    novel.chapters.forEach(ch => {
      const row = document.createElement('div');
      const isLocked = ch.status !== 'published';
      row.className = 'ch-row anim' + (isLocked ? ' locked' : '');

      const bm = Bookmarks.get(novel.id, ch.id);
      const pct = bm ? Math.round(bm.scrollPct || 0) : 0;

      let metaHtml = '';
      if (!isLocked) {
        const parts = [];
        if (ch.wordCount) parts.push(ch.wordCount.toLocaleString() + ' words');
        if (ch.wordCount) parts.push(Math.ceil(ch.wordCount / 250) + ' min');
        if (ch.date) parts.push(formatDate(ch.date));
        metaHtml = '<div class="ch-meta">' + parts.join('<span class="dot"></span>') + '</div>';
        if (pct > 0) metaHtml += '<div class="ch-progress"><div class="ch-progress-fill" style="width:' + pct + '%"></div></div>';
      }

      row.innerHTML =
        '<span class="ch-num">' + ch.id + '</span>' +
        '<div class="ch-info">' +
          '<p class="ch-title">' + ch.title + '</p>' +
          (ch.subtitle ? '<p class="ch-sub">' + ch.subtitle + '</p>' : '') +
        '</div>' +
        (isLocked ? '<span class="ch-badge">Coming Soon</span>' : metaHtml);

      if (!isLocked) {
        row.addEventListener('click', () => {
          location.href = 'read.html?novel=' + novel.id + '&ch=' + ch.id;
        });
      }
      listEl.appendChild(row);
    });
  }

  function formatDate(str) {
    try { return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return str; }
  }

  /* ========== READER (read.html) ========== */
  let readerState = { novel: null, chapter: null };

  function initReader() {
    const novelId = param('novel');
    const chId = parseInt(param('ch'));
    if (!novelId || !chId) { location.href = 'index.html'; return; }

    const novel = getNovel(novelId);
    if (!novel) { location.href = 'index.html'; return; }
    const chapter = novel.chapters.find(c => c.id === chId);
    if (!chapter || chapter.status !== 'published') { location.href = 'novel.html?id=' + novelId; return; }

    readerState = { novel, chapter };
    document.title = chapter.title + ' — ' + novel.title;

    // Back link
    const back = $('#backToNovel');
    if (back) back.href = 'novel.html?id=' + novelId;

    // Toolbar title
    const barTitle = $('#readerTitle');
    if (barTitle) barTitle.textContent = novel.title + ' · ' + chapter.title;

    // Chapter header
    const numEl = $('#chNum'); if (numEl) numEl.textContent = chapter.subtitle || ('Chapter ' + chapter.id);
    const titleEl = $('#chTitle'); if (titleEl) titleEl.textContent = chapter.title;
    const metaEl = $('#chMeta');
    if (metaEl) {
      const parts = [];
      if (chapter.wordCount) parts.push(chapter.wordCount.toLocaleString() + ' words');
      if (chapter.wordCount) parts.push('~' + Math.ceil(chapter.wordCount / 250) + ' min read');
      if (chapter.date) parts.push(formatDate(chapter.date));
      metaEl.innerHTML = parts.map(p => '<span>' + p + '</span>').join('');
    }

    // Load content
    loadChapterContent(novel, chapter);

    // Apply reading preferences
    applyPrefs();

    // Init settings panel
    initSettings();

    // Bookmark button
    const bmBtn = $('#bookmarkBtn');
    if (bmBtn) bmBtn.addEventListener('click', () => {
      const pct = getScrollPct();
      Bookmarks.save(novel.id, chapter.id, pct);
      bmBtn.classList.add('active');
      toast('🔖 Bookmarked at ' + Math.round(pct) + '%', 'success');
    });

    // Share button
    const shareBtn = $('#shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', () => openShare(location.href));

    // Scroll progress tracking
    window.addEventListener('scroll', () => {
      const pct = getScrollPct();
      const fill = $('#progressFill');
      if (fill) fill.style.width = Math.min(pct, 100) + '%';
      const pg = $('#readProgress');
      if (pg) pg.textContent = Math.round(pct) + '%';
    }, { passive: true });

    // Auto-save on leave
    window.addEventListener('beforeunload', () => {
      Bookmarks.save(novel.id, chapter.id, getScrollPct());
    });

    // Chapter footer nav
    buildChapterFooter(novel, chapter);

    // Restore scroll position from bookmark
    const bm = Bookmarks.get(novel.id, chapter.id);
    if (bm && bm.scrollPct > 5) {
      setTimeout(() => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, (bm.scrollPct / 100) * docH);
      }, 400);
    }

    // Initial bookmark save
    setTimeout(() => Bookmarks.save(novel.id, chapter.id, getScrollPct()), 1000);
  }

  function getScrollPct() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    return docH > 0 ? (window.scrollY / docH) * 100 : 0;
  }

  function loadChapterContent(novel, chapter) {
    const contentEl = $('#readerContent');
    if (!contentEl) return;

    // Chapter file path: chapters/NOVEL-ID/ch1.html
    const path = 'chapters/' + novel.id + '/ch' + chapter.id + '.html';

    fetch(path)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.text(); })
      .then(html => {
        contentEl.innerHTML = html;
        // Fix image paths — if src starts with just a filename, prepend the chapter folder
        $$('img', contentEl).forEach(img => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('chapters/')) {
            img.src = 'chapters/' + novel.id + '/' + src;
          }
        });
        // Wrap standalone images in illustration figure
        $$('img', contentEl).forEach(img => {
          if (!img.closest('.illustration') && !img.closest('figure')) {
            const figure = document.createElement('figure');
            figure.className = 'illustration';
            const alt = img.getAttribute('alt');
            img.parentNode.insertBefore(figure, img);
            figure.appendChild(img);
            if (alt && alt !== 'undefined') {
              const cap = document.createElement('figcaption');
              cap.textContent = alt;
              figure.appendChild(cap);
            }
          }
        });
      })
      .catch(() => {
        contentEl.innerHTML =
          '<div style="text-align:center;padding:60px 20px;">' +
          '<p style="font-family:var(--font-display);font-size:1.5rem;margin-bottom:16px;">Chapter Not Found</p>' +
          '<p style="color:var(--text-muted);text-indent:0;">Add your chapter file at:<br><code style="color:var(--primary);">' + path + '</code></p>' +
          '<a href="novel.html?id=' + novel.id + '" class="btn btn-outline btn-sm" style="margin-top:24px;">← Back to Novel</a>' +
          '</div>';
      });
  }

  function buildChapterFooter(novel, chapter) {
    const footer = $('#chFooter'); if (!footer) return;
    const chapters = novel.chapters.filter(c => c.status === 'published');
    const idx = chapters.findIndex(c => c.id === chapter.id);
    const prev = idx > 0 ? chapters[idx - 1] : null;
    const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;

    let html = '';
    if (prev) {
      html += '<a href="read.html?novel=' + novel.id + '&ch=' + prev.id + '" class="ch-footer-link"><span class="ch-footer-label">← Previous</span><span class="ch-footer-title">' + prev.title + '</span></a>';
    } else {
      html += '<div></div>';
    }
    if (next) {
      html += '<a href="read.html?novel=' + novel.id + '&ch=' + next.id + '" class="ch-footer-link next"><span class="ch-footer-label">Next →</span><span class="ch-footer-title">' + next.title + '</span></a>';
    } else {
      html += '<div class="ch-end">You\'ve reached the latest chapter ✦</div>';
    }
    footer.innerHTML = html;
  }

  /* ========== SETTINGS PANEL ========== */
  function initSettings() {
    const btn = $('#settingsBtn'), panel = $('#settingsPanel'), overlay = $('#settingsOverlay'), close = $('#settingsClose');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => { panel.classList.add('active'); overlay.classList.add('active'); });
    const closePanel = () => { panel.classList.remove('active'); overlay.classList.remove('active'); };
    close && close.addEventListener('click', closePanel);
    overlay && overlay.addEventListener('click', closePanel);

    // Theme swatches
    $$('[data-set-theme]', panel).forEach(swatch => {
      swatch.addEventListener('click', () => Theme.set(swatch.dataset.setTheme));
    });

    // Font size
    const sizeDisplay = $('#sizeDisplay');
    const updateSizeDisplay = () => {
      if (sizeDisplay) sizeDisplay.textContent = Math.round(Prefs.get('fontSize') * 100) + '%';
    };
    updateSizeDisplay();

    $('#fontDown')?.addEventListener('click', () => {
      Prefs.set('fontSize', Math.max(0.8, Prefs.get('fontSize') - 0.05));
      applyPrefs(); updateSizeDisplay();
    });
    $('#fontUp')?.addEventListener('click', () => {
      Prefs.set('fontSize', Math.min(1.8, Prefs.get('fontSize') + 0.05));
      applyPrefs(); updateSizeDisplay();
    });

    // Font family
    $$('[data-font]', panel).forEach(btn => {
      if (btn.dataset.fontId === Prefs.get('fontId')) btn.classList.add('active');
      btn.addEventListener('click', () => {
        $$('[data-font]', panel).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Prefs.set('fontFamily', btn.dataset.font);
        Prefs.set('fontId', btn.dataset.fontId);
        applyPrefs();
      });
    });

    // Line height
    $$('[data-lh]', panel).forEach(btn => {
      if (btn.dataset.lhId === Prefs.get('lhId')) btn.classList.add('active');
      btn.addEventListener('click', () => {
        $$('[data-lh]', panel).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Prefs.set('lineHeight', parseFloat(btn.dataset.lh));
        Prefs.set('lhId', btn.dataset.lhId);
        applyPrefs();
      });
    });

    // Width
    $$('[data-width]', panel).forEach(btn => {
      if (btn.dataset.wId === Prefs.get('widthId')) btn.classList.add('active');
      btn.addEventListener('click', () => {
        $$('[data-width]', panel).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Prefs.set('maxWidth', btn.dataset.width);
        Prefs.set('widthId', btn.dataset.wId);
        applyPrefs();
      });
    });
  }

  function applyPrefs() {
    Prefs.load();
    const body = $('#readerBody');
    const content = $('#readerContent');
    if (content) {
      content.style.fontSize = Prefs.get('fontSize') + 'rem';
      content.style.fontFamily = Prefs.get('fontFamily');
      content.style.lineHeight = Prefs.get('lineHeight');
    }
    if (body) {
      body.style.maxWidth = Prefs.get('maxWidth');
    }
  }

  /* ========== INIT ========== */
  function init() {
    Theme.init();
    initMobileNav();
    initNavScroll();
    initShare();
  }

  return {
    init,
    renderLibrary,
    renderNovelPage,
    initReader,
    openShare,
    toast
  };

})();
