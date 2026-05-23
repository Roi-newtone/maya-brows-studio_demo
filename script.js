(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const WA_PHONE = '972500000000';
  const waMessages = {
    'כללי': 'היי מאיה, אשמח לתאם תור 🙏',
    'עיצוב גבות': 'היי מאיה, אשמח לתאם תור לעיצוב גבות 🙏',
    'הרמת ריסים': 'היי מאיה, אשמח לתאם תור להרמת ריסים 🙏',
    'הלחמת ריסים': 'היי מאיה, אשמח לתאם תור להלחמת ריסים 🙏',
    'מיקרובליידינג': 'היי מאיה, אשמח לתאם ייעוץ למיקרובליידינג 🙏',
    'פאודר ברו': 'היי מאיה, אשמח לתאם ייעוץ לפאודר ברו 🙏'
  };
  const buildWaUrl = (key) => {
    const msg = waMessages[key] || waMessages['כללי'];
    return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  /* ----- Hide broken images so the placeholder shows cleanly ----- */
  document.querySelectorAll('img').forEach((img) => {
    const hide = () => { img.style.display = 'none'; };
    if (img.complete && img.naturalWidth === 0) hide();
    img.addEventListener('error', hide);
  });

  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(buildWaUrl(a.dataset.wa), '_blank', 'noopener');
    });
  });

  /* ----- Loader ----- */
  const loader = document.getElementById('loader');
  const hideLoader = () => loader && loader.classList.add('loaded');
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', () => setTimeout(hideLoader, 350));

  /* ----- Nav scroll ----- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- Mobile nav ----- */
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  const setMenu = (open) => {
    toggle.classList.toggle('open', open);
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle?.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ----- Reveal on scroll ----- */
  const targets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 30, 200)}ms`;
      io.observe(el);
    });
  } else {
    targets.forEach(el => el.classList.add('in'));
  }

  /* ----- Subtle parallax on hero blob ----- */
  if (!reduce) {
    const blob = document.querySelector('.blob-1');
    let ticking = false;
    if (blob) {
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            blob.style.translate = `0 ${window.scrollY * 0.12}px`;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  /* ----- Custom cursor ----- */
  if (fine && !reduce) {
    const cursor = document.querySelector('.cursor');
    const dot    = document.querySelector('.cursor-dot');
    const ring   = document.querySelector('.cursor-ring');
    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    });

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverables = 'a, button, .gallery-item, .menu-row, .testi-grid blockquote, .process-step';
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    document.addEventListener('mouseleave', () => {
      dot.style.opacity = ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = ring.style.opacity = '';
    });
  }

  /* ----- Subtle magnetic on main CTAs ----- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn-primary, .nav-cta').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top  - rect.height / 2;
        btn.style.translate = `${x * 0.12}px ${y * 0.12}px`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.translate = ''; });
    });
  }

  /* ----- Smooth anchor scroll ----- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

})();
