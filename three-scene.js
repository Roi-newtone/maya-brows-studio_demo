import * as THREE from 'three';

(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  if (window.innerWidth < 720) return;

  const host = canvas.parentElement;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  let w = host.offsetWidth;
  let h = host.offsetHeight;
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0, 6);

  scene.add(new THREE.AmbientLight(0xfff5eb, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 5, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xc9a368, 0.45);
  rim.position.set(-4, 2, -2);
  scene.add(rim);

  const cursorLight = new THREE.PointLight(0xfff1cc, 2.4, 9, 1.6);
  cursorLight.position.set(0, 0, 2.5);
  scene.add(cursorLight);

  /* ----- Silk wave fabric ----- */
  const silkGeo = new THREE.PlaneGeometry(22, 14, 140, 90);
  const silkMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:  { value: 0 },
      uA: { value: new THREE.Color('#FBF3E5') },
      uB: { value: new THREE.Color('#EFD6C5') },
      uC: { value: new THREE.Color('#D9B4A3') },
      uD: { value: new THREE.Color('#C9A368') }
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;
        vec3 pos = position;

        float w1 = sin(pos.x * 0.35 + uTime * 0.40) * 0.80;
        float w2 = sin(pos.y * 0.50 + uTime * 0.32 + 1.0) * 0.55;
        float w3 = sin((pos.x * 0.55 + pos.y * 0.35) + uTime * 0.36 + 2.0) * 0.38;
        float w4 = sin(pos.x * 1.10 - uTime * 0.28) * 0.18;

        pos.z += w1 + w2 + w3 + w4;
        vWave = w1 + w2 + w3 + w4;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;
      uniform vec3 uD;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vec3 col = mix(uA, uB, smoothstep(0.0, 1.0, vUv.y));
        col = mix(col, uC, smoothstep(-1.2, 1.2, vWave) * 0.55);
        col = mix(col, uD, smoothstep(0.6, 1.8, vWave) * 0.22);

        float vig = smoothstep(0.0, 0.85, length(vUv - 0.5));
        col = mix(col, uA, vig * 0.35);

        gl_FragColor = vec4(col, 0.96);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
  const silk = new THREE.Mesh(silkGeo, silkMat);
  silk.position.set(0, 0, -3.2);
  silk.rotation.x = -0.12;
  scene.add(silk);

  /* ----- Gold material ----- */
  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xc9a368,
    metalness: 0.95,
    roughness: 0.18,
    clearcoat: 0.55,
    clearcoatRoughness: 0.12
  });

  /* ----- Tweezer ----- */
  function makeTweezer() {
    const g = new THREE.Group();
    const armGeo = new THREE.CylinderGeometry(0.018, 0.045, 1.7, 14);
    armGeo.translate(0, 0.75, 0);

    const arm1 = new THREE.Mesh(armGeo, gold);
    arm1.rotation.z = 0.045;
    arm1.position.x = 0.028;
    g.add(arm1);

    const arm2 = new THREE.Mesh(armGeo, gold);
    arm2.rotation.z = -0.045;
    arm2.position.x = -0.028;
    g.add(arm2);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), gold);
    tip.position.y = 1.48;
    g.add(tip);
    return g;
  }

  /* ----- Spoolie brush ----- */
  function makeBrush() {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 1.15, 18), gold);
    g.add(handle);
    const bristleMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.92, metalness: 0.05 });
    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.5, 18), bristleMat);
    bristles.position.y = 0.82;
    g.add(bristles);
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 18), gold);
    ferrule.position.y = 0.6;
    g.add(ferrule);
    return g;
  }

  /* ----- Lash curler ----- */
  function makeCurler() {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 14, 36, Math.PI * 1.5), gold);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 14), gold);
    arm.position.set(-0.46, -0.42, 0);
    arm.rotation.z = -0.45;
    g.add(arm);
    return g;
  }

  const tweezer = makeTweezer();
  tweezer.position.set(-3.2, 1.0, -0.4);
  tweezer.rotation.z = 0.62;
  scene.add(tweezer);

  const brush = makeBrush();
  brush.position.set(3.0, -1.2, -0.8);
  brush.rotation.z = -0.42;
  scene.add(brush);

  const curler = makeCurler();
  curler.position.set(2.4, 1.7, -1.6);
  curler.rotation.z = 0.45;
  scene.add(curler);

  /* ----- Soft glowing particles (lash-flutter feel) ----- */
  const particleCount = 60;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xfff1cc,
    size: 0.06,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ----- Mouse ----- */
  const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ----- Scroll progress within hero ----- */
  let scrollProgress = 0;
  const heroEl = host.closest('.hero');
  window.addEventListener('scroll', () => {
    if (!heroEl) return;
    const r = heroEl.getBoundingClientRect();
    const total = r.height + window.innerHeight;
    const passed = window.innerHeight - r.top;
    scrollProgress = Math.max(0, Math.min(1, passed / total));
  }, { passive: true });

  /* ----- Visibility (pause when off-screen) ----- */
  let visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  /* ----- Resize ----- */
  function resize() {
    w = host.offsetWidth;
    h = host.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);

  /* ----- Animate ----- */
  const clock = new THREE.Clock();
  const positionsArr = particleGeo.attributes.position.array;

  function tick() {
    if (visible) {
      const t = clock.getElapsedTime();

      silkMat.uniforms.uTime.value = t;

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      cursorLight.position.x = mouse.x * 4.5;
      cursorLight.position.y = mouse.y * 3.2;
      cursorLight.position.z = 2.5 + Math.sin(t * 0.5) * 0.4;

      tweezer.position.y = 1.0 + Math.sin(t * 0.42) * 0.28;
      tweezer.rotation.x = Math.sin(t * 0.30) * 0.14;
      tweezer.rotation.z = 0.62 + Math.sin(t * 0.36) * 0.10;

      brush.position.y = -1.2 + Math.sin(t * 0.46 + 1.4) * 0.32;
      brush.rotation.x = Math.cos(t * 0.34) * 0.16;
      brush.rotation.z = -0.42 + Math.cos(t * 0.31) * 0.11;

      curler.position.y = 1.7 + Math.cos(t * 0.39 + 2.1) * 0.22;
      curler.rotation.x = Math.sin(t * 0.28 + 1.0) * 0.14;
      curler.rotation.z = 0.45 + Math.cos(t * 0.41) * 0.09;

      for (let i = 0; i < particleCount; i++) {
        positionsArr[i * 3 + 1] += 0.003 + (i % 5) * 0.0005;
        if (positionsArr[i * 3 + 1] > 4) positionsArr[i * 3 + 1] = -4;
      }
      particleGeo.attributes.position.needsUpdate = true;

      camera.position.x = mouse.x * 0.55;
      camera.position.y = mouse.y * 0.35 - scrollProgress * 1.0;
      camera.position.z = 6 - scrollProgress * 1.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
