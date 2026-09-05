(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
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

  // Navigation and all page content work independently of the decorative scene.
  import('./vendor/three.module.js').then(createScene).catch(() => {
    document.querySelector('#robot-scene').classList.remove('scene-ready');
  });

  async function createScene(THREE) {
    const host = document.querySelector('#robot-scene');
    const canvas = document.querySelector('#robot-canvas');
    host.style.touchAction = 'none';
    host.style.userSelect = 'none';
    canvas.style.touchAction = 'none';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const camera = new THREE.PerspectiveCamera(37, 1, .1, 50);
    camera.position.set(0, .15, 7.9);
    camera.lookAt(0, .05, 0);

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
    const rim = new THREE.DirectionalLight(0xbefe7e, 3);
    rim.position.set(4, 1, -3); scene.add(rim);

    const lime = new THREE.MeshBasicMaterial({ color: 0xc5f277, toneMapped: false });
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xc5f277, metalness: .55, roughness: .25, emissive: 0x5c822c, emissiveIntensity: .35 });
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 22);
    function sphere(parent, material, scale, position) {
      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.scale.set(...scale);
      mesh.position.set(...position);
      parent.add(mesh);
      return mesh;
    }
    const robot = new THREE.Group();
    robot.rotation.set(.06, -.22, -.10);
    scene.add(robot);

    const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('./model/robot.glb');
      const model = gltf.scene;
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
      model.rotation.set(0, Math.PI * 0.12, 0);
      model.position.set(0, -0.3, 0.1);
      model.scale.setScalar(15.35);
      robot.add(model);
    } catch (error) {
      console.warn('No se pudo cargar el robot GLB.', error);
    }

    const orbits = new THREE.Group();
    orbits.rotation.set(.25, .12, -.35); scene.add(orbits);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.22, .012, 8, 160), ringMaterial);
    orbit.rotation.x = 1.07; orbit.position.y = -.75; orbits.add(orbit);
    const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(2.53, .004, 6, 160), new THREE.MeshBasicMaterial({ color: 0x91ae60, transparent: true, opacity: .28 }));
    orbit2.rotation.set(.25, .9, .25); orbits.add(orbit2);
    const satellite = sphere(orbits, lime, [.085, .085, .085], [2.22, 0, 0]);
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];
    // Seeded positions keep visual checks and the first frame consistent.
    let seed = 17;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 60; i++) positions.push((random() - .5) * 7, (random() - .5) * 6, -1.5 - random() * 2);
    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0xc5f277, size: .018, transparent: true, opacity: .55 }));
    scene.add(particles);

    let frame = 0, visible = true, lost = false, last = 0, elapsed = 0;
    const drag = {
      active: false,
      lastX: 0,
      lastY: 0,
      yaw: -.22,
      pitch: .06,
      pointerId: null
    };
    function render(time) {
      if (lost) return;
      const dt = Math.min((time - last) / 1000 || 0, .05); last = time;
      if (!reduced.matches) elapsed += dt;
      const t = reduced.matches ? 0 : elapsed;
      const idleY = Math.sin(t * 1.3) * .1;
      robot.position.y = idleY;
      if (!drag.active) {
        robot.rotation.y = drag.yaw + Math.sin(t * .7) * .12;
        robot.rotation.x = drag.pitch + Math.cos(t * .8) * .04;
        robot.rotation.z = -.10 + Math.sin(t * 1.1) * .03;
      } else {
        robot.rotation.y = drag.yaw;
        robot.rotation.x = drag.pitch;
        robot.rotation.z = -.10;
      }
      satellite.position.set(2.22 * Math.cos(t * .35), 2.22 * Math.sin(t * .35) * Math.cos(1.07) - .75, 2.22 * Math.sin(t * .35) * Math.sin(1.07));
      orbits.rotation.y = .12 + Math.sin(t * .16) * .15;
      particles.rotation.y = t * .016;
      renderer.render(scene, camera);
    }
    function tick(time) {
      render(time);
      frame = requestAnimationFrame(tick);
    }
    function update() {
      cancelAnimationFrame(frame);
      last = performance.now();
      if (!document.hidden && visible && !lost) {
        render(last);
        if (!reduced.matches) frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < .85 ? 8.5 : 7.9;
      camera.updateProjectionMatrix();
      render(performance.now());
    }
    const startDrag = event => {
      if (reduced.matches) return;
      drag.active = true;
      drag.pointerId = event.pointerId ?? 'pointer';
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
    };
    const moveDrag = event => {
      if (!drag.active || reduced.matches) return;
      if (typeof drag.pointerId === 'number' && typeof event.pointerId === 'number' && event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.yaw += dx * 0.008;
      drag.pitch += dy * 0.006;
      drag.pitch = Math.max(-1.1, Math.min(1.1, drag.pitch));
      event.preventDefault();
    };
    const stopDrag = event => {
      if (event && typeof event.pointerId === 'number' && typeof drag.pointerId === 'number' && event.pointerId !== drag.pointerId) return;
      drag.active = false;
      drag.pointerId = null;
    };
    [host, canvas].forEach(target => {
      target.addEventListener('pointerdown', startDrag);
      target.addEventListener('pointermove', moveDrag, { passive: false });
      target.addEventListener('pointerup', stopDrag);
      target.addEventListener('pointercancel', stopDrag);
      target.addEventListener('pointerleave', stopDrag);
    });
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    new ResizeObserver(resize).observe(host);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(host);
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); lost = true; cancelAnimationFrame(frame); host.classList.remove('scene-ready');
    });
    canvas.addEventListener('webglcontextrestored', () => { lost = false; host.classList.add('scene-ready'); resize(); update(); });
    resize(); host.classList.add('scene-ready'); update();
  }
})();
