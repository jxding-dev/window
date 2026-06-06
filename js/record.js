(function () {
  const keys = window.RED_WINDOW_STORAGE_KEYS;
  const defaults = window.RED_WINDOW_DEFAULT_RECORDS || [];
  const container = document.querySelector('#record-page');

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
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

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const records = getRecords();
  const record = records.find((item) => item.id === id || item.slug === id) || records[0];

  if (!record) {
    container.innerHTML = `
      <section class="record-missing">
        <p class="kicker">NO RECORD</p>
        <h1>기록이 없습니다</h1>
        <a class="warped-link" href="./index.html#archive">목록으로 돌아가기</a>
      </section>
    `;
    return;
  }

  document.title = `${record.title} / RED WINDOW`;
  const paragraphs = Array.isArray(record.body) ? record.body : [record.body || record.summary];
  const related = records.filter((item) => item.id !== record.id).slice(0, 3);

  container.innerHTML = `
    <article class="record-article">
      <header class="record-hero">
        <img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}" decoding="async" fetchpriority="high" />
        <div class="record-hero-shade"></div>
        <div class="record-hero-copy">
          <a class="back-link" href="./index.html#archive">← 목록으로</a>
          <p class="kicker">${escapeHtml(record.code)} / ${escapeHtml(record.category)} / ${escapeHtml(record.danger)}</p>
          <h1>${escapeHtml(record.title)}</h1>
          <p>${escapeHtml(record.subtitle || record.summary)}</p>
        </div>
      </header>

      <section class="record-article-grid">
        <aside class="record-sidebar">
          <dl>
            <div><dt>문서 번호</dt><dd>${escapeHtml(record.code)}</dd></div>
            <div><dt>분류</dt><dd>${escapeHtml(record.category)}</dd></div>
            <div><dt>위험도</dt><dd>${escapeHtml(record.danger)}</dd></div>
            <div><dt>발견 시각</dt><dd>${escapeHtml(record.discoveredAt)}</dd></div>
            <div><dt>발견 위치</dt><dd>${escapeHtml(record.location)}</dd></div>
            <div><dt>복원률</dt><dd>${escapeHtml(record.recovery)}</dd></div>
          </dl>
          <p>${escapeHtml(record.authorNote || '이 기록은 열람 시점에 따라 일부 문장이 다르게 보일 수 있습니다.')}</p>
        </aside>

        <div class="record-body">
          ${paragraphs.map((text, index) => `
            <p class="${index === 0 ? 'lead-paragraph' : ''}">${escapeHtml(text)}</p>
          `).join('')}
        </div>
      </section>

      <section class="related-records">
        <div class="section-title">
          <p>RELATED FILES</p>
          <h2>다른 복원 기록</h2>
        </div>
        <div class="related-grid">
          ${related.map((item) => `
            <a class="related-card" href="./record.html?id=${encodeURIComponent(item.id)}">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" />
              <span>${escapeHtml(item.code)}</span>
              <strong>${escapeHtml(item.title)}</strong>
            </a>
          `).join('')}
        </div>
      </section>
    </article>
  `;

})();
