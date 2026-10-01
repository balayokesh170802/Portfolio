/* ═══════════════════════════════════════════════════════════════════════════
   CRAFTED EXPERIENCE SECTION — Organic Jellyfish Swarm Particle System (Three.js)
   - Inspired by organic jellyfish & fluid swarm mechanics (https://antigravity.google/)
   - Soft glowing volumetric 3D particle swarm with bell, inner core & flowing tentacles
   - Smooth idle breathing pulse & harmonic tentacle wave physics
   - Fluid cursor-following, organic tilt, curl deformation, and spring relaxation
   - Transparent WebGL canvas clipped strictly inside the Crafted Experience section
   - Zero interference with section content, links, typography, or layout
   ═══════════════════════════════════════════════════════════════════════════ */

(function initOrganicJellyfishParticles() {
  const section = document.querySelector('.experience');
  const stickyContainer = document.querySelector('.experience__sticky');
  let canvas = document.getElementById('experience-grid-canvas');

  if (!section || !stickyContainer || !canvas) return;

  // Check WebGL Availability
  function isWebGLAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (typeof THREE === 'undefined' || !isWebGLAvailable()) {
    console.warn('[Experience Particles] Three.js or WebGL not available. Keeping 2D grid fallback.');
    return;
  }

  // Hide 2D grid canvas or replace context cleanly
  const parent = canvas.parentNode;
  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'experience-grid-canvas';
  newCanvas.className = 'experience__grid-canvas';
  parent.replaceChild(newCanvas, canvas);
  canvas = newCanvas;

  // ── 1. Scene, Camera & Renderer Setup ─────────────────────────────────────
  const scene = new THREE.Scene();

  let width = stickyContainer.clientWidth || window.innerWidth;
  let height = canvas.clientHeight || (stickyContainer.clientHeight - 72);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // ── 2. Soft Particle Texture Generator ─────────────────────────────────────
  function createSoftParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(247, 237, 216, 0.95)');
    grad.addColorStop(0.5, 'rgba(216, 195, 158, 0.45)');
    grad.addColorStop(0.8, 'rgba(226, 109, 92, 0.12)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  const particleTexture = createSoftParticleTexture();

  // ── 3. Build Organic Jellyfish Swarm Geometry ─────────────────────────────
  const TOTAL_PARTICLES = 1350;
  const positions = new Float32Array(TOTAL_PARTICLES * 3);
  const homePositions = new Float32Array(TOTAL_PARTICLES * 3);
  const velocities = new Float32Array(TOTAL_PARTICLES * 3);
  const colors = new Float32Array(TOTAL_PARTICLES * 3);
  const sizes = new Float32Array(TOTAL_PARTICLES);
  const alphas = new Float32Array(TOTAL_PARTICLES);
  const meta = []; // per-particle simulation metadata

  const colorGold = new THREE.Color('#d8c39e');
  const colorCream = new THREE.Color('#f7edd8');
  const colorWarm = new THREE.Color('#c4b5a0');
  const colorAccent = new THREE.Color('#e26d5c');

  let idx = 0;

  // A. Jellyfish Bell (Dome Head) ~450 particles
  const BELL_COUNT = 450;
  const BELL_RADIUS = 2.4;
  for (let i = 0; i < BELL_COUNT; i++) {
    const u = Math.acos(1 - Math.random() * 0.85); // dome truncation
    const v = Math.random() * Math.PI * 2;
    const rNoise = (Math.random() - 0.5) * 0.35;
    const r = (BELL_RADIUS + rNoise) * Math.sin(u);

    const x = r * Math.cos(v);
    const z = r * Math.sin(v);
    const y = (BELL_RADIUS + rNoise) * Math.cos(u) * 0.75 + 0.4;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    homePositions[idx * 3] = x;
    homePositions[idx * 3 + 1] = y;
    homePositions[idx * 3 + 2] = z;

    velocities[idx * 3] = 0;
    velocities[idx * 3 + 1] = 0;
    velocities[idx * 3 + 2] = 0;

    const mixRatio = Math.random();
    const c = mixRatio < 0.6 ? colorGold.clone().lerp(colorCream, Math.random() * 0.5) : colorCream.clone().lerp(colorWarm, Math.random() * 0.4);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;

    sizes[idx] = (0.28 + Math.random() * 0.42) * 18.0;
    alphas[idx] = 0.35 + Math.random() * 0.55;

    meta.push({
      type: 'bell',
      u: u,
      v: v,
      distFromCenter: Math.sqrt(x * x + y * y + z * z),
      phase: Math.random() * Math.PI * 2,
      freq: 1.2 + Math.random() * 0.8
    });

    idx++;
  }

  // B. Inner Core Glow ~150 particles
  const CORE_COUNT = 150;
  for (let i = 0; i < CORE_COUNT; i++) {
    const r = Math.random() * 0.9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) + 0.2;
    const z = r * Math.cos(phi);

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;

    homePositions[idx * 3] = x;
    homePositions[idx * 3 + 1] = y;
    homePositions[idx * 3 + 2] = z;

    velocities[idx * 3] = 0;
    velocities[idx * 3 + 1] = 0;
    velocities[idx * 3 + 2] = 0;

    const c = colorCream.clone().lerp(colorGold, Math.random() * 0.3);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;

    sizes[idx] = (0.35 + Math.random() * 0.45) * 22.0;
    alphas[idx] = 0.5 + Math.random() * 0.45;

    meta.push({
      type: 'core',
      phase: Math.random() * Math.PI * 2,
      freq: 1.8 + Math.random() * 1.0
    });

    idx++;
  }

  // C. Flowing Tentacles (8 tentacles x ~95 particles) ~750 particles
  const TENTACLE_CLUSTERS = 8;
  const PARTICLES_PER_TENTACLE = 94;
  for (let t = 0; t < TENTACLE_CLUSTERS; t++) {
    const baseAngle = (t / TENTACLE_CLUSTERS) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const baseR = BELL_RADIUS * 0.72 + (Math.random() - 0.5) * 0.3;

    for (let p = 0; p < PARTICLES_PER_TENTACLE; p++) {
      const progress = p / PARTICLES_PER_TENTACLE; // 0 to 1 down the tentacle
      const lengthY = -progress * 5.2 - 0.2; // length extending down

      const spread = (0.08 + progress * 0.35) * (Math.random() - 0.5);
      const x = baseR * Math.cos(baseAngle) + spread;
      const z = baseR * Math.sin(baseAngle) + spread;
      const y = lengthY;

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      homePositions[idx * 3] = x;
      homePositions[idx * 3 + 1] = y;
      homePositions[idx * 3 + 2] = z;

      velocities[idx * 3] = 0;
      velocities[idx * 3 + 1] = 0;
      velocities[idx * 3 + 2] = 0;

      const mixRatio = Math.random();
      const c = mixRatio < 0.2 ? colorAccent.clone().lerp(colorGold, progress) : colorGold.clone().lerp(colorWarm, progress * 0.8);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;

      sizes[idx] = (0.22 + (1.0 - progress * 0.6) * Math.random() * 0.38) * 16.0;
      alphas[idx] = (1.0 - progress * 0.55) * (0.3 + Math.random() * 0.5);

      meta.push({
        type: 'tentacle',
        tentacleIndex: t,
        progress: progress,
        angle: baseAngle,
        phase: Math.random() * Math.PI * 2,
        freq: 1.0 + Math.random() * 0.5
      });

      idx++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  // Custom Shader Material for soft glowing particle points
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: particleTexture },
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (24.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        if (texColor.a < 0.01) discard;
        gl_FragColor = vec4(vColor, vAlpha * texColor.a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });

  const particleSystem = new THREE.Points(geometry, material);

  // Group container holding the full Jellyfish entity
  const jellyfishGroup = new THREE.Group();
  jellyfishGroup.add(particleSystem);
  scene.add(jellyfishGroup);

  // Position jellyfish gracefully in the 3D space
  jellyfishGroup.position.set(0, -0.4, 0);

  // ── 4. Interaction & Motion Physics State ─────────────────────────────────
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    active: false,
    lerpX: 0,
    lerpY: 0,
    vx: 0,
    vy: 0
  };

  const headTarget = { x: 0, y: -0.4, z: 0 };
  const headPos = { x: 0, y: -0.4, z: 0 };
  const headVel = { x: 0, y: 0, z: 0 };

  let time = 0;
  let animId = null;
  let isVisible = false;

  // ── 5. Physics & Particle Animation Loop ──────────────────────────────────
  function updateParticles(dt) {
    time += dt;
    material.uniforms.uTime.value = time;

    // Smoothly interpolate mouse target
    if (mouse.active) {
      mouse.lerpX += (mouse.targetX - mouse.lerpX) * 0.08;
      mouse.lerpY += (mouse.targetY - mouse.lerpY) * 0.08;
    } else {
      mouse.lerpX += (0 - mouse.lerpX) * 0.04;
      mouse.lerpY += (0 - mouse.lerpY) * 0.04;
    }

    // Update Jellyfish Head position & smooth swimming motion toward mouse target
    headTarget.x = mouse.active ? mouse.lerpX * 4.5 : Math.sin(time * 0.4) * 0.6;
    headTarget.y = mouse.active ? mouse.lerpY * 2.8 - 0.4 : -0.4 + Math.sin(time * 0.7) * 0.45;

    const dx = headTarget.x - headPos.x;
    const dy = headTarget.y - headPos.y;

    headVel.x += dx * 0.035;
    headVel.y += dy * 0.035;
    headVel.x *= 0.88;
    headVel.y *= 0.88;

    headPos.x += headVel.x;
    headPos.y += headVel.y;

    jellyfishGroup.position.x = headPos.x;
    jellyfishGroup.position.y = headPos.y;

    // Organic head rotation / leaning based on swimming velocity & subtle wobble
    const tiltZ = -headVel.x * 1.8 + Math.sin(time * 0.6) * 0.06;
    const tiltX = headVel.y * 1.2 + Math.cos(time * 0.5) * 0.04;
    jellyfishGroup.rotation.z += (tiltZ - jellyfishGroup.rotation.z) * 0.1;
    jellyfishGroup.rotation.x += (tiltX - jellyfishGroup.rotation.x) * 0.1;
    jellyfishGroup.rotation.y = Math.sin(time * 0.3) * 0.15;

    // Organic Breathing Pulse Cycle (contraction & expansion)
    const pulseRaw = Math.sin(time * 1.8);
    const pulseCompress = Math.pow(Math.max(0, pulseRaw), 2.2); // sharp contraction
    const pulseExpand = Math.sin(time * 1.8 - 0.6) * 0.12;       // gradual relaxation

    const posAttr = geometry.attributes.position;
    const posArr = posAttr.array;

    // Update individual particle dynamics (Head breathing, Core glow & Tentacle wave lag)
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const pMeta = meta[i];
      const i3 = i * 3;

      const hx = homePositions[i3];
      const hy = homePositions[i3 + 1];
      const hz = homePositions[i3 + 2];

      let targetX = hx;
      let targetY = hy;
      let targetZ = hz;

      if (pMeta.type === 'bell') {
        // Bell pulsating expansion / contraction
        const scaleFactor = 1.0 - pulseCompress * 0.18 + pulseExpand;
        targetX = hx * scaleFactor;
        targetZ = hz * scaleFactor;
        targetY = hy * (1.0 + pulseCompress * 0.12);
      } else if (pMeta.type === 'core') {
        // Inner core organic flickering & pulsing
        const coreFlicker = Math.sin(time * pMeta.freq + pMeta.phase) * 0.08;
        targetX = hx * (1.0 + coreFlicker);
        targetY = hy * (1.0 + coreFlicker);
        targetZ = hz * (1.0 + coreFlicker);
      } else if (pMeta.type === 'tentacle') {
        // Tentacle hydrodynamic wave propagation (harmonic sine wave lagging behind bell)
        const prog = pMeta.progress;
        const waveX = Math.sin(time * 2.4 - prog * 4.2 + pMeta.angle) * (prog * 0.65) * (1.0 + headVel.x * 2.0);
        const waveZ = Math.cos(time * 2.0 - prog * 3.8 + pMeta.angle) * (prog * 0.65);
        const dragY = headVel.y * prog * 1.4;

        targetX = hx + waveX;
        targetZ = hz + waveZ;
        targetY = hy - dragY;
      }

      // Cursor proximity dynamic scattering / curl force
      if (mouse.active) {
        // Calculate particle 3D world position
        const worldX = headPos.x + targetX;
        const worldY = headPos.y + targetY;
        const mouseWorldX = mouse.lerpX * 4.5;
        const mouseWorldY = mouse.lerpY * 2.8;

        const pdx = worldX - mouseWorldX;
        const pdy = worldY - mouseWorldY;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

        const INFLUENCE_RADIUS = 2.4;
        if (pdist < INFLUENCE_RADIUS && pdist > 0.01) {
          const normForce = 1.0 - (pdist / INFLUENCE_RADIUS);
          const pushAmount = Math.pow(normForce, 1.8) * 0.75;
          targetX += (pdx / pdist) * pushAmount;
          targetY += (pdy / pdist) * pushAmount;
        }
      }

      // Smooth damped spring motion toward target position
      velocities[i3] += (targetX - posArr[i3]) * 0.08;
      velocities[i3 + 1] += (targetY - posArr[i3 + 1]) * 0.08;
      velocities[i3 + 2] += (targetZ - posArr[i3 + 2]) * 0.08;

      velocities[i3] *= 0.82;
      velocities[i3 + 1] *= 0.82;
      velocities[i3 + 2] *= 0.82;

      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];
    }

    posAttr.needsUpdate = true;
  }

  // ── 6. Render Loop & Resize Handling ─────────────────────────────────────
  let lastTime = performance.now();

  function animate(now) {
    if (!isVisible) {
      animId = null;
      return;
    }

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    updateParticles(dt);
    renderer.render(scene, camera);

    animId = requestAnimationFrame(animate);
  }

  function startLoop() {
    if (!animId && isVisible) {
      lastTime = performance.now();
      animId = requestAnimationFrame(animate);
    }
  }

  function onResize() {
    width = stickyContainer.clientWidth || window.innerWidth;
    height = canvas.clientHeight || (stickyContainer.clientHeight - 72);

    if (width <= 0 || height <= 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  // ── 7. Mouse Event Listeners ──────────────────────────────────────────────
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.clientY >= rect.top && e.clientY <= rect.bottom &&
        e.clientX >= rect.left && e.clientX <= rect.right) {
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      mouse.targetX = (relX - 0.5) * 2; // -1 to 1
      mouse.targetY = -(relY - 0.5) * 2; // 1 to -1
      mouse.active = true;
      startLoop();
    } else if (mouse.active) {
      mouse.active = false;
      startLoop();
    }
  }

  function onMouseLeave() {
    if (mouse.active) {
      mouse.active = false;
      startLoop();
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('resize', onResize, { passive: true });

  // IntersectionObserver to pause rendering when section is scrolled out of view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startLoop();
        }
      });
    }, { threshold: 0.02 });
    observer.observe(section);
  } else {
    isVisible = true;
    startLoop();
  }

  onResize();
  startLoop();
})();
