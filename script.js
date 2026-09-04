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

  function createScene(THREE) {
    const host = document.querySelector('#robot-scene');
    const canvas = document.querySelector('#robot-canvas');
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

    const shell = new THREE.MeshPhysicalMaterial({ color: 0xe6eadb, metalness: .48, roughness: .22, clearcoat: 1, clearcoatRoughness: .16 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0x7b8a69, metalness: .95, roughness: .17 });
    const faceMaterial = new THREE.MeshPhysicalMaterial({ color: 0x081009, metalness: .26, roughness: .22, clearcoat: 1 });
    const lime = new THREE.MeshBasicMaterial({ color: 0xc5f277, toneMapped: false });
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xc5f277, metalness: .55, roughness: .25, emissive: 0x5c822c, emissiveIntensity: .35 });
    const robot = new THREE.Group();
    robot.rotation.set(.06, -.22, -.10);
    scene.add(robot);

    function roundedBox(width, height, depth, radius, material) {
      const shape = new THREE.Shape();
      const x = -width / 2, y = -height / 2;
      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 4, steps: 1, curveSegments: 18
      });
      geometry.translate(0, 0, -depth / 2);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, material);
    }
    const sphereGeometry = new THREE.SphereGeometry(1, 40, 28);
    function sphere(parent, material, scale, position) {
      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.scale.set(...scale); mesh.position.set(...position); parent.add(mesh); return mesh;
    }
    const head = new THREE.Group();
    head.position.y = .66;
    robot.add(head);
    head.add(roundedBox(2.25, 1.5, .8, .43, shell));
    const face = roundedBox(1.98, 1.12, .11, .35, faceMaterial);
    face.position.set(0, -.015, .49); head.add(face);
    const eyes = [];
    for (const x of [-.44, .44]) {
      const eye = sphere(head, lime, [.105, .19, .055], [x, .09, .64]);
      eyes.push(eye);
    }
    const smilePoints = [];
    for (let i = 0; i <= 12; i++) {
      const x = -.21 + i * .035;
      smilePoints.push(new THREE.Vector3(x, -.32 + x * x * 1.3, .652));
    }
    const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints), 24, .022, 8, false), lime);
    head.add(smile);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(.23, .23, .17, 36), chrome);
      ear.rotation.z = Math.PI / 2; ear.position.set(side * 1.23, .04, 0); head.add(ear);
      sphere(head, lime, [.05, .10, .12], [side * 1.32, .04, .02]);
    }
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.028, .04, .42, 20), chrome);
    antenna.position.set(0, .98, -.02); head.add(antenna);
    sphere(head, lime, [.12, .12, .12], [0, 1.21, -.02]);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.24, .31, .26, 36), chrome);
    neck.position.y = -.28; robot.add(neck);
    sphere(robot, shell, [.68, .76, .53], [0, -.99, 0]);
    const chest = new THREE.Mesh(new THREE.TorusGeometry(.15, .025, 12, 40), chrome);
    chest.position.set(0, -.85, .52); robot.add(chest);
    sphere(robot, lime, [.065, .065, .055], [0, -.85, .55]);
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = sphere(robot, shell, [.20, .42, .26], [side * .94, -.88, .02]);
      arm.rotation.z = side * -.25; arms.push(arm);
      sphere(robot, chrome, [.14, .14, .17], [side * .87, -.52, 0]);
      sphere(robot, shell, [.24, .16, .33], [side * .34, -1.72, .12]);
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
    const target = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    function render(time) {
      if (lost) return;
      const dt = Math.min((time - last) / 1000 || 0, .05); last = time;
      if (!reduced.matches) elapsed += dt;
      const t = reduced.matches ? 0 : elapsed;
      const damping = 1 - Math.exp(-dt * 4);
      smooth.x += (target.x - smooth.x) * damping;
      smooth.y += (target.y - smooth.y) * damping;
      robot.position.y = Math.sin(t * 1.3) * .1;
      robot.rotation.y = -.22 + (reduced.matches ? 0 : smooth.x * .25);
      head.rotation.y = reduced.matches ? 0 : smooth.x * .13;
      head.rotation.x = reduced.matches ? 0 : -smooth.y * .10;
      arms[0].rotation.z = .25 + Math.sin(t * 1.1) * .09;
      arms[1].rotation.z = -.25 - Math.sin(t * 1.1) * .09;
      const blink = t % 5.8;
      for (const eye of eyes) eye.scale.y = !reduced.matches && blink > 5.5 ? .03 : .19;
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
    document.querySelector('.hero').addEventListener('pointermove', event => {
      if (reduced.matches || event.pointerType !== 'mouse') return;
      const bounds = host.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      target.y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    }, { passive: true });
    document.querySelector('.hero').addEventListener('pointerleave', () => { target.x = target.y = 0; });
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
