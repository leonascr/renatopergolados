(function () {
  'use strict';

  var WHATSAPP = '5561996880579';
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Header ---------- */
  var header = document.querySelector('.header');
  var headerScrolled = null;
  function updateHeader(y) {
    var s = y > 40;
    if (s !== headerScrolled) { headerScrolled = s; header.classList.toggle('is-scrolled', s); }
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Hero: profundidade em camadas ----------
     fundo (lento) · logo (médio, metade para fora da tela) · texto (rápido, some ao rolar)
     Só transform/opacity (camadas na GPU) e só quando há movimento. */
  var hero = document.querySelector('.hero');
  var heroBg = document.getElementById('heroBg');
  var heroMark = document.getElementById('heroMark');
  var heroContent = document.getElementById('heroContent');
  var heroH = hero.offsetHeight;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var lastY = -1;

  if (finePointer && !reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
      schedule();
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { mouse.tx = 0; mouse.ty = 0; schedule(); });
  }

  // devolve true enquanto ainda há movimento a suavizar
  function renderHero(y) {
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    var settling = Math.abs(mouse.tx - mouse.x) > 0.0005 || Math.abs(mouse.ty - mouse.y) > 0.0005;
    if (y === lastY && !settling) return false;
    lastY = y;
    if (y > heroH) return settling;

    var p = y / heroH;
    heroBg.style.transform = 'translate3d(' + (mouse.x * -14).toFixed(2) + 'px,' + (y * 0.35 + mouse.y * -10).toFixed(2) + 'px,0)';
    heroMark.style.transform = 'translate3d(' + (mouse.x * 18).toFixed(2) + 'px,' + (y * 0.18 + mouse.y * 14).toFixed(2) + 'px,0) rotate(' + (-12 - p * 30 + mouse.x * 4).toFixed(2) + 'deg)';
    heroContent.style.transform = 'translate3d(' + (mouse.x * 6).toFixed(2) + 'px,' + (y * -0.15).toFixed(2) + 'px,0)';
    heroContent.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3);
    return settling;
  }

  /* ---------- Carrossel de projetos ---------- */
  var track = document.getElementById('track');
  var bar = document.getElementById('progressBar');
  function updateProgress() {
    var max = track.scrollWidth - track.clientWidth;
    var ratio = track.clientWidth / track.scrollWidth;
    var pos = max > 0 ? track.scrollLeft / max : 0;
    bar.style.width = (ratio * 100) + '%';
    bar.style.transform = 'translateX(' + (pos * (1 / ratio - 1) * 100) + '%)';
  }
  function step(dir) {
    var card = track.querySelector('.card');
    track.scrollBy({ left: dir * (card.offsetWidth + 22), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  document.getElementById('prevBtn').addEventListener('click', function () { step(-1); });
  document.getElementById('nextBtn').addEventListener('click', function () { step(1); });
  track.addEventListener('scroll', updateProgress, { passive: true });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  // arrastar com o mouse
  if (finePointer) {
    var drag = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) { drag.moved = true; track.classList.add('is-dragging'); }
      track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return;
      drag = null;
      track.classList.remove('is-dragging');
    });
  }

  /* ---------- Serviços: prévia que segue o cursor ---------- */
  var preview = document.getElementById('svcPreview');
  var previewImg = preview.querySelector('img');
  var pv = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  if (finePointer) {
    document.querySelectorAll('.svc__item').forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        previewImg.src = item.getAttribute('data-img');
        preview.classList.add('is-on');
        pv.active = true;
      });
      item.addEventListener('mouseleave', function () {
        preview.classList.remove('is-on');
        pv.active = false;
      });
      item.addEventListener('mousemove', function (e) {
        pv.tx = e.clientX + 170;
        pv.ty = e.clientY;
        if (!pv.x) { pv.x = pv.tx; pv.y = pv.ty; }
        schedule();
      });
    });
  }
  function renderPreview() {
    if (!pv.active) return false;
    pv.x += (pv.tx - pv.x) * 0.16;
    pv.y += (pv.ty - pv.y) * 0.16;
    preview.style.transform = 'translate3d(' + pv.x.toFixed(1) + 'px,' + pv.y.toFixed(1) + 'px,0)';
    return Math.abs(pv.tx - pv.x) > 0.3 || Math.abs(pv.ty - pv.y) > 0.3;
  }

  /* ---------- Loop de animação (sob demanda) ---------- */
  var rafId = 0;
  function schedule() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function tick() {
    rafId = 0;
    var y = window.scrollY;
    updateHeader(y);
    var more = false;
    if (!reduceMotion) more = renderHero(y) || more;
    more = renderPreview() || more;
    if (more) schedule();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { heroH = hero.offsetHeight; lastY = -1; updateProgress(); schedule(); });
  updateProgress();
  schedule();

  /* ---------- Revelar ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
      var idx = siblings.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 90, 360) + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Formulário → WhatsApp ---------- */
  var form = document.getElementById('quoteForm');
  var note = document.getElementById('formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = form.nome.value.trim();
    var field = form.nome.closest('.field');
    if (!nome) {
      field.classList.add('has-error');
      note.textContent = 'Por favor, informe seu nome.';
      form.nome.focus();
      return;
    }
    field.classList.remove('has-error');
    note.textContent = '';

    var tipo = form.querySelector('input[name="tipo"]:checked');
    var lines = [
      'Olá Renato! Vim pelo site e gostaria de um orçamento.',
      '',
      '*Nome:* ' + nome,
      '*Interesse:* ' + (tipo ? tipo.value : '-')
    ];
    if (form.local.value.trim()) lines.push('*Local:* ' + form.local.value.trim());
    if (form.msg.value.trim()) lines.push('*Projeto:* ' + form.msg.value.trim());

    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
