/* Weihnachtsfeiern – Schnee, Lichterkette, Scroll-Einblendung (saisonal) */
(function () {
  var root = document.querySelector('.xmas');
  if (!root) return;
  root.classList.add('js-on');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Lichterkette entlang einer durchhängenden Linie ---------- */
  var lights = root.querySelector('.xmas-lights');
  if (lights) {
    var wire = lights.querySelector('path');
    var list = lights.querySelector('ul');
    var buildLights = function () {
      var w = lights.clientWidth;
      var swags = w < 768 ? 2 : 4;
      var seg = w / swags;
      var d = 'M0,6';
      for (var s = 0; s < swags; s++) {
        d += ' Q' + (seg * s + seg / 2) + ',56 ' + (seg * (s + 1)) + ',6';
      }
      wire.setAttribute('d', d);
      lights.querySelector('svg').setAttribute('viewBox', '0 0 ' + w + ' 70');

      var perSwag = w < 768 ? 6 : 7;
      list.innerHTML = '';
      for (var i = 0; i < swags; i++) {
        for (var j = 1; j < perSwag; j++) {
          var t = j / perSwag;
          var x = seg * i + seg * t;
          // quadratische Bézierkurve: y = (1-t)²·6 + 2(1-t)t·56 + t²·6
          var y = (1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 56 + t * t * 6;
          var li = document.createElement('li');
          li.style.left = x + 'px';
          li.style.top = (y + 3) + 'px';
          list.appendChild(li);
        }
      }
    };
    buildLights();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildLights, 150);
    });
  }

  /* ---------- Scroll-Einblendung ---------- */
  var reveals = root.querySelectorAll('.xmas-reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Schneefall (Canvas) – Weihnachtsbereich & Hero ---------- */
  if (reduceMotion) return;
  document.querySelectorAll('canvas.xmas-snow').forEach(function (canvas) {
    if (canvas.getContext) initSnow(canvas, canvas.parentElement);
  });

  function initSnow(canvas, host) {
    var ctx = canvas.getContext('2d');
    var flakes = [];
    var W = 0, H = 0, dpr = 1, running = false, raf = null, wind = 0, tick = 0;

    function makeFlake(randomY) {
      var r = Math.random() * 2.6 + 0.8;
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : -10,
        r: r,
        vy: r * 0.35 + Math.random() * 0.4,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.005,
        o: Math.random() * 0.5 + 0.45
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth;
      H = host.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(Math.min(160, (W * H) / 9000));
      while (flakes.length < target) flakes.push(makeFlake(true));
      flakes.length = target;
    }

    function frame() {
      tick++;
      wind = Math.sin(tick / 300) * 0.4;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.sway += f.swaySpeed;
        f.y += f.vy;
        f.x += Math.sin(f.sway) * 0.5 + wind * f.r * 0.3;
        if (f.y > H + 10) { flakes[i] = makeFlake(false); continue; }
        if (f.x > W + 10) f.x = -10;
        if (f.x < -10) f.x = W + 10;
        ctx.globalAlpha = f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', resize);

    // Nur animieren, wenn der Bereich sichtbar ist
    var inView = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        inView && !document.hidden ? start() : stop();
      }).observe(host);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : (inView && start());
    });
  }
})();
