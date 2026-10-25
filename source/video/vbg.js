/* Napa Wino — ambient background video loops (v6.16)
   Markup: <section class="... vbg"><video class="vbg-v" data-clip="clip-train"
           muted loop playsinline preload="none" poster="/video/clip-train.jpg"
           aria-hidden="true" tabindex="-1"></video> ... </section>
   - Sources are attached only when the section nears the viewport (lazy)
   - Plays while visible, pauses when scrolled away
   - Always autoplays (v6.18: no longer held back for reduced-motion/Save-Data —
     the clips are short, slow, muted loops of 60-480KB)
   - If the browser blocks autoplay (e.g. iOS Low Power Mode), retries on the
     visitor's first touch/scroll/key, and the poster shows until then
   - Every loop gets a pause button (WCAG 2.2.2) */
(function () {
  var still = false;
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
  var blocked = [];
  function play(v) {
    load(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { if (blocked.indexOf(v) < 0) blocked.push(v); });
  }
  // Autoplay refused (Low Power Mode etc.): any first interaction counts as a gesture
  function retry() {
    var list = blocked.slice(); blocked = [];
    list.forEach(function (v) { if (!v._userPaused) play(v); });
  }
  ['touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(function (ev) {
    window.addEventListener(ev, retry, { passive: true });
  });

  vids.forEach(function (v) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vbg-toggle';
    v.parentNode.appendChild(b);
    v._userPaused = still;
    label(b, still);
    v.addEventListener('playing', function () { label(b, false); });
    v.addEventListener('pause', function () { if (v._userPaused) label(b, true); });
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
