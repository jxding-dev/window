(function () {
  const messages = [
    '허가되지 않은 주소에서 접속했습니다',
    '이 페이지는 공개 목록에 존재하지 않습니다',
    '돌아가기 요청이 보류되었습니다',
    '접속 금지 프로토콜이 무시되었습니다',
    '지금 읽은 문단은 아직 게시되지 않았습니다',
    '방금 열린 사진이 현재 방의 밝기와 일치합니다',
    '방문자의 체온이 문서 하단에 저장되었습니다',
    '이 페이지는 닫힌 뒤에도 마지막 위치를 기억합니다',
    '목록 밖의 게시글 하나가 응답했습니다',
    '뒤쪽 창문에서 같은 화면이 한 박자 늦게 열렸습니다',
    '당신이 멈춘 문장만 붉게 복원됩니다',
  ];

  const whispers = [
    'look left',
    'do not answer',
    'same room detected',
    'reader copied',
    'window behind you',
    '03:33:33',
  ];

  const body = document.body;
  const root = document.documentElement;

  function createLayer(className, id) {
    const existing = document.querySelector(`#${id}`);
    if (existing) return existing;
    const layer = document.createElement('div');
    layer.className = className;
    layer.id = id;
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    return layer;
  }

  const toastStack = createLayer('fear-toast-stack', 'fear-toast-stack');
  const monitor = createLayer('reading-monitor', 'reading-monitor');
  const breach = createLayer('forbidden-breach', 'forbidden-breach');
  const threatRail = createLayer('threat-rail', 'threat-rail');

  monitor.innerHTML = `
    <span>READING TRACE</span>
    <strong id="reading-room">top</strong>
    <i id="reading-pulse"></i>
  `;
  breach.innerHTML = `
    <div>
      <span>ACCESS SHOULD NOT EXIST</span>
      <strong>접속 금지 구역에 들어왔습니다</strong>
      <p>이 보관소는 방문자를 받지 않습니다. 이미 열린 창은 닫히기 전까지 열람 기록을 계속 남깁니다.</p>
    </div>
  `;
  threatRail.innerHTML = `
    <span>UNAUTHORIZED READER</span>
    <span>EXIT REQUEST DELAYED</span>
    <span>THE SITE HAS YOUR POSITION</span>
    <span>DO NOT REFRESH AT 03:33</span>
  `;

  function isTyping() {
    return document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
  }

  let lastToastAt = 0;
  function pushToast(message) {
    if (isTyping()) return;
    const now = Date.now();
    if (now - lastToastAt < 5200) return;
    lastToastAt = now;
    const toast = document.createElement('div');
    toast.className = 'fear-toast';
    toast.innerHTML = `<span>UNREGISTERED WARNING</span><strong>${message}</strong>`;
    toastStack.prepend(toast);
    window.setTimeout(() => toast.remove(), 2600);
    [...toastStack.children].slice(2).forEach((item) => item.remove());
  }

  function pulseClass(className, duration) {
    body.classList.add(className);
    window.setTimeout(() => body.classList.remove(className), duration);
  }

  let lastSection = '';
  function trackSection() {
    const sections = [...document.querySelectorAll('main section[id]')];
    if (!sections.length || isTyping()) return;
    const active = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.38 && rect.bottom > window.innerHeight * 0.38;
    });
    if (!active || active.id === lastSection) return;
    lastSection = active.id;
    body.dataset.currentRoom = active.id;
    const room = document.querySelector('#reading-room');
    if (room) room.textContent = active.id;
    if (active.id === 'archive') pushToast('긴 게시글 구역에 들어왔습니다. 목록이 당신을 선택합니다');
  }

  document.addEventListener('click', (event) => {
    if (isTyping()) return;
    const target = event.target.closest('a, button, .story-card, .quick-card, .anecdote-card');
    if (!target) return;
    pulseClass('is-click-echo', 340);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      pushToast('돌아오는 시간이 기록보다 늦습니다');
    }
  });

  window.setTimeout(() => {
    pulseClass('is-first-breach', 1800);
    pushToast('첫 열람자가 아직 나가지 않았습니다');
  }, 700);
})();
