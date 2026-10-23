/* Napa Wino — ambient background video loops (v6.16)
   Markup: <section class="... vbg"><video class="vbg-v" data-clip="clip-train"
           muted loop playsinline preload="none" poster="/video/clip-train.jpg"
           aria-hidden="true" tabindex="-1"></video> ... </section>
   - Sources are attached only when the section nears the viewport (lazy)
   - Plays while visible, pauses when scrolled away
   - prefers-reduced-motion / Save-Data: stays on the poster until the visitor presses play
   - Every loop gets a pause/play button (WCAG 2.2.2) */
(function () {
  var mq = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};
  var still = !!((mq && mq.matches) || conn.saveData);
  var vids = Array.prototype.slice.call(document.querySelectorAll('video.vbg-v'));
  if (!vids.length) return;

  function load(v) {
    if (v.getAttribute('data-loaded')) return;
    v.setAttribute('data-loaded', '1');
    var n = v.getAttribute('data-clip');
    v.innerHTML = '<source src="/video/' + n + '.webm" type="video/webm">' +
                  '<source src="/video/' + n + '.mp4" type="video/mp4">';
    v.muted = true;
    v.load();
  }
  function label(b, paused) {
    b.textContent = paused ? '▶' : '❚❚';
    b.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  }
  function play(v) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  vids.forEach(function (v) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vbg-toggle';
    v.parentNode.appendChild(b);
    v._userPaused = still;
    label(b, still);
    b.addEventListener('click', function () {
      if (v.paused) { v._userPaused = false; play(v); label(b, false); }
      else { v._userPaused = true; v.pause(); label(b, true); }
    });
  });

  if (!('IntersectionObserver' in window)) {
    vids.forEach(function (v) { if (!v._userPaused) play(v); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (!v._userPaused) play(v); }
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '200px 0px' });
  vids.forEach(function (v) { io.observe(v); });
})();
