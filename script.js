(() => {
  'use strict';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const activeMotion = new Set();
  function animateUI(element, frames, duration = 320, delay = 0, fill = 'auto') {
    if (!element || motionPreference.matches || !element.animate) return;
    const animation = element.animate(frames, { duration, delay, fill, easing: 'cubic-bezier(.22,1,.36,1)' });
    activeMotion.add(animation);
    const forget = () => activeMotion.delete(animation);
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
    return animation;
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) [...activeMotion].forEach(animation => animation.finish());
  });
  function bindAnimatedDisclosure(details) {
    const summary = details.querySelector('summary');
    const panel = details.querySelector('.method-answer, .faq-answer');
    let activeAnimation;
    let targetOpen = details.open;
    if (!summary || !panel) return;
    summary.addEventListener('click', event => {
      event.preventDefault();
      targetOpen = !targetOpen;
      const shouldOpen = targetOpen;
      const currentHeight = details.open ? panel.getBoundingClientRect().height : 0;
      const currentOpacity = details.open
        ? (Number.parseFloat(getComputedStyle(panel).opacity) || 0)
        : 0;
      if (activeAnimation) activeAnimation.cancel();
      activeAnimation = null;
      if (motionPreference.matches || !panel.animate) {
        details.open = shouldOpen;
        cleanPanel();
        return;
      }
      details.open = true;
      panel.style.height = `${currentHeight}px`;
      panel.style.overflow = 'hidden';
      panel.style.opacity = String(currentOpacity);
      const animatePanel = (from, to, finish) => {
        const animation = animateUI(panel, [from, to], 360, 0, 'both');
        if (!animation) { finish(); cleanPanel(); return; }
        activeAnimation = animation;
        animation.finished.then(() => {
          if (activeAnimation !== animation) return;
          activeAnimation = null;
          finish();
          cleanPanel();
          animation.cancel();
        }).catch(() => {});
      };
      if (shouldOpen) {
        const targetHeight = panel.scrollHeight;
        animatePanel({ height: `${currentHeight}px`, opacity: currentOpacity }, { height: `${targetHeight}px`, opacity: 1 }, () => {});
      } else {
        animatePanel({ height: `${currentHeight}px`, opacity: currentOpacity }, { height: '0px', opacity: 0 }, () => {
          details.open = false;
        });
      }
    });

    function cleanPanel() {
      panel.style.height = '';
      panel.style.overflow = '';
      panel.style.opacity = '';
    }
  }
  document.querySelectorAll('.method-list details, .faq-item').forEach(bindAnimatedDisclosure);
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
    navigation.classList.remove('is-open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navigation.classList.toggle('is-open', open);
    if (open) animateUI(navigation, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], 240);
  });
  document.addEventListener('pointerdown', event => {
    if (menu.getAttribute('aria-expanded') === 'true' && !navigation.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);

  // Keep all course content available when scripting is unavailable.
  const explorer = document.querySelector('.course-explorer');
  const courseTabs = [...explorer.querySelectorAll('[role="tab"]')];
  const coursePanels = [...explorer.querySelectorAll('.course-card')];
  let courseAnimation;
  function selectCourse(index, moveFocus = false) {
    const changed = courseTabs[index].getAttribute('aria-selected') !== 'true';
    if (changed) courseAnimation?.cancel();
    courseTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      coursePanels[i].hidden = i !== index;
    });
    if (changed && explorer.classList.contains('is-interactive')) {
      courseAnimation = animateUI(coursePanels[index], [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' }
      ], 220);
    }
    if (moveFocus) courseTabs[index].focus();
  }
  coursePanels.forEach((panel, i) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', courseTabs[i].id);
    panel.tabIndex = 0;
  });
  courseTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectCourse(i));
    tab.addEventListener('keydown', event => {
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (i + 1) % courseTabs.length;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (i + courseTabs.length - 1) % courseTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = courseTabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectCourse(next, true); }
    });
  });
  explorer.classList.add('is-interactive');
  explorer.querySelector('.course-tabs').hidden = false;
  selectCourse(0);

  // Give important content a small entrance as it scrolls into view.
  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    const motionTargets = document.querySelectorAll(
      '.courses-section .section-heading, .course-explorer, .course-outcomes, ' +
      '.community-section .section-heading, .photo-grid figure, .method-heading, ' +
      '.robot-logic, .method-list details, .faq-heading, .faq-item, .experience-grid > *'
    );
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const index = [...motionTargets].indexOf(entry.target);
        animateUI(entry.target, [
          { opacity: 0, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], 460, Math.min(index % 4, 3) * 45);
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    motionTargets.forEach(item => {
      item.classList.add('scroll-motion-item');
      revealObserver.observe(item);
    });
  }

  // A small, local block-programming exercise: no data leaves the page.
  const programList = document.querySelector('#robot-program');
  const robotBoard = document.querySelector('#robot-board');
  const robotSprite = document.querySelector('#robot-sprite');
  const goalConfetti = document.querySelector('#goal-confetti');
  const result = document.querySelector('#sensor-result');
  const runButton = document.querySelector('#run-program');
  const resetButton = document.querySelector('#reset-program');
  const blockNames = { forward: 'Avanzar una casilla', left: 'Girar a la izquierda', right: 'Girar a la derecha', sensor: 'Si hay obstáculo, parar' };
  const boardColumns = 6;
  const boardRows = 5;
  const start = { x: 0, y: 2, direction: 0 };
  const obstacle = { x: 3, y: 2 };
  const goal = { x: 5, y: 2 };
  const program = [];
  let robot = { ...start };
  let runningProgram = false;
  let confettiTimer;
  function paintRobot() {
    robotSprite.style.setProperty('--robot-col', robot.x);
    robotSprite.style.setProperty('--robot-row', robot.y);
    robotSprite.style.setProperty('--robot-angle', `${90 + robot.direction * 90}deg`);
  }
  function renderProgram() {
    runButton.disabled = runningProgram || program.length === 0;
    programList.replaceChildren();
    if (!program.length) {
      const empty = document.createElement('li');
      empty.className = 'program-empty';
      empty.textContent = 'Añade un bloque para empezar.';
      programList.append(empty);
      return;
    }
    program.forEach((type, index) => {
      const row = document.createElement('li');
      row.dataset.block = type;
      const label = document.createElement('span');
      label.className = 'program-step';
      label.textContent = blockNames[type];
      row.append(label);
      [['↑', 'Subir bloque'], ['↓', 'Bajar bloque'], ['×', 'Quitar bloque']].forEach(([symbol, action], actionIndex) => {
        const control = document.createElement('button');
        control.type = 'button';
        control.className = 'program-control';
        control.textContent = symbol;
        control.setAttribute('aria-label', `${action}: ${blockNames[type]}`);
        control.disabled = runningProgram || (actionIndex === 0 && index === 0) || (actionIndex === 1 && index === program.length - 1);
        control.addEventListener('click', () => {
          const nextIndex = actionIndex === 0 ? index - 1 : actionIndex === 1 ? index + 1 : Math.min(index, program.length - 2);
          if (actionIndex === 0) [program[index - 1], program[index]] = [program[index], program[index - 1]];
          else if (actionIndex === 1) [program[index], program[index + 1]] = [program[index + 1], program[index]];
          else program.splice(index, 1);
          renderProgram();
          if (program.length) {
            animateProgramStep(nextIndex, [
              { opacity: .55, transform: `translateY(${actionIndex === 0 ? 8 : -8}px)` },
              { opacity: 1, transform: 'none' }
            ], 260);
          }
          (programList.children[nextIndex]?.querySelector('.program-control:not(:disabled)') || document.querySelector('.add-block'))?.focus();
        });
        row.append(control);
      });
      programList.append(row);
    });
  }
  function animateProgramStep(index, frames, duration = 260) {
    const row = programList.children[index];
    const bounds = row?.getBoundingClientRect();
    const listBounds = programList.getBoundingClientRect();
    const headerBottom = document.querySelector('.header').getBoundingClientRect().bottom;
    if (!bounds || document.hidden || bounds.bottom < Math.max(headerBottom, listBounds.top) || bounds.top > Math.min(innerHeight, listBounds.bottom)) return;
    animateUI(row, frames, duration);
  }
  document.querySelectorAll('.add-block').forEach(button => button.addEventListener('click', () => {
    if (runningProgram) return;
    program.push(button.dataset.block);
    renderProgram();
    animateProgramStep(program.length - 1, [
      { opacity: 0, transform: 'translateY(-10px) scale(.96)' },
      { opacity: 1, transform: 'none' }
    ], 300);
    result.textContent = `${blockNames[button.dataset.block]} añadido al programa.`;
  }));
  function setEditorDisabled(disabled) {
    document.querySelectorAll('.add-block').forEach(button => { button.disabled = disabled; });
    runButton.disabled = disabled || program.length === 0;
    resetButton.disabled = disabled;
    renderProgram();
  }
  function nextCell() {
    const delta = [[1, 0], [0, 1], [-1, 0], [0, -1]][robot.direction];
    return { x: robot.x + delta[0], y: robot.y + delta[1] };
  }
  function visibleBoardFraction() {
    const bounds = robotBoard.getBoundingClientRect();
    const headerBottom = document.querySelector('.header').getBoundingClientRect().bottom;
    const visible = Math.max(0, Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, headerBottom));
    return visible / bounds.height;
  }
  function celebrateGoal() {
    if (motionPreference.matches || document.hidden || visibleBoardFraction() < .5) return;
    const offsets = [[-65, -60], [-42, -85], [-18, -55], [12, -90], [38, -58], [55, -27], [-75, -15], [-48, 8], [-20, 25], [8, 15], [35, 33], [65, 8]];
    goalConfetti.replaceChildren();
    offsets.forEach(([x, y], index) => {
      const piece = document.createElement('span');
      piece.style.setProperty('--dx', `${x}px`);
      piece.style.setProperty('--dy', `${y}px`);
      piece.style.setProperty('--spin', `${index % 2 ? -260 : 260}deg`);
      goalConfetti.append(piece);
    });
    clearTimeout(confettiTimer);
    confettiTimer = setTimeout(() => goalConfetti.replaceChildren(), 1000);
  }
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  runButton.addEventListener('click', async () => {
    if (runningProgram || !program.length) return;
    runningProgram = true;
    robotBoard.classList.remove('is-complete');
    goalConfetti.replaceChildren();
    setEditorDisabled(true);
    if (visibleBoardFraction() < .7) {
      robotBoard.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth', block: 'center' });
      await wait(motionPreference.matches ? 0 : 360);
    }
    result.textContent = 'El robot está ejecutando el programa.';
    let sensorEnabled = false;
    let stopped = false;
    let reachedGoal = false;
    for (let index = 0; index < program.length; index++) {
      const row = programList.children[index];
      row?.setAttribute('aria-current', 'step');
      animateProgramStep(index, [
        { filter: 'brightness(1)', transform: 'scale(1)' },
        { filter: 'brightness(1.25)', transform: 'scale(1.025)' },
        { filter: 'brightness(1)', transform: 'scale(1)' }
      ], 360);
      const type = program[index];
      if (type === 'sensor') {
        sensorEnabled = true;
        const next = nextCell();
        if (next.x === obstacle.x && next.y === obstacle.y) {
          result.textContent = 'Sensor activado: hay un obstáculo. El robot se detiene.';
          stopped = true;
        } else result.textContent = 'Sensor activado: el camino está libre.';
      } else if (type === 'left') {
        robot.direction = (robot.direction + 3) % 4;
        paintRobot();
      } else if (type === 'right') {
        robot.direction = (robot.direction + 1) % 4;
        paintRobot();
      } else {
        const next = nextCell();
        if (next.x < 0 || next.x >= boardColumns || next.y < 0 || next.y >= boardRows) {
          result.textContent = 'El borde del tablero detuvo el robot. Prueba otra secuencia.';
          stopped = true;
        } else if (next.x === obstacle.x && next.y === obstacle.y) {
          result.textContent = sensorEnabled ? 'Sensor activado: hay un obstáculo. El robot se detiene.' : 'El robot encontró un obstáculo y se detuvo.';
          stopped = true;
        } else {
          reachedGoal = next.x === goal.x && next.y === goal.y;
          if (reachedGoal) robotBoard.classList.add('is-complete');
          robot = { ...robot, ...next };
          paintRobot();
          if (reachedGoal) {
            result.textContent = '¡Llegaste a la meta! El robot completó el recorrido.';
            stopped = true;
          }
        }
      }
      await wait(motionPreference.matches ? 0 : 430);
      row?.removeAttribute('aria-current');
      if (reachedGoal) celebrateGoal();
      if (stopped) break;
    }
    if (!stopped) result.textContent = 'Programa terminado. Puedes cambiar los bloques y volver a probar.';
    runningProgram = false;
    setEditorDisabled(false);
  });
  resetButton.addEventListener('click', () => {
    if (runningProgram) return;
    program.length = 0;
    robot = { ...start };
    robotBoard.classList.remove('is-complete');
    clearTimeout(confettiTimer);
    goalConfetti.replaceChildren();
    paintRobot();
    result.textContent = 'Tablero y programa reiniciados.';
    renderProgram();
    runButton.disabled = true;
  });
  paintRobot();
  runButton.disabled = true;

  // The PlayCanvas scene starts automatically; the image remains visible during loading.
  const robotStatus = document.querySelector('.robot-status');
  const robotLoading = document.querySelector('.robot-progress');
  robotLoading.hidden = false;
  robotStatus.textContent = 'Cargando el modelo 3D del robot.';
  import('./robot-viewer.js').then(({ createRobotViewer }) => createRobotViewer()).then(() => {
    robotStatus.textContent = 'Robot de ruedas con sensores y circuitos. Puede explorarlo con los botones de giro o arrastrándolo.';
  }).catch(() => {
    robotLoading.hidden = true;
    document.querySelector('#robot-scene').classList.remove('scene-ready');
    robotStatus.textContent = 'Vista estática de un robot de ruedas con sensores y circuitos. La vista 3D no está disponible.';
  });


  // Contact options; this static page does not collect booking details.
  const openBooking = document.getElementById('open-booking');
  const bookingModal = document.getElementById('booking-modal');
  if (openBooking && bookingModal) {
    let returnFocus;
    let previousOverflow;
    let closing = false;
    const background = [...document.body.children].filter(element => element !== bookingModal && element.tagName !== 'SCRIPT');
    let previousInert;
    const closeButton = bookingModal.querySelector('.modal-close');
    const showModal = () => {
      returnFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      previousInert = background.map(element => element.inert);
      background.forEach(element => { element.inert = true; });
      bookingModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
      animateUI(bookingModal.querySelector('.modal-panel'), [{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], 280);
    };
    const hideModal = async () => {
      if (closing || bookingModal.getAttribute('aria-hidden') === 'true') return;
      closing = true;
      const animation = animateUI(bookingModal.querySelector('.modal-panel'), [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(10px) scale(.98)' }
      ], 180);
      if (animation) await animation.finished.catch(() => {});
      bookingModal.setAttribute('aria-hidden', 'true');
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
      closing = false;
    };
    openBooking.addEventListener('click', showModal);
    bookingModal.addEventListener('click', e => { if (e.target && e.target.dataset && e.target.dataset.close) hideModal(); });
    closeButton.addEventListener('click', hideModal);
    bookingModal.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); hideModal(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...bookingModal.querySelectorAll('a[href], button:not([disabled])')];
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  const openCookies = document.querySelector('#open-cookies');
  const cookiesDialog = document.querySelector('#cookies-dialog');
  if (openCookies && cookiesDialog) {
    let closing = false;
    const closeCookies = async () => {
      if (closing || !cookiesDialog.open) return;
      closing = true;
      const animation = animateUI(cookiesDialog, [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(8px)' }
      ], 180);
      if (animation) await animation.finished.catch(() => {});
      cookiesDialog.close();
      closing = false;
    };
    openCookies.addEventListener('click', () => {
      cookiesDialog.showModal();
      cookiesDialog.querySelector('#close-cookies').focus();
      animateUI(cookiesDialog, [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'none' }
      ], 240);
    });
    cookiesDialog.querySelector('#close-cookies').addEventListener('click', closeCookies);
    cookiesDialog.addEventListener('cancel', event => { event.preventDefault(); closeCookies(); });
    cookiesDialog.addEventListener('close', () => openCookies.focus());
  }
})();
