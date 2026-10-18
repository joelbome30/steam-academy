(() => {
  'use strict';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const activeMotion = new Set();
  function animateUI(element, frames, duration = 320, delay = 0) {
    if (!element || motionPreference.matches || !element.animate) return;
    const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)' });
    activeMotion.add(animation);
    const forget = () => activeMotion.delete(animation);
    animation.addEventListener('finish', forget, { once: true });
    animation.addEventListener('cancel', forget, { once: true });
    return animation;
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) [...activeMotion].forEach(animation => animation.finish());
  });
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
  function selectCourse(index, moveFocus = false) {
    const changed = courseTabs[index].getAttribute('aria-selected') !== 'true';
    courseTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      coursePanels[i].hidden = i !== index;
    });
    if (changed && !moveFocus) {
      coursePanels[index].getAnimations().forEach(animation => animation.cancel());
      animateUI(coursePanels[index], [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }]);
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

  // A small, local block-programming exercise: no data leaves the page.
  const programList = document.querySelector('#robot-program');
  const robotSprite = document.querySelector('#robot-sprite');
  const result = document.querySelector('#sensor-result');
  const runButton = document.querySelector('#run-program');
  const resetButton = document.querySelector('#reset-program');
  const blockNames = { forward: 'Avanzar una casilla', left: 'Girar a la izquierda', right: 'Girar a la derecha', sensor: 'Si hay obstáculo, parar' };
  const program = [];
  let robot = { x: 0, y: 2, direction: 0 };
  let runningProgram = false;
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
          if (actionIndex === 0) [program[index - 1], program[index]] = [program[index], program[index - 1]];
          else if (actionIndex === 1) [program[index], program[index + 1]] = [program[index + 1], program[index]];
          else program.splice(index, 1);
          renderProgram();
        });
        row.append(control);
      });
      programList.append(row);
    });
  }
  document.querySelectorAll('.add-block').forEach(button => button.addEventListener('click', () => {
    if (runningProgram) return;
    program.push(button.dataset.block);
    renderProgram();
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
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  runButton.addEventListener('click', async () => {
    if (runningProgram || !program.length) return;
    runningProgram = true;
    setEditorDisabled(true);
    result.textContent = 'El robot está ejecutando el programa.';
    let sensorEnabled = false;
    let stopped = false;
    for (let index = 0; index < program.length; index++) {
      const row = programList.children[index];
      row?.setAttribute('aria-current', 'step');
      const type = program[index];
      if (type === 'sensor') {
        sensorEnabled = true;
        const next = nextCell();
        if (next.x === 4 && next.y === 2) {
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
        if (next.x < 0 || next.x > 6 || next.y < 0 || next.y > 3) {
          result.textContent = 'El borde del tablero detuvo el robot. Prueba otra secuencia.';
          stopped = true;
        } else if (next.x === 4 && next.y === 2) {
          result.textContent = sensorEnabled ? 'Sensor activado: hay un obstáculo. El robot se detiene.' : 'El robot encontró un obstáculo y se detuvo.';
          stopped = true;
        } else {
          robot = { ...robot, ...next };
          paintRobot();
          if (robot.x === 6 && robot.y === 2) {
            result.textContent = '¡Llegaste a la meta! El robot completó el recorrido.';
            stopped = true;
          }
        }
      }
      await wait(motionPreference.matches ? 0 : 430);
      row?.removeAttribute('aria-current');
      if (stopped) break;
    }
    if (!stopped) result.textContent = 'Programa terminado. Puedes cambiar los bloques y volver a probar.';
    runningProgram = false;
    setEditorDisabled(false);
  });
  resetButton.addEventListener('click', () => {
    if (runningProgram) return;
    program.length = 0;
    robot = { x: 0, y: 2, direction: 0 };
    paintRobot();
    result.textContent = 'Tablero y programa reiniciados.';
    renderProgram();
    runButton.disabled = true;
  });
  paintRobot();
  runButton.disabled = true;

  // Native disclosure semantics stay intact; animate both directions and allow reversal.
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation;
    let expanded = details.open;
    summary.addEventListener('click', event => {
      if (motionPreference.matches || !details.animate) return;
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      expanded = animation ? !expanded : !details.open;
      if (animation) { animation.onfinish = null; animation.cancel(); }
      details.style.height = '';
      details.open = expanded;
      const end = details.getBoundingClientRect().height;
      details.open = true;
      details.classList.toggle('is-collapsing', !expanded);
      details.style.overflow = 'clip';
      animation = animateUI(details, [{ height: `${start}px` }, { height: `${end}px` }], 300);
      animation.onfinish = () => {
        details.open = expanded;
        details.style.overflow = '';
        details.classList.remove('is-collapsing');
        animation = null;
      };
    });
  });

  // Measure the usable viewport, excluding the sticky header. Tall elements
  // need only fill part of that viewport, rather than fit completely inside it.
  if ('IntersectionObserver' in window) {
    const targets = [...document.querySelectorAll('.photo-grid figure, .section-heading h2, .method-heading h2, .experience-section h2, .course-tabs, .method-list details, .steps li, .robot-logic')];
    const played = new WeakSet();
    const running = new Map();
    let observer;
    let resizeTimer;
    function observeEntrances() {
      observer?.disconnect();
      const header = document.querySelector('.header').getBoundingClientRect().height;
      const height = window.visualViewport?.height || innerHeight;
      const bottom = Math.round(height * .08);
      const usable = Math.max(1, height - header - bottom);
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const element = entry.target;
          const visible = entry.isIntersecting && entry.intersectionRect.height > 0;
          const current = running.get(element);
          if (current) {
            if (!visible || document.hidden) current.pause();
            else if (current.playState === 'paused') current.play();
            return;
          }
          if (played.has(element) || motionPreference.matches || document.hidden) return;
          const required = Math.min(entry.boundingClientRect.height * .55, usable * .32);
          if (!visible || entry.intersectionRect.height < required) return;
          played.add(element);
          const picture = element.matches('figure');
          const row = element.matches('details, li');
          const compact = innerWidth < 600;
          const frames = picture ? [
            { opacity: .15, clipPath: 'inset(16% 0 0 0)', transform: `translateY(${compact ? 28 : 48}px) scale(.94)` },
            { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'none' }
          ] : [
            { opacity: 0, transform: row ? 'translateX(-24px)' : `translateY(${compact ? 28 : 44}px)` },
            { opacity: 1, transform: 'none' }
          ];
          const animation = animateUI(element, frames, picture ? 1100 : row ? 650 : 850);
          if (!animation) return;
          running.set(element, animation);
          const finish = () => { running.delete(element); observer.unobserve(element); };
          animation.addEventListener('finish', finish, { once: true });
          animation.addEventListener('cancel', finish, { once: true });
        });
      }, { rootMargin: `-${header}px 0px -${bottom}px 0px`, threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
      targets.forEach(element => { if (!played.has(element) || running.has(element)) observer.observe(element); });
    }
    observeEntrances();
    const resize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(observeEntrances, 120); };
    window.addEventListener('resize', resize, { passive: true });
    window.visualViewport?.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running.forEach(animation => animation.pause());
      else observeEntrances();
    });
    motionPreference.addEventListener('change', observeEntrances);
  }

  // The decorative scene starts automatically; the image stays visible while loading.
  const robotStatus = document.querySelector('.robot-status');
  import('./vendor/three.module.js').then(createScene).then(() => {
    robotStatus.textContent = 'Robot de ruedas con sensores y circuitos. Puede explorarlo con los botones de giro o arrastrándolo.';
  }).catch(() => {
    document.querySelector('#robot-scene').classList.remove('scene-ready');
    robotStatus.textContent = 'Vista estática de un robot de ruedas con sensores y circuitos. La vista 3D no está disponible.';
  });

  async function createScene(THREE) {
    const host = document.querySelector('#robot-scene');
    const canvas = document.querySelector('#robot-canvas');
    canvas.style.touchAction = 'pan-y';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const camera = new THREE.PerspectiveCamera(37, 1, .1, 50);
    camera.position.set(0, 1.1, 5.7);
    camera.lookAt(0, .12, 0);

    // Studio lighting is built locally; no remote environment maps are needed.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x333a2c);
    const panels = [
      { position: [-4, 5, 3], size: [4, 8, 1], color: 0xffffff },
      { position: [5, 2, 1], size: [2, 8, 2], color: 0xd3ffa2 },
      { position: [0, 5, -4], size: [6, 2, 1], color: 0xf6f3e5 },
      { position: [0, -4, 2], size: [4, 1, 3], color: 0x36472a }
    ];
    for (const item of panels) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(...item.size), new THREE.MeshBasicMaterial({ color: item.color }));
      panel.position.set(...item.position);
      studio.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio, .04);
    scene.environment = environment.texture;
    studio.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xf4ffe5, 0x26361b, 2));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 6, 7); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9ad8ff, 3);
    rim.position.set(4, 1, -3); scene.add(rim);

    const robot = new THREE.Group();
    robot.rotation.set(.06, 0, -.05);
    scene.add(robot);

    const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
    const loader = new GLTFLoader();
    const progressCircle = host.querySelector('.robot-progress-circle');
    const progressText = host.querySelector('.robot-progress-text');
    function setProgress(p) {
      const pct = Math.max(0, Math.min(100, Math.round(p || 0)));
      if (progressCircle) progressCircle.setAttribute('stroke-dashoffset', String(100 - pct));
      if (progressText) progressText.textContent = `Cargando ${pct}%`;
    }
    function loadModel(url) {
      return new Promise((resolve, reject) => {
        loader.load(url, gltf => resolve(gltf), xhr => {
          if (xhr && xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setProgress(percent);
          }
        }, err => reject(err));
      });
    }
    try {
      const gltf = await loadModel('./model/robot.glb');
      const model = gltf.scene;
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            // Softer reflections keep the chassis readable against the dark background.
            if ('roughness' in material) material.roughness = Math.max(material.roughness, .24);
            if (/acrilico/i.test(material.name)) {
              material.opacity = .68;
              material.depthWrite = false;
            }
          }
        }
      });
      model.rotation.set(0, Math.PI * -0.06, 0);
      model.position.set(0.04, -0.2, 0.1);
      model.scale.setScalar(14.65);
      robot.add(model);
      setProgress(100);
      host.classList.add('scene-ready');
    } catch (error) {
      console.warn('No se pudo cargar el robot GLB; se muestra la imagen de respaldo.', error);
      host.querySelector('.robot-progress')?.remove();
      environment.texture.dispose();
      renderer.dispose();
      throw error;
    }

    let frame = 0, visible = true, lost = false, last = 0, elapsed = 0, paused = false;
    const pauseButton = document.querySelector('#robot-pause');
    const motionEnabled = () => !paused && !reduced.matches;
    const drag = {
      active: false,
      lastX: 0,
      lastY: 0,
      yaw: 0,
      pitch: .06,
      pointerId: null
    };
    function render(time) {
      if (lost) return;
      const dt = Math.min((time - last) / 1000 || 0, .05); last = time;
      if (motionEnabled()) elapsed += dt;
      const t = elapsed;
      const idleY = Math.sin(t * .65) * .035;
      robot.position.y = idleY;
      if (!drag.active) {
        robot.rotation.y = drag.yaw + Math.sin(t * .35) * .16;
        robot.rotation.x = drag.pitch + Math.cos(t * .4) * .02;
        robot.rotation.z = -.10 + Math.sin(t * .5) * .015;
      } else {
        robot.rotation.y = drag.yaw;
        robot.rotation.x = drag.pitch;
        robot.rotation.z = -.10;
      }
      renderer.render(scene, camera);
    }
    function tick(time) {
      if (time - last >= 32) render(time);
      frame = requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);
      pauseButton.disabled = reduced.matches;
      pauseButton.textContent = reduced.matches ? 'Movimiento reducido' : paused ? 'Reanudar movimiento' : 'Pausar movimiento';
      last = performance.now();
      if (!document.hidden && visible && !lost) {
        render(last);
        if (motionEnabled()) frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      const width = host.clientWidth, height = Math.max(1, host.clientHeight - 48);
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Fit the model to both axes when the viewport is tall or short.
      camera.position.z = Math.max(4.9, 5.7 / camera.aspect);
      camera.lookAt(0, .12, 0);
      camera.updateProjectionMatrix();
      render(performance.now());
    }
    const startDrag = event => {
      drag.active = true;
      drag.pointerId = event.pointerId ?? 'pointer';
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const moveDrag = event => {
      if (!drag.active) return;
      if (typeof drag.pointerId === 'number' && typeof event.pointerId === 'number' && event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.yaw += dx * 0.008;
      drag.pitch += dy * 0.006;
      drag.pitch = Math.max(-1.1, Math.min(1.1, drag.pitch));
      if (!motionEnabled()) render(performance.now());
      if (event.pointerType !== 'touch') event.preventDefault();
    };
    const stopDrag = event => {
      if (event && typeof event.pointerId === 'number' && typeof drag.pointerId === 'number' && event.pointerId !== drag.pointerId) return;
      drag.active = false;
      drag.pointerId = null;
    };
    canvas.addEventListener('pointerdown', startDrag);
    canvas.addEventListener('pointermove', moveDrag, { passive: false });
    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
    canvas.addEventListener('pointerleave', stopDrag);
    pauseButton.addEventListener('click', () => { paused = !paused; update(); });
    for (const [selector, direction] of [['#robot-left', -1], ['#robot-right', 1]]) {
      document.querySelector(selector).addEventListener('click', () => {
        drag.yaw += direction * Math.PI / 8;
        render(performance.now());
      });
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    new ResizeObserver(resize).observe(host);
    const io = new IntersectionObserver(entries => {
      visible = entries.some(e => e.isIntersecting);
      update();
    }, { root: null, rootMargin: '200px', threshold: 0.01 });
    io.observe(host);
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); lost = true; cancelAnimationFrame(frame); host.classList.remove('scene-ready');
    });
    canvas.addEventListener('webglcontextrestored', () => { lost = false; host.classList.add('scene-ready'); resize(); update(); });
    resize(); update();
  }

  // Contact options; this static page does not collect booking details.
  const openBooking = document.getElementById('open-booking');
  const bookingModal = document.getElementById('booking-modal');
  if (openBooking && bookingModal) {
    let returnFocus;
    let previousOverflow;
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
    const hideModal = () => {
      bookingModal.setAttribute('aria-hidden', 'true');
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
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
})();
