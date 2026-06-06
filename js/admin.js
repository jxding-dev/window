(function () {
  const ADMIN_PASSWORD = ['red', 'window', '0333'].join('');
  const keys = window.RED_WINDOW_STORAGE_KEYS;
  const defaults = window.RED_WINDOW_DEFAULT_RECORDS || [];
  const defaultShortStories = window.RED_WINDOW_SHORT_STORIES || [];
  const defaultAnecdotes = window.RED_WINDOW_REAL_ANECDOTES || [];
  const defaultDreams = window.RED_WINDOW_DREAM_RECORDS || [];

  const gate = document.querySelector('#admin-gate');
  const workspace = document.querySelector('#admin-workspace');
  const loginForm = document.querySelector('#login-form');
  const loginMessage = document.querySelector('#login-message');
  const recordForm = document.querySelector('#record-form');
  const contentType = document.querySelector('#content-type');
  const saveMessage = document.querySelector('#save-message');
  const recordList = document.querySelector('#admin-record-list');
  const restoreButton = document.querySelector('#restore-defaults');
  const apparition = document.querySelector('#apparition');
  const apparitionMessages = [
    '방금 저장되지 않은 글이 공개되었습니다',
    '삭제한 항목이 다른 이름으로 돌아왔습니다',
    '관리자 권한이 하나 더 감지되었습니다',
    '초안이 스스로 본문을 늘렸습니다',
    '이미지는 업로드 전에 복원되었습니다',
  ];

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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

  function getCustomRecords() {
    return readJson(keys.customRecords, []);
  }

  function getCustomShortStories() {
    return readJson(keys.customShortStories, []);
  }

  function getCustomAnecdotes() {
    return readJson(keys.customAnecdotes, []);
  }

  function getCustomDreams() {
    return readJson(keys.customDreams, []);
  }

  function getDeleted(key) {
    return new Set(readJson(key, []));
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now()}`;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function updateFormMode() {
    const type = contentType.value;
    document.querySelectorAll('.field-long, .field-short, .field-anecdote, .field-dream').forEach((field) => {
      field.classList.add('is-hidden');
    });
    document.querySelectorAll(`.field-${type}`).forEach((field) => {
      field.classList.remove('is-hidden');
    });
    document.querySelectorAll('.field-common').forEach((field) => {
      field.classList.remove('is-hidden');
    });
  }

  function collectAdminItems() {
    const deletedRecords = getDeleted(keys.deletedRecordIds);
    const deletedShorts = getDeleted(keys.deletedShortStoryIds);
    const deletedAnecdotes = getDeleted(keys.deletedAnecdoteIds);
    const deletedDreams = getDeleted(keys.deletedDreamIds);

    const longItems = [...defaults, ...getCustomRecords()].map((item) => ({
      id: item.id,
      type: 'long',
      typeLabel: '긴 게시글',
      source: defaults.some((record) => record.id === item.id) ? 'default' : 'custom',
      title: item.title,
      meta: `${item.code || '-'} / ${item.category || '-'} / ${item.danger || '-'}`,
      summary: item.summary || '',
      image: item.image,
      deleted: deletedRecords.has(item.id),
    }));

    const shortItems = [...defaultShortStories, ...getCustomShortStories()].map((item, index) => {
      const id = item.id || `default-short-${index}`;
      return {
        id,
        type: 'short',
        typeLabel: '짧은 괴담',
        source: item.id ? 'custom' : 'default',
        title: item.title,
        meta: item.tag || '짧은 괴담',
        summary: item.text || '',
        deleted: deletedShorts.has(id),
      };
    });

    const anecdoteItems = [...defaultAnecdotes, ...getCustomAnecdotes()].map((item, index) => {
      const id = item.id || `default-anecdote-${index}`;
      return {
        id,
        type: 'anecdote',
        typeLabel: '실제 일화',
        source: item.id ? 'custom' : 'default',
        title: item.title,
        meta: `${item.place || '-'} / ${item.status || '-'}`,
        summary: item.text || '',
        deleted: deletedAnecdotes.has(id),
      };
    });

    const dreamItems = [...defaultDreams, ...getCustomDreams()].map((item, index) => {
      const id = item.id || `default-dream-${index}`;
      return {
        id,
        type: 'dream',
        typeLabel: '관리자 꿈',
        source: item.id && !String(item.id).startsWith('default-') ? 'custom' : 'default',
        title: item.title,
        meta: `${item.date || '오늘'} / ${item.mood || '꿈 기록'}`,
        summary: item.text || '',
        image: item.image,
        deleted: deletedDreams.has(id),
      };
    });

    return [...longItems, ...shortItems, ...anecdoteItems, ...dreamItems];
  }

  function renderAdminList() {
    recordList.innerHTML = collectAdminItems().map((item) => `
      <article class="admin-record ${item.deleted ? 'is-deleted' : ''}">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />` : '<div class="admin-record-placeholder">TEXT</div>'}
        <div>
          <span>${escapeHtml(item.typeLabel)} / ${escapeHtml(item.source)} / ${escapeHtml(item.meta)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.summary)}</p>
        </div>
        <button type="button" data-delete-type="${escapeHtml(item.type)}" data-delete-id="${escapeHtml(item.id)}">
          ${item.deleted ? '삭제됨' : '삭제'}
        </button>
      </article>
    `).join('');
  }

  function unlock() {
    sessionStorage.setItem('red-window.admin', 'open');
    gate.classList.add('is-hidden');
    workspace.classList.remove('is-hidden');
    updateFormMode();
    renderAdminList();
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = document.querySelector('#admin-password').value;
    if (password === ADMIN_PASSWORD) {
      unlock();
    } else {
      loginMessage.textContent = '비밀번호가 맞지 않습니다. 창문은 열리지 않았습니다.';
    }
  });

  contentType.addEventListener('change', updateFormMode);

  recordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(recordForm);
    const type = form.get('contentType');
    const title = String(form.get('title') || '').trim();
    const bodyText = String(form.get('body') || '').trim();

    if (!title || !bodyText) {
      saveMessage.textContent = '제목과 본문은 반드시 입력해야 합니다.';
      return;
    }

    if (type === 'short') {
      const stories = getCustomShortStories();
      stories.unshift({
        id: makeId('short'),
        title,
        tag: String(form.get('tag') || '짧은 괴담').trim(),
        text: bodyText,
      });
      writeJson(keys.customShortStories, stories);
      saveMessage.textContent = '짧은 괴담 영역에 저장되었습니다.';
    }

    if (type === 'anecdote') {
      const anecdotes = getCustomAnecdotes();
      anecdotes.unshift({
        id: makeId('anecdote'),
        title,
        place: String(form.get('location') || '위치 미상').trim(),
        status: String(form.get('status') || '검토 중').trim(),
        text: bodyText,
      });
      writeJson(keys.customAnecdotes, anecdotes);
      saveMessage.textContent = '실제 일화 영역에 저장되었습니다.';
    }

    if (type === 'dream') {
      const imageFile = form.get('image');
      if (!imageFile || !imageFile.size) {
        saveMessage.textContent = '꿈 기록은 이미지가 필요합니다.';
        return;
      }
      const image = await fileToDataUrl(imageFile);
      const dreams = getCustomDreams();
      dreams.unshift({
        id: makeId('dream'),
        title,
        date: String(form.get('dreamDate') || '오늘').trim(),
        mood: String(form.get('dreamMood') || '꿈 기록').trim(),
        text: bodyText,
        image,
      });
      writeJson(keys.customDreams, dreams);
      saveMessage.textContent = '관리자 꿈 영역에 저장되었습니다.';
    }

    if (type === 'long') {
      const imageFile = form.get('image');
      if (!imageFile || !imageFile.size) {
        saveMessage.textContent = '긴 게시글은 이미지가 필요합니다.';
        return;
      }

      const image = await fileToDataUrl(imageFile);
      const records = getCustomRecords();
      records.unshift({
        id: makeId('custom'),
        contentType: 'long',
        title,
        subtitle: String(form.get('subtitle') || '').trim(),
        category: String(form.get('category') || '미분류').trim(),
        code: String(form.get('code') || `RWA-${Date.now()}`).trim(),
        danger: String(form.get('danger') || 'MEDIUM').trim(),
        discoveredAt: String(form.get('discoveredAt') || '03:33').trim(),
        location: String(form.get('location') || '위치 미상').trim(),
        recovery: String(form.get('recovery') || '0%').trim(),
        summary: String(form.get('summary') || bodyText.slice(0, 120)).trim(),
        body: bodyText.split(/\n+/).map((line) => line.trim()).filter(Boolean),
        image,
      });
      writeJson(keys.customRecords, records);
      saveMessage.textContent = '긴 게시글 영역에 저장되었습니다.';
    }

    recordForm.reset();
    updateFormMode();
    renderAdminList();
  });

  recordList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    if (!button) return;
    const id = button.dataset.deleteId;
    const type = button.dataset.deleteType;

    if (type === 'long') {
      const custom = getCustomRecords();
      const customIndex = custom.findIndex((record) => record.id === id);
      if (customIndex >= 0) {
        custom.splice(customIndex, 1);
        writeJson(keys.customRecords, custom);
      } else {
        const deleted = getDeleted(keys.deletedRecordIds);
        deleted.add(id);
        writeJson(keys.deletedRecordIds, [...deleted]);
      }
    }

    if (type === 'short') {
      const custom = getCustomShortStories();
      const customIndex = custom.findIndex((item) => item.id === id);
      if (customIndex >= 0) {
        custom.splice(customIndex, 1);
        writeJson(keys.customShortStories, custom);
      } else {
        const deleted = getDeleted(keys.deletedShortStoryIds);
        deleted.add(id);
        writeJson(keys.deletedShortStoryIds, [...deleted]);
      }
    }

    if (type === 'anecdote') {
      const custom = getCustomAnecdotes();
      const customIndex = custom.findIndex((item) => item.id === id);
      if (customIndex >= 0) {
        custom.splice(customIndex, 1);
        writeJson(keys.customAnecdotes, custom);
      } else {
        const deleted = getDeleted(keys.deletedAnecdoteIds);
        deleted.add(id);
        writeJson(keys.deletedAnecdoteIds, [...deleted]);
      }
    }

    if (type === 'dream') {
      const custom = getCustomDreams();
      const customIndex = custom.findIndex((item) => item.id === id);
      if (customIndex >= 0) {
        custom.splice(customIndex, 1);
        writeJson(keys.customDreams, custom);
      } else {
        const deleted = getDeleted(keys.deletedDreamIds);
        deleted.add(id);
        writeJson(keys.deletedDreamIds, [...deleted]);
      }
    }

    renderAdminList();
  });

  restoreButton.addEventListener('click', () => {
    localStorage.removeItem(keys.deletedRecordIds);
    localStorage.removeItem(keys.deletedShortStoryIds);
    localStorage.removeItem(keys.deletedAnecdoteIds);
    localStorage.removeItem(keys.deletedDreamIds);
    renderAdminList();
  });

  if (sessionStorage.getItem('red-window.admin') === 'open') {
    unlock();
  } else {
    updateFormMode();
  }

})();
