(function () {
  const keys = window.RED_WINDOW_STORAGE_KEYS;
  const defaults = window.RED_WINDOW_DEFAULT_RECORDS || [];
  const list = document.querySelector('#record-list');
  const evidenceGrid = document.querySelector('#evidence-grid');
  const imageOnlyGrid = document.querySelector('#image-only-grid');
  const searchInput = document.querySelector('#archive-search');
  const searchOutput = document.querySelector('#search-output');
  const dialog = document.querySelector('#record-dialog');
  const dialogContent = document.querySelector('#dialog-content');
  const dialogClose = document.querySelector('#dialog-close');
  const filterTabs = document.querySelector('#filter-tabs');
  const archiveCount = document.querySelector('#archive-count');
  const featuredRecord = document.querySelector('#featured-record');
  const shortStoryList = document.querySelector('#short-story-list');
  const anecdoteList = document.querySelector('#anecdote-list');
  const dreamList = document.querySelector('#dream-list');
  const watcherCode = document.querySelector('#watcher-code');
  const watcherMessage = document.querySelector('#watcher-message');
  const watcherBar = document.querySelector('#watcher-bar');
  const PAGE_SIZE = 3;

  const state = {
    category: 'ALL',
    selectedId: '',
    visibleRecords: [],
    page: 1,
  };

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function getShortStories() {
    const deleted = new Set(readJson(keys.deletedShortStoryIds, []));
    const defaults = (window.RED_WINDOW_SHORT_STORIES || []).map((story, index) => ({
      ...story,
      id: story.id || `default-short-${index}`,
    }));
    const custom = readJson(keys.customShortStories, []);
    return [...defaults, ...custom].filter((story) => !deleted.has(story.id));
  }

  function getAnecdotes() {
    const deleted = new Set(readJson(keys.deletedAnecdoteIds, []));
    const defaults = (window.RED_WINDOW_REAL_ANECDOTES || []).map((item, index) => ({
      ...item,
      id: item.id || `default-anecdote-${index}`,
    }));
    const custom = readJson(keys.customAnecdotes, []);
    return [...defaults, ...custom].filter((item) => !deleted.has(item.id));
  }

  function getDreams() {
    const deleted = new Set(readJson(keys.deletedDreamIds, []));
    const defaults = (window.RED_WINDOW_DREAM_RECORDS || []).map((item, index) => ({
      ...item,
      id: item.id || `default-dream-${index}`,
    }));
    const custom = readJson(keys.customDreams, []);
    return [...custom, ...defaults].filter((item) => !deleted.has(item.id));
  }

  function getRecords() {
    const deleted = new Set(readJson(keys.deletedRecordIds, []));
    const custom = readJson(keys.customRecords, []);
    return [...defaults, ...custom].filter((record) => !deleted.has(record.id));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    })[char]);
  }

  function getFilteredRecords() {
    const query = searchInput.value.trim().toLowerCase();
    return getRecords().filter((record) => (record.contentType || 'long') === 'long').filter((record) => {
      const categoryMatch = state.category === 'ALL' || record.category === state.category;
      const searchable = [
        record.title,
        record.summary,
        record.category,
        record.code,
        record.location,
        record.danger,
      ].join(' ').toLowerCase();
      return categoryMatch && (!query || searchable.includes(query));
    });
  }

  function renderTabs(records) {
    const categories = ['ALL', ...new Set(records.filter((record) => (record.contentType || 'long') === 'long').map((record) => record.category))];
    filterTabs.innerHTML = categories.map((category) => `
      <button type="button" class="${state.category === category ? 'is-active' : ''}" data-filter="${escapeHtml(category)}">
        ${category === 'ALL' ? '전체' : escapeHtml(category)}
      </button>
    `).join('');

    filterTabs.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.category = button.dataset.filter;
        state.page = 1;
        render();
      });
    });
  }

  function dangerLabel(danger) {
    if (danger === 'HIGH') return '고위험';
    if (danger === 'MEDIUM') return '중간';
    return '낮음';
  }

  function renderFeatured(record) {
    if (!record) {
      featuredRecord.innerHTML = `
        <div class="featured-empty">
          <span>NO SIGNAL</span>
          <strong>응답하는 기록이 없습니다</strong>
          <p>검색어를 지우거나 다른 분류를 선택하세요.</p>
        </div>
      `;
      return;
    }

    const bodyPreview = Array.isArray(record.body) ? record.body[0] : record.summary;
    featuredRecord.innerHTML = `
      <div class="featured-image-wrap">
        <img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}" decoding="async" />
        <span class="danger-chip danger-${escapeHtml(String(record.danger).toLowerCase())}">${dangerLabel(record.danger)}</span>
      </div>
      <div class="featured-copy">
        <p class="kicker">SELECTED / ${escapeHtml(record.code)}</p>
        <h3>${escapeHtml(record.title)}</h3>
        <p>${escapeHtml(bodyPreview)}</p>
        <dl class="featured-meta">
          <div><dt>분류</dt><dd>${escapeHtml(record.category)}</dd></div>
          <div><dt>위치</dt><dd>${escapeHtml(record.location)}</dd></div>
          <div><dt>복원률</dt><dd>${escapeHtml(record.recovery)}</dd></div>
        </dl>
        <a class="warped-link" href="./record.html?id=${encodeURIComponent(record.id)}">선택 기록 전문 열기</a>
      </div>
    `;

    featuredRecord.classList.remove('is-changing');
    window.requestAnimationFrame(() => featuredRecord.classList.add('is-changing'));
  }

  function renderRecords(records) {
    list.innerHTML = records.map((record, index) => `
      <article class="story-card ${record.id === state.selectedId ? 'is-selected' : ''}" data-record-id="${escapeHtml(record.id)}" style="--delay:${index * 45}ms">
        <button type="button" class="card-select" data-select-record="${escapeHtml(record.id)}" aria-label="${escapeHtml(record.title)} 선택">
          <img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}" loading="lazy" decoding="async" />
        </button>
        <div class="card-content">
          <div class="case-strip">${escapeHtml(record.category)}</div>
          <dl class="case-meta">
            <div><dt>문서 번호</dt><dd>${escapeHtml(record.code)}</dd></div>
            <div><dt>발견 시각</dt><dd>${escapeHtml(record.discoveredAt)}</dd></div>
            <div><dt>복원률</dt><dd>${escapeHtml(record.recovery)}</dd></div>
            <div><dt>위험도</dt><dd>${escapeHtml(record.danger)}</dd></div>
          </dl>
          <h3>${escapeHtml(record.title)}</h3>
          <p>${escapeHtml(record.summary)}</p>
          <a class="warped-link" href="./record.html?id=${encodeURIComponent(record.id)}">전문 복원</a>
        </div>
      </article>
    `).join('');
  }

  function renderPagination(total) {
    let pager = document.querySelector('#record-pagination');
    if (!pager) {
      pager = document.createElement('div');
      pager.className = 'record-pagination';
      pager.id = 'record-pagination';
      list.after(pager);
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    if (totalPages <= 1) {
      pager.innerHTML = '';
      return;
    }

    pager.innerHTML = `
      <button type="button" data-page-action="prev" ${state.page === 1 ? 'disabled' : ''}>이전</button>
      <span>${state.page} / ${totalPages}</span>
      <button type="button" data-page-action="next" ${state.page === totalPages ? 'disabled' : ''}>다음</button>
    `;

    pager.querySelectorAll('[data-page-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.pageAction;
        state.page += action === 'next' ? 1 : -1;
        render();
        document.querySelector('#archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderEvidence(records) {
    evidenceGrid.innerHTML = records.map((record, index) => `
      <figure class="evidence-card reveal-item" style="--delay:${index * 55}ms">
        <img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}" loading="lazy" decoding="async" />
        <figcaption>
          <strong>${escapeHtml(record.code)}.png</strong>
          <span>${escapeHtml(record.category)} / ${escapeHtml(record.recovery)} / ${escapeHtml(record.danger)}</span>
        </figcaption>
      </figure>
    `).join('');
  }

  function renderImageOnlyGallery() {
    const gallery = window.RED_WINDOW_GALLERY_IMAGES || [];
    imageOnlyGrid.innerHTML = gallery.map((image, index) => `
      <figure class="image-only-card reveal-item" style="--delay:${index * 65}ms">
        <button type="button" data-gallery-image="${escapeHtml(image.id)}" aria-label="${escapeHtml(image.title)} 크게 보기">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.title)}" loading="lazy" decoding="async" />
        </button>
        <figcaption>
          <span>${escapeHtml(image.code)}</span>
          <strong>${escapeHtml(image.title)}</strong>
        </figcaption>
      </figure>
    `).join('');
  }

  function renderShortStories() {
    const stories = getShortStories();
    shortStoryList.innerHTML = stories.map((story, index) => `
      <article class="quick-card reveal-item" style="--delay:${index * 55}ms">
        <span>${escapeHtml(story.tag)}</span>
        <h3>${escapeHtml(story.title)}</h3>
        <p>${escapeHtml(story.text)}</p>
      </article>
    `).join('');
  }

  function renderAnecdotes() {
    const anecdotes = getAnecdotes();
    anecdoteList.innerHTML = anecdotes.map((item, index) => `
      <article class="anecdote-card reveal-item" style="--delay:${index * 70}ms">
        <div>
          <span>${escapeHtml(item.place)}</span>
          <strong>${escapeHtml(item.status)}</strong>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `).join('');
  }

  function renderDreams() {
    if (!dreamList) return;
    const dreams = getDreams();
    dreamList.innerHTML = dreams.map((item, index) => `
      <article class="dream-card reveal-item" style="--delay:${index * 55}ms">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" />
        <div>
          <span>${escapeHtml(item.date || '오늘')}</span>
          <strong>${escapeHtml(item.mood || '꿈 기록')}</strong>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </article>
    `).join('');
  }

  function render() {
    const allRecords = getRecords();
    const filtered = getFilteredRecords();
    state.visibleRecords = filtered;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    const pageRecords = filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    if (!filtered.some((record) => record.id === state.selectedId)) {
      state.selectedId = pageRecords[0]?.id || filtered[0]?.id || '';
    }

    const selected = filtered.find((record) => record.id === state.selectedId);
    renderTabs(allRecords);
    renderFeatured(selected);
    renderRecords(pageRecords);
    renderPagination(filtered.length);
    renderEvidence(filtered);
    renderImageOnlyGallery();
    renderShortStories();
    renderAnecdotes();
    renderDreams();

    archiveCount.textContent = `${filtered.length}개 기록 응답 중 / ${state.page}페이지`;
    searchOutput.textContent = searchInput.value.trim()
      ? `${filtered.length}개 기록이 검색어에 반응했습니다.`
      : '필터를 바꾸면 선택 기록과 이미지가 즉시 갱신됩니다.';

    document.querySelector('#archive').classList.remove('content-shift');
    window.requestAnimationFrame(() => document.querySelector('#archive').classList.add('content-shift'));
    observeRevealItems();
  }

  function selectRecord(id) {
    state.selectedId = id;
    render();
    featuredRecord.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  let revealObserver;
  function observeRevealItems() {
    if (revealObserver) revealObserver.disconnect();
    document.querySelectorAll('.story-card, .quick-card, .anecdote-card, .dream-card, .evidence-card, .image-only-card, .category-grid article, .operations-grid article').forEach((item) => {
      item.classList.add('reveal-item');
      item.classList.add('is-visible');
    });
  }

  list.addEventListener('click', (event) => {
    const selectButton = event.target.closest('[data-select-record]');
    if (selectButton) selectRecord(selectButton.dataset.selectRecord);
  });

  imageOnlyGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-image]');
    if (!button) return;
    const image = (window.RED_WINDOW_GALLERY_IMAGES || []).find((item) => item.id === button.dataset.galleryImage);
    if (!image) return;
    dialogContent.innerHTML = `
      <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.title)}" decoding="async" />
      <p class="case-strip">IMAGE ONLY</p>
      <h2>${escapeHtml(image.title)}</h2>
      <dl class="dialog-meta">
        <div><dt>이미지 번호</dt><dd>${escapeHtml(image.code)}</dd></div>
        <div><dt>분류 상태</dt><dd>문서 미배정</dd></div>
      </dl>
      <p>이 이미지는 아직 사건 문서와 연결되지 않았습니다. 보관소는 사진이 먼저 발견된 항목을 별도 격리합니다.</p>
    `;
    dialog.showModal();
  });

  dialogClose.addEventListener('click', () => dialog.close());
  searchInput.addEventListener('input', () => {
    state.page = 1;
    render();
  });

  function updateWatcher() {
    if (!watcherCode || !watcherMessage || !watcherBar) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    const code = Math.round(333 + progress * 584).toString().padStart(4, '0');
    watcherCode.textContent = `R-${code}`;
    watcherBar.style.transform = `scaleX(${Math.max(0.08, progress)})`;
    if (progress < 0.25) watcherMessage.textContent = '열람자의 스크롤 위치를 복원 중입니다.';
    else if (progress < 0.55) watcherMessage.textContent = '짧은 괴담이 열람자의 기억에 임시 저장되었습니다.';
    else if (progress < 0.8) watcherMessage.textContent = '긴 게시글의 이미지가 현재 화면 밝기를 기록했습니다.';
    else watcherMessage.textContent = '마지막 구역입니다. 뒤로 가도 열람 기록은 남습니다.';
  }

  window.addEventListener('scroll', updateWatcher, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (!state.visibleRecords.length) return;
    const currentIndex = state.visibleRecords.findIndex((record) => record.id === state.selectedId);
    if (event.key === 'ArrowRight') {
      const next = state.visibleRecords[(currentIndex + 1) % state.visibleRecords.length];
      selectRecord(next.id);
    }
    if (event.key === 'ArrowLeft') {
      const next = state.visibleRecords[(currentIndex - 1 + state.visibleRecords.length) % state.visibleRecords.length];
      selectRecord(next.id);
    }
  });

  render();
  updateWatcher();
})();
