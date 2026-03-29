/* ============================================
   TANGLE-ME PHOTO LIGHTBOX  v1.0
   Usage:
     TangleLightbox.open(urls, startIndex)
     - urls: array of image URL strings
     - startIndex: which photo to show first (0-based)
   
   Example:
     TangleLightbox.open(['/uploads/abc.webp', '/uploads/def.webp'], 0);
   ============================================ */

const TangleLightbox = (() => {
  let overlay, slider, counterEl, dotsContainer;
  let prevBtn, nextBtn;
  let images = [];
  let current = 0;
  let startX = 0, deltaX = 0, isDragging = false;
  let savedScrollY = 0;

  // ---- Build DOM once ----
  function init() {
    if (overlay) return; // already initialised

    overlay = document.createElement('div');
    overlay.className = 'tl-overlay';
    overlay.innerHTML = `
      <div class="tl-topbar">
        <span class="tl-counter"></span>
        <button class="tl-close" aria-label="Close">&times;</button>
      </div>
      <div class="tl-track">
        <button class="tl-arrow tl-arrow-prev" aria-label="Previous">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="tl-slider"></div>
        <button class="tl-arrow tl-arrow-next" aria-label="Next">
          <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
        </button>
      </div>
      <div class="tl-dots"></div>
    `;
    document.body.appendChild(overlay);

    slider        = overlay.querySelector('.tl-slider');
    counterEl     = overlay.querySelector('.tl-counter');
    dotsContainer = overlay.querySelector('.tl-dots');
    prevBtn       = overlay.querySelector('.tl-arrow-prev');
    nextBtn       = overlay.querySelector('.tl-arrow-next');

    // Close handlers
    overlay.querySelector('.tl-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('tl-track')) close();
    });

    // Keyboard
    document.addEventListener('keydown', onKey);

    // Desktop arrows
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

    // Touch / pointer events on slider
    slider.addEventListener('touchstart',  onTouchStart, { passive: true });
    slider.addEventListener('touchmove',   onTouchMove,  { passive: false });
    slider.addEventListener('touchend',    onTouchEnd);
    slider.addEventListener('touchcancel', onTouchEnd);

    // Mouse drag (desktop fallback)
    slider.addEventListener('mousedown',  onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }

  // ---- Public: open lightbox ----
  function open(urls, startIndex = 0) {
    if (!urls || urls.length === 0) return;
    init();

    // Build 026: Filter out any empty/invalid URLs before creating slides
    const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim().length > 1);
    if (validUrls.length === 0) return;

    images  = validUrls;
    current = Math.max(0, Math.min(startIndex, validUrls.length - 1));

    // Build slides
    slider.innerHTML = '';
    validUrls.forEach((url, i) => {
      const slide = document.createElement('div');
      slide.className = 'tl-slide';

      const loader = document.createElement('div');
      loader.className = 'tl-loader';
      slide.appendChild(loader);

      const img = new Image();
      img.alt = `Photo ${i + 1}`;
      // Let browser pick best rendering
      img.decoding = 'async';
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s';
      img.onload = () => {
        loader.remove();
        img.style.opacity = '1';
      };
      img.onerror = () => {
        loader.remove();
        slide.innerHTML = '<span style="color:#aaa;font-size:14px;">Photo unavailable</span>';
      };
      img.src = url;
      slide.appendChild(img);
      slider.appendChild(slide);
    });

    // Build dots
    buildDots();
    updateUI();
    positionSlider(false);

    // Lock scroll
    savedScrollY = window.scrollY;
    document.body.classList.add('tl-noscroll');
    document.body.style.top = `-${savedScrollY}px`;

    // Show
    requestAnimationFrame(() => overlay.classList.add('tl-active'));
  }

  // ---- Public: close lightbox ----
  function close() {
    overlay.classList.remove('tl-active');
    // Restore scroll
    document.body.classList.remove('tl-noscroll');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }

  // ---- Navigation ----
  function goTo(index) {
    if (index < 0 || index >= images.length) return;
    current = index;
    positionSlider(true);
    updateUI();
  }

  function next() { if (current < images.length - 1) goTo(current + 1); }
  function prev() { if (current > 0) goTo(current - 1); }

  function positionSlider(animate) {
    if (animate) slider.classList.remove('tl-dragging');
    else slider.classList.add('tl-dragging');
    slider.style.transform = `translateX(${-current * window.innerWidth}px)`;
    if (!animate) {
      // Remove dragging class after a frame so future transitions work
      requestAnimationFrame(() => slider.classList.remove('tl-dragging'));
    }
  }

  function updateUI() {
    counterEl.textContent = images.length > 1
      ? `${current + 1} / ${images.length}`
      : '';

    // Arrows visibility
    prevBtn.style.opacity = current === 0 ? '0.3' : '1';
    prevBtn.style.pointerEvents = current === 0 ? 'none' : 'auto';
    nextBtn.style.opacity = current === images.length - 1 ? '0.3' : '1';
    nextBtn.style.pointerEvents = current === images.length - 1 ? 'none' : 'auto';

    // Dots
    dotsContainer.querySelectorAll('.tl-dot').forEach((d, i) => {
      d.classList.toggle('tl-dot-active', i === current);
    });
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    if (images.length <= 1) return;
    dotsContainer.className = 'tl-dots' + (images.length > 8 ? ' tl-dots-many' : '');
    images.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'tl-dot' + (i === current ? ' tl-dot-active' : '');
      dot.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); });
      dotsContainer.appendChild(dot);
    });
  }

  // ---- Keyboard ----
  function onKey(e) {
    if (!overlay.classList.contains('tl-active')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   prev();
    if (e.key === 'ArrowRight')  next();
  }

  // ---- Touch swipe ----
  function onTouchStart(e) {
    if (images.length < 2) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    deltaX = 0;
    slider.classList.add('tl-dragging');
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    deltaX = e.touches[0].clientX - startX;

    // Resist overscroll at edges
    if ((current === 0 && deltaX > 0) || (current === images.length - 1 && deltaX < 0)) {
      deltaX *= 0.3;
    }

    slider.style.transform = `translateX(${-current * window.innerWidth + deltaX}px)`;
    // Prevent vertical scroll while swiping horizontally
    if (Math.abs(deltaX) > 10) e.preventDefault();
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove('tl-dragging');

    const threshold = window.innerWidth * 0.2; // 20% of screen width
    if (deltaX < -threshold && current < images.length - 1) {
      goTo(current + 1);
    } else if (deltaX > threshold && current > 0) {
      goTo(current - 1);
    } else {
      positionSlider(true); // snap back
    }
    deltaX = 0;
  }

  // ---- Mouse drag (desktop) ----
  let mouseDown = false;
  function onMouseDown(e) {
    if (images.length < 2) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('.tl-arrow')) return;
    mouseDown = true;
    isDragging = true;
    startX = e.clientX;
    deltaX = 0;
    slider.classList.add('tl-dragging');
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!mouseDown) return;
    deltaX = e.clientX - startX;
    if ((current === 0 && deltaX > 0) || (current === images.length - 1 && deltaX < 0)) {
      deltaX *= 0.3;
    }
    slider.style.transform = `translateX(${-current * window.innerWidth + deltaX}px)`;
  }

  function onMouseUp() {
    if (!mouseDown) return;
    mouseDown = false;
    isDragging = false;
    slider.classList.remove('tl-dragging');

    const threshold = window.innerWidth * 0.15;
    if (deltaX < -threshold && current < images.length - 1) {
      goTo(current + 1);
    } else if (deltaX > threshold && current > 0) {
      goTo(current - 1);
    } else {
      positionSlider(true);
    }
    deltaX = 0;
  }

  // ---- Handle window resize (orientation change etc) ----
  window.addEventListener('resize', () => {
    if (overlay && overlay.classList.contains('tl-active')) {
      positionSlider(false);
    }
  });

  // Public API
  return { open, close };
})();
