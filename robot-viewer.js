import * as pc from './vendor/playcanvas.min.mjs';

// The page owns the canvas and controls; this module owns only its 3D scene.
export async function createRobotViewer() {
  const host = document.querySelector('#robot-scene');
  const canvas = document.querySelector('#robot-canvas');
  const loading = host.querySelector('.robot-progress');
  const progressCircle = host.querySelector('.robot-progress-circle');
  const progressText = host.querySelector('.robot-progress-text');
  const pauseButton = document.querySelector('#robot-pause');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  canvas.style.touchAction = 'none';

  const device = await pc.createGraphicsDevice(canvas, {
    deviceTypes: [pc.DEVICETYPE_WEBGL2],
    // Native DPR supplies edge detail without the bandwidth cost of MSAA.
    antialias: false,
    alpha: true,
    powerPreference: 'low-power'
  });
  device.maxPixelRatio = window.devicePixelRatio || 1;
  const options = new pc.AppOptions();
  options.graphicsDevice = device;
  options.componentSystems = [pc.RenderComponentSystem, pc.CameraComponentSystem, pc.LightComponentSystem];
  options.resourceHandlers = [pc.TextureHandler, pc.ContainerHandler];
  const app = new pc.AppBase(canvas);
  app.init(options);
  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.autoRender = false;
  app.scene.toneMapping = pc.TONEMAP_NEUTRAL;
  app.scene.exposure = 0.95;
  app.scene.ambientLight = new pc.Color(0.43, 0.46, 0.40);
  app.scene.clusteredLightingEnabled = false;
  app.scene.lighting.shadowsEnabled = false;

  const camera = new pc.Entity('Robot camera');
  camera.addComponent('camera', {
    fov: 37,
    nearClip: 0.1,
    farClip: 50,
    clearColor: new pc.Color(0, 0, 0, 0)
  });
  app.root.addChild(camera);

  // A small procedural studio panorama supplies broad, coherent PBR reflections.
  // It is filtered once at startup; no environment pass is rendered each frame.
  const panorama = document.createElement('canvas');
  panorama.width = 256;
  panorama.height = 128;
  const ctx = panorama.getContext('2d');
  const image = ctx.createImageData(256, 128);
  const panels = [
    { x: 0.24, y: 0.28, sx: 0.11, sy: 0.32, rgb: [244, 250, 236], power: 0.86 },
    { x: 0.69, y: 0.39, sx: 0.075, sy: 0.36, rgb: [194, 228, 255], power: 0.62 },
    { x: 0.46, y: 0.15, sx: 0.22, sy: 0.09, rgb: [247, 246, 225], power: 0.54 }
  ];
  for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
    const v = y / 127;
    const base = v < 0.58 ? [52, 60, 48] : [31, 38, 31];
    const rgb = [...base];
    for (const panel of panels) {
      const dx = Math.min(Math.abs(x / 255 - panel.x), 1 - Math.abs(x / 255 - panel.x)) / panel.sx;
      const dy = (v - panel.y) / panel.sy;
      const weight = Math.exp(-2.5 * (dx * dx + dy * dy)) * panel.power;
      for (let c = 0; c < 3; c++) rgb[c] += (panel.rgb[c] - base[c]) * weight;
    }
    const i = (y * 256 + x) * 4;
    for (let c = 0; c < 3; c++) image.data[i + c] = Math.min(255, rgb[c]);
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const source = new pc.Texture(device, {
    width: 256, height: 128, format: pc.PIXELFORMAT_SRGBA8,
    projection: pc.TEXTUREPROJECTION_EQUIRECT, mipmaps: false
  });
  source.setSource(panorama);
  const lightingSource = pc.EnvLighting.generateLightingSource(source, { size: 64 });
  app.scene.envAtlas = pc.EnvLighting.generateAtlas(lightingSource, {
    size: 128, numReflectionSamples: 32, numAmbientSamples: 64
  });
  // PlayCanvas also displays envAtlas as a sky; keep the site's grid visible.
  app.scene.layers.getLayerById(pc.LAYERID_SKYBOX).enabled = false;
  source.destroy();
  lightingSource.destroy();

  function directional(name, color, intensity, angles) {
    const light = new pc.Entity(name);
    light.addComponent('light', {
      type: 'directional', color: new pc.Color(...color), intensity,
      castShadows: false
    });
    light.setEulerAngles(...angles);
    app.root.addChild(light);
  }
  directional('Soft key', [1, 0.98, 0.92], 1.4, [42, -32, 0]);
  directional('Soft fill', [0.79, 0.94, 1], 0.85, [18, 120, 0]);
  directional('Cool rim', [0.54, 0.79, 1], 0.65, [-18, 210, 0]);

  const robot = new pc.Entity('Robot pivot');
  app.root.addChild(robot);
  pc.dracoInitialize({
    jsUrl: './vendor/draco/draco.wasm.js',
    wasmUrl: './vendor/draco/draco.wasm.wasm',
    numWorkers: 1, lazyInit: true
  });

  function setProgress(value) {
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    progressCircle?.setAttribute('stroke-dashoffset', String(100 - percent));
    if (progressText) progressText.textContent = percent === 100 ? 'Preparando robot 3D…' : `Cargando robot 3D · ${percent}%`;
  }
  async function loadModel(url) {
    // XHR progress keeps the existing loading UI working. The ArrayBuffer is passed
    // to PlayCanvas as a local object URL, with the GLB container parser intact.
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    const size = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();
    let blob;
    if (reader && size) {
      const chunks = [];
      let received = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setProgress(received / size * 100);
      }
      blob = new Blob(chunks, { type: 'model/gltf-binary' });
    } else {
      blob = await response.blob();
      setProgress(100);
    }
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await new Promise((resolve, reject) => {
        app.assets.loadFromUrlAndFilename(objectUrl, 'robot.glb', 'container', (error, asset) => {
          if (error) reject(error);
          else resolve(asset);
        });
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  try {
    let asset;
    try {
      asset = await loadModel('./model/robot-fast.glb');
    } catch (error) {
      console.warn('El robot comprimido falló; cargando el GLB original.', error);
      setProgress(0);
      asset = await loadModel('./model/robot.glb');
    }
    const model = asset.resource.instantiateRenderEntity();
    const materials = new Set();
    model.forEach(node => {
      if (!node.render) return;
      node.render.castShadows = false;
      node.render.receiveShadows = false;
      for (const instance of node.render.meshInstances) materials.add(instance.material);
    });
    for (const material of materials) {
      if (material instanceof pc.StandardMaterial) {
        // glTF roughness becomes PlayCanvas gloss; keep plastic from looking wet.
        material.gloss = Math.min(material.gloss, 0.76);
        if (/acrilico/i.test(material.name)) {
          material.opacity = 0.68;
          material.depthWrite = false;
        }
        material.update();
      }
    }
    model.setLocalEulerAngles(0, -10.8, 0);
    model.setLocalPosition(0.04, -0.2, 0.1);
    model.setLocalScale(14.65, 14.65, 14.65);
    robot.addChild(model);
    setProgress(100);
    loading.hidden = true;
    host.classList.add('scene-ready');
  } catch (error) {
    loading.hidden = true;
    app.destroy();
    throw error;
  }

  let visible = true, lost = false, paused = false, elapsed = 0, lastMotion = performance.now();
  let lastRendered = 0;
  const focusY = 0.12;
  const cameraHeight = 1.1 - focusY;
  let orbitRadius = Math.hypot(5.7, cameraHeight);
  let baseElevation = Math.atan2(cameraHeight, 5.7);
  const intervals = [];
  const drag = { active: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0, smoothYaw: 0, smoothPitch: 0, pointerId: null };
  const motionEnabled = () => !paused && !reduced.matches;
  const canRender = () => !document.hidden && visible && !lost;
  function pose(time) {
    const dt = Math.min(Math.max((time - lastMotion) / 1000, 0), 0.05);
    lastMotion = time;
    if (motionEnabled()) elapsed += dt;
    const t = elapsed;
    // Orbit the camera while keeping the robot upright on screen.
    const blend = motionEnabled() ? 1 - Math.exp(-dt * 9) : 1;
    drag.smoothYaw += (drag.yaw - drag.smoothYaw) * blend;
    drag.smoothPitch += (drag.pitch - drag.smoothPitch) * blend;
    robot.setLocalPosition(0, Math.sin(t * 0.65) * 0.035, 0);
    robot.setLocalEulerAngles(0, Math.sin(t * 0.24) * 0.10 * 180 / Math.PI, 0);
    const elevation = baseElevation + drag.smoothPitch;
    const horizontal = orbitRadius * Math.cos(elevation);
    camera.setPosition(
      -Math.sin(drag.smoothYaw) * horizontal,
      focusY + orbitRadius * Math.sin(elevation),
      Math.cos(drag.smoothYaw) * horizontal
    );
    camera.lookAt(0, focusY, 0);
  }
  function requestFrame() {
    if (!canRender()) return;
    pose(performance.now());
    app.renderNextFrame = true;
  }
  function updateState() {
    pauseButton.disabled = reduced.matches;
    const label = reduced.matches ? 'Movimiento reducido' : paused ? 'Reanudar movimiento' : 'Pausar movimiento';
    pauseButton.setAttribute('aria-label', label);
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.title = label;
    lastMotion = performance.now();
    requestFrame();
  }
  function resize() {
    const width = host.clientWidth;
    const height = Math.max(1, host.clientHeight - 48);
    if (!width || !height) return;
    device.maxPixelRatio = window.devicePixelRatio || 1;
    app.resizeCanvas(width, height);
    camera.camera.aspectRatio = width / height;
    const horizontal = Math.max(4.9, 5.7 / (width / height));
    orbitRadius = Math.hypot(horizontal, cameraHeight);
    baseElevation = Math.atan2(cameraHeight, horizontal);
    requestFrame();
  }
  app.on('update', () => {
    if (!canRender() || !motionEnabled()) return;
    // Let PlayCanvas follow the display's requestAnimationFrame cadence.
    // A 32 ms gate capped motion at ~30 fps and made it judder on 60/75 Hz screens.
    pose(performance.now());
    app.renderNextFrame = true;
  });
  app.on('postrender', () => {
    const now = performance.now();
    if (lastRendered) {
      intervals.push(now - lastRendered);
      if (intervals.length > 900) intervals.shift();
    }
    lastRendered = now;
  });
  // Read in DevTools on the physical phone; intervals are delivered frame times,
  // not GPU timer queries. A 30 second sample avoids startup and loading noise.
  window.__robotBenchmark = () => {
    const sample = intervals.slice(-900);
    const sorted = [...sample].sort((a, b) => a - b);
    const mean = sample.reduce((a, b) => a + b, 0) / (sample.length || 1);
    return {
      engine: 'PlayCanvas 2.23.3', backend: 'WebGL2',
      dpr: window.devicePixelRatio, canvas: [canvas.width, canvas.height],
      css: [canvas.clientWidth, canvas.clientHeight],
      frames: sample.length, seconds: sample.reduce((a, b) => a + b, 0) / 1000,
      fps: mean ? 1000 / mean : null, meanMs: mean || null,
      p95Ms: sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : null,
      over33ms: sample.filter(ms => ms > 33.3).length
    };
  };
  window.__robotBenchmark.reset = () => {
    intervals.length = 0;
    lastRendered = 0;
  };
  canvas.addEventListener('pointerdown', event => {
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    const dx = Math.max(-80, Math.min(80, event.clientX - drag.lastX));
    const dy = Math.max(-80, Math.min(80, event.clientY - drag.lastY));
    drag.yaw += dx * 0.0015;
    drag.pitch = Math.max(-0.35, Math.min(0.35, drag.pitch + dy * 0.0015));
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    if (!motionEnabled()) requestFrame();
    if (event.pointerType !== 'touch') event.preventDefault();
  }, { passive: false });
  const stopDrag = event => {
    if (event.pointerId !== drag.pointerId) return;
    // Stop at the displayed pose instead of finishing a queued turn on release.
    drag.yaw = drag.smoothYaw;
    drag.pitch = drag.smoothPitch;
    drag.active = false;
    drag.pointerId = null;
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('lostpointercapture', stopDrag);
  pauseButton.addEventListener('click', () => { paused = !paused; updateState(); });
  for (const [selector, direction] of [['#robot-left', -1], ['#robot-right', 1]]) {
    document.querySelector(selector).addEventListener('click', () => {
      drag.yaw += direction * Math.PI / 8;
      requestFrame();
    });
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    updateState();
  }, { rootMargin: '200px', threshold: 0.01 }).observe(host);
  reduced.addEventListener('change', updateState);
  document.addEventListener('visibilitychange', updateState);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    host.classList.remove('scene-ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    host.classList.add('scene-ready');
    resize();
  });
  resize();
  app.start();
  updateState();
}
