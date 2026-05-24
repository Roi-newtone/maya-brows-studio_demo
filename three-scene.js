import * as THREE from 'three';

(() => {
  const canvas = document.getElementById('filaments-canvas');
  if (!canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const isMobile = window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  let w = window.innerWidth;
  let h = window.innerHeight;
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
  camera.position.set(0, 0.4, 7);
  camera.lookAt(0, 0.35, 0);

  /* ----- Rose-gold palette ----- */
  const palette = [
    new THREE.Color('#E0B89F'),
    new THREE.Color('#C99878'),
    new THREE.Color('#B07A56'),
    new THREE.Color('#EBC9AE'),
    new THREE.Color('#D9A87B')
  ];

  /* ----- Filament settings ----- */
  const FILAMENTS = isMobile ? 28 : 56;
  const SEGMENTS  = isMobile ? 64 : 110;

  const filaments = [];

  for (let i = 0; i < FILAMENTS; i++) {
    const positions = new Float32Array(SEGMENTS * 3);
    const geometry  = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const color = palette[i % palette.length].clone();
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55 + Math.random() * 0.35
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);

    /* Each filament has its own personality */
    filaments.push({
      line, geometry, positions, material,
      phase:      Math.random() * Math.PI * 2,
      speed:      0.22 + Math.random() * 0.28,
      archHeight: 0.78 + (Math.random() - 0.5) * 0.55,
      yOffset:    (Math.random() - 0.5) * 0.55,
      zOffset:    (Math.random() - 0.5) * 1.8,
      xWidth:     2.35 + Math.random() * 0.85,
      arcShift:   (Math.random() - 0.5) * 0.5,
      weaveAmp:   0.04 + Math.random() * 0.08,
      weaveFreq:  4 + Math.random() * 4
    });
  }

  /* ----- Mouse / touch ----- */
  const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
  const setPointer = (cx, cy) => {
    mouse.tx = (cx / window.innerWidth) * 2 - 1;
    mouse.ty = -(cy / window.innerHeight) * 2 + 1;
  };
  window.addEventListener('mousemove', (e) => setPointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* Scroll progress 0 to 1 across whole document */
  let scrollProgress = 0;
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollProgress = Math.min(1, window.scrollY / max);
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  /* ----- Resize ----- */
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);

  /* ----- Tab visibility pause ----- */
  let pageVisible = true;
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  /* ----- Animation loop ----- */
  const clock = new THREE.Clock();

  function tick() {
    if (pageVisible) {
      const t = clock.getElapsedTime();

      /* Smooth mouse */
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      /* Update every filament */
      for (let f = 0; f < FILAMENTS; f++) {
        const fil = filaments[f];
        const pos = fil.positions;

        for (let i = 0; i < SEGMENTS; i++) {
          const tR = i / (SEGMENTS - 1);            // 0 to 1 along filament
          const x  = (-1 + tR * 2) * fil.xWidth;

          const arch     = Math.sin(tR * Math.PI);   // 0 at ends, 1 at apex
          const baseY    = arch * fil.archHeight + fil.yOffset + fil.arcShift * (tR - 0.5);

          /* Hypnotic weaving — phase along the strand creates wave */
          const wA = Math.sin(t * fil.speed + fil.phase + tR * fil.weaveFreq) * fil.weaveAmp;
          const wB = Math.cos(t * fil.speed * 0.7 + fil.phase + tR * (fil.weaveFreq * 0.6)) * fil.weaveAmp * 0.7;

          /* Cursor "touch" effect — strongest at apex of arch */
          const reach = arch * 0.7;
          const mx = mouse.x * reach * 0.45;
          const my = mouse.y * reach * 0.30;

          pos[i * 3]     = x + mx + wB * 0.6;
          pos[i * 3 + 1] = baseY + wA + my;
          pos[i * 3 + 2] = fil.zOffset + wB;
        }
        fil.geometry.attributes.position.needsUpdate = true;
        fil.geometry.computeBoundingSphere();
      }

      /* Gentle camera parallax with mouse + slow scroll drift */
      camera.position.x = mouse.x * 0.45;
      camera.position.y = 0.4 + mouse.y * 0.22 - scrollProgress * 0.4;
      camera.position.z = 7 - scrollProgress * 0.5;
      camera.lookAt(0, 0.35 + mouse.y * 0.08, 0);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
