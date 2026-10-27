(() => {
  const steps = [
    { target: '.game-heading', message: 'Hi! Let me show you around your Sudoku puzzle.' },
    { target: '#difficulty', message: 'Pick Easy, Medium, or Hard, then start a fresh game.' },
    { target: '#board', message: 'This is your 9 by 9 board. Tap any empty square to select it.' },
    { target: '.number-pad', message: 'Choose a number here, or press 1 through 9 on your keyboard.' },
    { target: '#notes', message: 'Turn on Notes to pencil in possible numbers.' },
    { target: '#erase', message: 'Made a mistake? Erase the selected square.' },
    { target: '#hint', message: 'Need a nudge? Hint reveals one correct number.' },
    { target: '#check', message: 'Check highlights wrong entries. You’re ready to play!' }
  ];
  const storageKey = 'sudoku-tour-seen-v1';
  const launch = document.querySelector('#start-tour');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bubble = document.createElement('div');
  bubble.className = 'tour-bubble';
  bubble.setAttribute('role', 'region');
  bubble.setAttribute('aria-label', 'Sudoku guided tour');
  bubble.innerHTML = '<svg class="tour-pointer" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 2 L4 27 L11 20 L17 30 L22 27 L16 17 L27 16 Z" fill="#fff9e9" stroke="#293b40" stroke-width="2" stroke-linejoin="round"/></svg><div class="tour-header"><span>✳ Sudoku Studio</span><button class="tour-close" type="button" aria-label="Skip tour">×</button></div><p class="tour-message"></p><div class="tour-footer"><span class="tour-count"></span><div class="tour-controls"><button class="tour-back" type="button">Back</button><button class="tour-next" type="button">Next</button></div></div>';
  document.body.append(bubble);
  const message = bubble.querySelector('.tour-message');
  const pointer = bubble.querySelector('.tour-pointer');
  const count = bubble.querySelector('.tour-count');
  const back = bubble.querySelector('.tour-back');
  const next = bubble.querySelector('.tour-next');
  let step = -1, typingTimer, advanceTimer, positionFrame, activeTarget;
  function remember() { try { localStorage.setItem(storageKey, 'true'); } catch {} }
  function clearTimers() { clearInterval(typingTimer); clearTimeout(advanceTimer); cancelAnimationFrame(positionFrame); }
  function close() { clearTimers(); activeTarget?.classList.remove('tour-target'); activeTarget = null; step = -1; bubble.classList.remove('visible'); launch.disabled = false; remember(); if (bubble.contains(document.activeElement)) launch.focus({ preventScroll: true }); }
  function position() {
    if (step < 0 || !activeTarget) return;
    const rect = activeTarget.getBoundingClientRect();
    const width = bubble.offsetWidth, height = bubble.offsetHeight;
    const targetX = rect.left + Math.min(rect.width / 2, 50);
    const x = Math.max(12, Math.min(targetX - 25, innerWidth - width - 12));
    const below = rect.bottom + height + 35 < innerHeight;
    const y = below ? rect.bottom + 31 : Math.max(12, rect.top - height - 32);
    bubble.style.transform = `translate3d(${x}px,${y}px,0)`;
    pointer.style.left = `${Math.max(7, Math.min(targetX - x, width - 32))}px`;
    pointer.style.top = below ? '-27px' : `${height - 3}px`;
    pointer.style.transform = below ? '' : 'rotate(180deg)';
    bubble.classList.add('visible');
  }
  function schedulePosition() { cancelAnimationFrame(positionFrame); positionFrame = requestAnimationFrame(position); }
  function show(index) {
    clearTimers(); activeTarget?.classList.remove('tour-target');
    if (index >= steps.length) { close(); return; }
    step = Math.max(0, index); activeTarget = document.querySelector(steps[step].target);
    if (!activeTarget) { close(); return; }
    activeTarget.classList.add('tour-target');
    activeTarget.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
    count.textContent = `${step + 1} / ${steps.length}`;
    back.disabled = step === 0; next.textContent = step === steps.length - 1 ? 'Finish' : 'Next';
    const full = steps[step].message; message.textContent = reduced.matches ? full : '';
    schedulePosition(); setTimeout(schedulePosition, reduced.matches ? 0 : 450);
    if (!reduced.matches) { let i = 0; typingTimer = setInterval(() => { if (document.hidden) return; message.textContent = full.slice(0, ++i); schedulePosition(); if (i >= full.length) clearInterval(typingTimer); }, 20); }
    advanceTimer = setTimeout(() => { if (!document.hidden && step >= 0) show(step + 1); }, Math.max(3600, full.length * 20 + 2000));
  }
  function start() { if (step >= 0) return; launch.disabled = true; remember(); show(0); }
  launch.addEventListener('click', start);
  bubble.querySelector('.tour-close').addEventListener('click', close);
  back.addEventListener('click', () => show(step - 1));
  next.addEventListener('click', () => show(step + 1));
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('scroll', schedulePosition, { passive: true, capture: true });
  window.addEventListener('keydown', event => { if (step < 0) return; if (event.key === 'Escape') { event.preventDefault(); close(); } });
  if (!reduced.matches && !location.hash) {
    let seen = true; try { seen = localStorage.getItem(storageKey) === 'true'; } catch {}
    if (!seen) {
      let interacted = false;
      const cancel = () => { interacted = true; };
      ['pointerdown', 'keydown', 'wheel'].forEach(name => window.addEventListener(name, cancel, { once: true, passive: true }));
      setTimeout(() => { if (!interacted && scrollY < 80 && !document.hidden) start(); }, 1800);
    }
  }
})();
