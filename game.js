(() => {
  const IMG_W = 1376, IMG_H = 768;
  const FRAMES = 20, FPS = 24;
  const GROUND = 0.855;      // ទីតាំងជើងលើផ្លូវ (ភាគរយនៃកម្ពស់រូប)
  const CHAR_H = 0.30;       // កម្ពស់តួអង្គ (ភាគរយនៃកម្ពស់រូប)
  const SPEED = 0.16;        // ល្បឿន (ទទឹងរូប/វិនាទី)
  const CARRY_FRAMES = 34, CARRY_FPS = 22, NEAR = 0.9; // NEAR = ចម្ងាយជិត (គុណនឹងកម្ពស់តួអង្គ)
  let girlX = 0.705;      // ទីតាំងតួស្រីត្រង់ស្លាកក្ដីស្រលាញ់
  const GIRL_SCALE = 0.92;   // ទំហំតួស្រី (1 = ស្មើតួប្រុស)
  const MIN_X = 0.05, MAX_X = 0.95;

  const $ = id => document.getElementById(id);
  const btnCarry = $('btnCarry'), world = $('world'), girl = $('girl'), bg = $('bg'), player = $('player');
  const walk = [], carry = [], idle = new Image(), carryIdle = new Image();
  idle.src = 'img/idle.png';
  carryIdle.src = 'img/carry_idle.png';
  for (let i = 1; i <= CARRY_FRAMES; i++) {
    const im = new Image();
    im.src = 'img/carry/' + String(i).padStart(2, '0') + '.png';
    carry.push(im);
  }
  for (let i = 1; i <= FRAMES; i++) {
    const im = new Image();
    im.src = 'img/walk/' + String(i).padStart(2, '0') + '.png';
    walk.push(im);
  }

  let carrying = false;
  let px = 0.08, dir = 1, move = 0, frame = 0, acc = 0;
  let W, H, scale, worldW, charH;
  const keys = {left: false, right: false, bl: false, br: false};

  function layout() {
    W = innerWidth; H = innerHeight;
    scale = Math.max(W / IMG_W, H / IMG_H);   // ពេញអេក្រង់គ្រប់ទំហំ
    worldW = IMG_W * scale;
    const worldH = IMG_H * scale;
    world.style.width = worldW + 'px';
    world.style.height = worldH + 'px';
    charH = worldH * CHAR_H;
    player.style.height = charH + 'px';
    player.style.width = 'auto';
    girl.style.height = charH * GIRL_SCALE + 'px';
    render();
    placeGirl();
  }

  function render() {
    const worldH = IMG_H * scale;
    const x = px * worldW;
    const camX = Math.max(0, Math.min(worldW - W, x - W / 2));
    const camY = (worldH - H) / 2;
    world.style.transform = `translate3d(${-camX}px,${-camY}px,0)`;
    const y = worldH * GROUND - charH;
    player.style.transform = `translate3d(${x - player.offsetWidth / 2}px,${y}px,0) scaleX(${dir})`;
  }

  function placeGirl() {
    const y = IMG_H * scale * GROUND - charH * GIRL_SCALE;
    girl.style.transform = `translate3d(${girlX * worldW - girl.offsetWidth / 2}px,${y}px,0)`;
  }

  function setFrame() {
    const src = carrying ? (move ? carry[frame] : carryIdle) : (move ? walk[frame] : idle);
    if (player.src !== src.src) player.src = src.src;
  }

  let last = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    move = ((keys.right || keys.br) ? 1 : 0) - ((keys.left || keys.bl) ? 1 : 0);
    if (move) {
      dir = move;
      px = Math.max(MIN_X, Math.min(MAX_X, px + move * SPEED * dt));
      acc += dt * (carrying ? CARRY_FPS : FPS);
      frame = Math.floor(acc) % (carrying ? CARRY_FRAMES : FRAMES);
    } else { acc = 0; frame = 0; }
    const near = Math.abs(px - girlX) * worldW < charH * NEAR;
    const ok = carrying || near;
    btnCarry.disabled = !ok;
    btnCarry.classList.toggle('ready', ok);
    setFrame();
    render();
    requestAnimationFrame(loop);
  }

  // សម្លេងចុចប៊ូតុង
  const clickSnd = new Audio('sound/button.mp3');
  clickSnd.preload = 'auto';
  function playClick() {
    try {
      const a = clickSnd.cloneNode();
      a.volume = 0.8;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  }

  // តន្ត្រី Background
  const TRACKS = ['sound/bgm.mp3', 'sound/bgm2.mp3'];
  let track = 0;
  const bgm = new Audio(TRACKS[0]);
  bgm.loop = false; bgm.volume = 0.5; bgm.preload = 'auto';
  const btnMusic = $('btnMusic');
  let userPaused = false;
  function syncMusicBtn() {
    const playing = !bgm.paused;
    btnMusic.textContent = playing ? '⏸' : '🎵';
    btnMusic.classList.toggle('off', !playing);
  }
  function startMusic() {
    if (userPaused || !bgm.paused) return;
    const p = bgm.play();
    if (p && p.then) p.then(syncMusicBtn).catch(() => {});
  }
  startMusic();   // ព្យាយាមលេងភ្លាម (browser ខ្លះរារាំង)
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    addEventListener(ev, e => { if (e.target !== btnMusic && e.target !== $('btnNext')) startMusic(); }, {passive: true}));
  btnMusic.addEventListener('click', () => {
    playClick();
    if (bgm.paused) { userPaused = false; bgm.play().catch(() => {}); }
    else { userPaused = true; bgm.pause(); }
    syncMusicBtn();
  });
  function nextTrack() {
    track = (track + 1) % TRACKS.length;
    bgm.src = TRACKS[track];
    bgm.currentTime = 0;
    if (!userPaused) bgm.play().catch(() => {});
    syncMusicBtn();
  }
  bgm.addEventListener('ended', nextTrack);   // ចប់បទ → បទបន្ទាប់
  $('btnNext').addEventListener('click', () => { playClick(); nextTrack(); });
  bgm.addEventListener('play', syncMusicBtn);
  bgm.addEventListener('pause', syncMusicBtn);
  syncMusicBtn();

  // ប៊ូតុង (ប៉ះ/ម៉ៅស៍)
  function bind(id, key) {
    const b = $(id);
    const on = e => { e.preventDefault(); playClick(); keys[key] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
    const off = e => { e.preventDefault(); keys[key] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(n => b.addEventListener(n, off));
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  bind('btnLeft', 'bl'); bind('btnRight', 'br');

  // ប៊ូតុង បី / ដាក់ចុះ
  btnCarry.addEventListener('click', () => {
    playClick();
    if (!carrying) {
      carrying = true; girl.style.display = 'none'; btnCarry.textContent = '⬇ ដាក់ចុះ';
    } else {
      carrying = false; girlX = px; girl.style.display = ''; placeGirl(); btnCarry.textContent = '🤗 បី';
    }
    frame = 0; acc = 0;
  });

  // ក្ដារចុច
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  });
  addEventListener('keyup', e => {
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  addEventListener('resize', layout);
  addEventListener('orientationchange', () => setTimeout(layout, 200));

  // ចាប់ផ្តើមពេលរូបទាំងអស់ផ្ទុករួច
  const all = [bg, idle, girl, carryIdle, ...walk, ...carry];
  Promise.all(all.map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; }))).then(() => {
    $('loading').classList.add('hide');
    layout();
    requestAnimationFrame(loop);
  });
})();
