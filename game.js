(() => {
  // ឆាក: ខាងក្រៅ (bg_wide.jpg = 2 រូបភ្ជាប់គ្នា) និង ក្នុងផ្ទះ (house.jpg)
  const OUT = {src: 'img/bg_wide.jpg', w: 1376, h: 768, screens: 2, ground: 0.855};
  const IN  = {src: 'img/house.jpg',   w: 1408, h: 768, screens: 1, ground: 0.895};
  const DOOR_X = (1376 + 948) / 2752;   // ទីតាំងទ្វារផ្ទះ (ឆាកទី 2)
  let girlInside = false, cur = OUT, inside = false, fading = false, saved = null;
  const FRAMES = 20, FPS = 24;
  const CHAR_H = 0.30;       // កម្ពស់តួអង្គ (ភាគរយនៃកម្ពស់រូប)
  const SPEED = 0.16;        // ល្បឿន (ទទឹងរូប/វិនាទី)
  const CARRY_FRAMES = 34, CARRY_FPS = 22, NEAR = 0.9; // NEAR = ចម្ងាយជិត (គុណនឹងកម្ពស់តួអង្គ)
  const GIRL_FRAMES = 32;
  let girlX = 0.705 / OUT.screens;      // ទីតាំងតួស្រីត្រង់ស្លាកក្ដីស្រលាញ់
  const GIRL_SCALE = 0.92;   // ទំហំតួស្រី (1 = ស្មើតួប្រុស)
  const minX = () => 0.05 / cur.screens, maxX = () => 1 - 0.05 / cur.screens;

  const $ = id => document.getElementById(id);
  const btnCarry = $('btnCarry'), world = $('world'), girl = $('girl'), bg = $('bg'), player = $('player');
  const gwalk = [], girlIdle = new Image();
  girlIdle.src = 'img/girl.png';
  for (let i = 1; i <= GIRL_FRAMES; i++) {
    const im = new Image();
    im.src = 'img/girl_walk/' + String(i).padStart(2, '0') + '.png';
    gwalk.push(im);
  }
  const btnSwitch = $('btnSwitch'), btnHouse = $('btnHouse'), fade = $('fade');
  const houseImg = new Image(); houseImg.src = IN.src;
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

  // ឈុតទី 2 របស់តួស្រី (ឈរ / ដើរ / ត្រូវបានបី)
  const gwalk2 = [], carry2 = [], girlIdle2 = new Image(), carryIdle2 = new Image();
  girlIdle2.src = 'img/girl2.png';
  carryIdle2.src = 'img/carry2_idle.png';
  for (let i = 1; i <= 39; i++) { const im = new Image(); im.src = 'img/girl2_walk/' + String(i).padStart(2, '0') + '.png'; gwalk2.push(im); }
  for (let i = 1; i <= 33; i++) { const im = new Image(); im.src = 'img/carry2/' + String(i).padStart(2, '0') + '.png'; carry2.push(im); }
  let outfit = 1;
  const btnOutfit = $('btnOutfit');
  const WARDROBE_X = 1235 / 1408;   // ទីតាំងទូខោអាវក្នុងផ្ទះ

  let carrying = false;
  let active = 'boy';            // តួអង្គដែលកំពុងបញ្ជា: 'boy' ឬ 'girl'
  let boyX = 0.08 / OUT.screens, boyDir = 1, girlDir = -1, move = 0, frame = 0, acc = 0;
  let W, H, scale, worldW, charH;
  const keys = {left: false, right: false, bl: false, br: false};

  function layout() {
    W = innerWidth; H = innerHeight;
    scale = Math.max(W / cur.w, H / cur.h);   // ពេញអេក្រង់គ្រប់ទំហំ
    worldW = cur.w * cur.screens * scale;
    const worldH = cur.h * scale;
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
    const worldH = cur.h * scale;
    const cx = (active === 'boy' ? boyX : girlX) * worldW;
    const camX = Math.max(0, Math.min(worldW - W, cx - W / 2));
    const camY = (worldH - H) / 2;
    world.style.transform = `translate3d(${-camX}px,${-camY}px,0)`;
    const gy = worldH * cur.ground;
    player.style.transform = `translate3d(${boyX * worldW - player.offsetWidth / 2}px,${gy - charH}px,0) scaleX(${boyDir})`;
    if (!(carrying)) girl.style.transform = `translate3d(${girlX * worldW - girl.offsetWidth / 2}px,${gy - charH * GIRL_SCALE}px,0) scaleX(${girlDir})`;
    girl.style.display = (carrying || (inside && active === 'boy' && !girlInside)) ? 'none' : '';
    player.style.display = (inside && active === 'girl') ? 'none' : '';
    player.style.zIndex = active === 'boy' ? 2 : 1;
    girl.style.zIndex = active === 'girl' ? 2 : 1;
  }

  function placeGirl() { render(); }

  function setFrame() {
    const bm = active === 'boy' && move;
    const cA = outfit === 1 ? carry : carry2, cI = outfit === 1 ? carryIdle : carryIdle2;
    const src = carrying ? (bm ? cA[frame] : cI) : (bm ? walk[frame] : idle);
    if (player.src !== src.src) player.src = src.src;
    const gs = (active === 'girl' && move) ? (outfit === 1 ? gwalk : gwalk2)[frame] : (outfit === 1 ? girlIdle : girlIdle2);
    if (girl.src !== gs.src) girl.src = gs.src;
  }

  let last = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    move = fading ? 0 : ((keys.right || keys.br) ? 1 : 0) - ((keys.left || keys.bl) ? 1 : 0);
    const isBoy = active === 'boy';
    const nFrames = isBoy ? (carrying ? (outfit === 1 ? carry : carry2).length : FRAMES) : (outfit === 1 ? gwalk : gwalk2).length;
    if (move) {
      if (isBoy) { boyDir = move; boyX = Math.max(minX(), Math.min(maxX(), boyX + move * SPEED / cur.screens * dt)); }
      else { girlDir = move; girlX = Math.max(minX(), Math.min(maxX(), girlX + move * SPEED / cur.screens * dt)); }
      acc += dt * (isBoy ? (carrying ? CARRY_FPS : FPS) : FPS);
      frame = Math.floor(acc) % nFrames;
    } else { acc = 0; frame = 0; }
    const near = (!inside || girlInside) && Math.abs(boyX - girlX) * worldW < charH * NEAR;
    btnCarry.style.display = (active === 'boy' && (!inside || carrying || girlInside)) ? '' : 'none';
    btnSwitch.style.opacity = inside ? .45 : '';
    const ax = active === 'boy' ? boyX : girlX;
    const atDoor = !inside && Math.abs(ax - DOOR_X) * worldW < charH * 0.9;
    const showHouse = (atDoor || inside) && !fading;
    if (showHouse !== btnHouse.classList.contains('show')) btnHouse.classList.toggle('show', showHouse);
    const nearWardrobe = inside && active === 'girl' && Math.abs(girlX - WARDROBE_X) * worldW < charH * GIRL_SCALE * 0.9;
    const showOutfit = nearWardrobe && !fading;
    if (showOutfit !== btnOutfit.classList.contains('show')) btnOutfit.classList.toggle('show', showOutfit);
    const hl = inside ? '🚪 ចេញ' : '🏠 ផ្ទះ';
    if (btnHouse.textContent !== hl) btnHouse.textContent = hl;
    const ok = carrying || near;
    btnCarry.disabled = !ok;
    btnCarry.classList.toggle('ready', ok);
    btnSwitch.disabled = carrying || inside;
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
    addEventListener(ev, e => { if (e.target !== btnMusic && e.target !== $('btnNext') && e.target !== btnSwitch) startMusic(); }, {passive: true}));
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
      carrying = true; girlInside = false; girl.style.display = 'none'; btnCarry.textContent = '⬇ ដាក់ចុះ';
    } else {
      carrying = false; girlInside = inside; girlX = boyX; girlDir = -boyDir; girl.style.display = ''; btnCarry.textContent = '🤗 បី';
    }
    frame = 0; acc = 0;
  });

  // ប៊ូតុង ប្ដូរតួអង្គ
  btnSwitch.addEventListener('click', () => {
    if (carrying) return;
    playClick();
    active = active === 'boy' ? 'girl' : 'boy';
    btnSwitch.textContent = active === 'boy' ? '🔄 👧' : '🔄 👦';
    frame = 0; acc = 0;
  });

  // ប៊ូតុង ផ្ទះ / ចេញ (ងងឹត រួចភ្លឺនៅឆាកថ្មី)
  function transition(change) {
    if (fading) return;
    fading = true; fade.style.opacity = 1;
    setTimeout(() => {
      change();
      bg.src = cur.src;
      layout();
      fade.style.opacity = 0;
      setTimeout(() => { fading = false; }, 400);
    }, 400);
  }
  btnHouse.addEventListener('click', () => {
    if (fading) return;
    playClick();
    if (!inside) {
      transition(() => {
        saved = {boyX, girlX};
        inside = true; cur = IN;
        if (active === 'boy') { boyX = 0.12; boyDir = 1; } else { girlX = 0.12; girlDir = 1; }
      });
    } else {
      transition(() => {
        inside = false; cur = OUT;
        boyX = saved.boyX; girlX = saved.girlX;
        if (active === 'boy') boyX = DOOR_X; else girlX = DOOR_X;
        if (girlInside) {            // តួស្រីដែលដាក់ចុះក្នុងផ្ទះ ចេញមកជាមួយ
          girlX = DOOR_X - 0.8 * CHAR_H * OUT.h / (OUT.w * OUT.screens);
          girlDir = 1; girlInside = false;
        }
      });
    }
  });

  // ប៊ូតុង ប្ដូរឈុត (តួស្រីនៅក្បែរទូខោអាវក្នុងផ្ទះ)
  btnOutfit.addEventListener('click', () => {
    if (fading) return;
    playClick();
    transition(() => { outfit = outfit === 1 ? 2 : 1; });
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

  // ចាប់ផ្តើមពេលរូបទាំងអស់ផ្ទុករួច (បើយូរជាង 6 វិនាទី ចាប់ផ្តើមតែម្តង)
  let started = false;
  function start() {
    if (started) return; started = true;
    $('loading').classList.add('hide');
    layout();
    requestAnimationFrame(loop);
  }
  const all = [bg, houseImg, idle, girlIdle, carryIdle, girlIdle2, carryIdle2, ...walk, ...carry, ...gwalk, ...gwalk2, ...carry2];
  Promise.all(all.map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; }))).then(start);
  setTimeout(start, 6000);
})();
