(() => {
  // ឆាក: ខាងក្រៅ (bg_wide.jpg = 2 រូបភ្ជាប់គ្នា) និង ក្នុងផ្ទះ (house.jpg)
  let night = false;   // ក្រោយគេងហើយងើប → ផ្ទៃខាងក្រៅជាពេលយប់
  const OUT = {get src() { return night ? 'img/bg_night.jpg' : 'img/bg_wide.jpg'; }, w: 1376, h: 768, screens: 2, ground: 0.855, char: 0.30};
  const IN  = {src: 'img/house.jpg',   w: 1408, h: 768, screens: 1, ground: 0.895, char: 0.47};   // ក្នុងផ្ទះ តួអង្គធំជាង ដើម្បីសមនឹងគ្រែ/មនុស្សគេង
  const DOOR_X = (1376 + 948) / 2752;   // ទីតាំងទ្វារផ្ទះ (ឆាកទី 2)
  let cur = OUT, inside = false, fading = false;   // inside = ឆាកដែលកំពុងមើល
  let boyIn = false, girlIn = false;               // តួអង្គនីមួយៗ នៅក្នុងផ្ទះឬអត់
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
  const nightImg = new Image(); nightImg.src = 'img/bg_night.jpg';
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
  // ឈុតទី 2 របស់តួប្រុស: ឈរ / ដើរ / បីតួស្រីឈុតទី 1 / បីតួស្រីឈុតទី 2
  const b2walk = [], b2c1 = [], b2c2 = [], b2idle = new Image(), b2c1Idle = new Image(), b2c2Idle = new Image();
  b2idle.src = 'img/b2_idle.png'; b2c1Idle.src = 'img/b2c1_idle.png'; b2c2Idle.src = 'img/b2c2_idle.png';
  const loadSeq = (arr, dir, n) => { for (let i = 1; i <= n; i++) { const im = new Image(); im.src = 'img/' + dir + '/' + String(i).padStart(2, '0') + '.png'; arr.push(im); } };
  loadSeq(b2walk, 'b2_walk', 29); loadSeq(b2c1, 'b2c1', 29); loadSeq(b2c2, 'b2c2', 32);
  // ជ្រើសរូបពេលបី តាមឈុតតួប្រុស (boyOutfit) និងឈុតតួស្រី (outfit)
  const carrySets = {
    '11': {idle: carryIdle, frames: carry},  '12': {idle: carryIdle2, frames: carry2},
    '21': {idle: b2c1Idle,  frames: b2c1},   '22': {idle: b2c2Idle,  frames: b2c2}
  };
  // គេង: ពេលតួស្រីនៅជិតគ្រែក្នុងផ្ទះ
  const btnSleep = $('btnSleep');
  const BED_X = 0.425, BED_HALF = 0.13;          // ទីតាំងគ្រែក្នុងផ្ទះ (ភាគរយនៃទទឹងឆាក)
  let boySleep = false, girlSleep = false;           // តួអង្គនីមួយៗកំពុងគេងឬអត់
  const actSleep = () => active === 'boy' ? boySleep : girlSleep;
  const mk = s => { const im = new Image(); im.src = s; return im; };
  const boySleepImgs = [mk('img/sleepB1.jpg'), mk('img/sleepB2.jpg')];
  const pairImgs = {'11': mk('img/sleepP11.jpg'), '12': mk('img/sleepP12.jpg'), '21': mk('img/sleepP21.jpg'), '22': mk('img/sleepP22.jpg')};
  // ផ្ទៃខាងក្រោយតាមស្ថានភាព: ខាងក្រៅ (ថ្ងៃ/យប់) ឬក្នុងផ្ទះ (គេងម្នាក់ / គេងទាំង 2)
  function viewSrc() {
    if (!inside) return cur.src;
    if (boySleep && girlSleep) return pairImgs['' + boyOutfit + outfit].src;
    if (boySleep) return boySleepImgs[boyOutfit - 1].src;
    if (girlSleep) return sleepImgs[outfit === 1 ? 0 : 1].src;
    return IN.src;
  }
  const sleepImgs = ['img/sleep1.jpg', 'img/sleep2.jpg'].map(s => { const im = new Image(); im.src = s; return im; });
  let outfit = 1, boyOutfit = 1;   // ឈុតតួស្រី / ឈុតតួប្រុស
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
    charH = worldH * cur.char;
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
    girl.style.display = (carrying || girlIn !== inside || girlSleep) ? 'none' : '';
    player.style.display = (boyIn !== inside || boySleep) ? 'none' : '';
    player.style.zIndex = active === 'boy' ? 2 : 1;
    girl.style.zIndex = active === 'girl' ? 2 : 1;
  }

  function placeGirl() { render(); }

  function setFrame() {
    const bm = active === 'boy' && move;
    const cs = carrySets['' + boyOutfit + outfit];
    const bw = boyOutfit === 1 ? walk : b2walk, bi = boyOutfit === 1 ? idle : b2idle;
    const src = carrying ? (bm ? cs.frames[frame] : cs.idle) : (bm ? bw[frame] : bi);
    if (player.src !== src.src) player.src = src.src;
    const gs = (active === 'girl' && move) ? (outfit === 1 ? gwalk : gwalk2)[frame] : (outfit === 1 ? girlIdle : girlIdle2);
    if (girl.src !== gs.src) girl.src = gs.src;
  }

  let last = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    move = (fading || actSleep()) ? 0 : ((keys.right || keys.br) ? 1 : 0) - ((keys.left || keys.bl) ? 1 : 0);
    const isBoy = active === 'boy';
    const nFrames = isBoy ? (carrying ? carrySets['' + boyOutfit + outfit].frames.length : (boyOutfit === 1 ? FRAMES : b2walk.length)) : (outfit === 1 ? gwalk : gwalk2).length;
    if (move) {
      if (isBoy) { boyDir = move; boyX = Math.max(minX(), Math.min(maxX(), boyX + move * SPEED / cur.screens * dt)); }
      else { girlDir = move; girlX = Math.max(minX(), Math.min(maxX(), girlX + move * SPEED / cur.screens * dt)); }
      acc += dt * (isBoy ? (carrying ? CARRY_FPS : FPS) : FPS);
      frame = Math.floor(acc) % nFrames;
    } else { acc = 0; frame = 0; }
    const near = boyIn === girlIn && !girlSleep && Math.abs(boyX - girlX) * worldW < charH * NEAR;
    btnCarry.style.display = active === 'boy' ? '' : 'none';
    const ax = active === 'boy' ? boyX : girlX;
    const atDoor = !inside && Math.abs(ax - DOOR_X) * worldW < charH * 0.9;
    const sl_ = actSleep();
    if (document.body.classList.contains('sleeping') !== sl_) document.body.classList.toggle('sleeping', sl_);
    const showHouse = (atDoor || inside) && !fading && !sl_;
    if (showHouse !== btnHouse.classList.contains('show')) btnHouse.classList.toggle('show', showHouse);
    const nearWardrobe = inside && Math.abs((active === 'girl' ? girlX : boyX) - WARDROBE_X) * worldW < charH * (active === 'girl' ? GIRL_SCALE : 1) * 0.9;
    const showOutfit = nearWardrobe && !fading && !sl_;
    const nearBed = inside && !sl_ && Math.abs((active === 'girl' ? girlX : boyX) - BED_X) < BED_HALF;
    const showSleep = (nearBed || sl_) && !fading;
    if (showSleep !== btnSleep.classList.contains('show')) btnSleep.classList.toggle('show', showSleep);
    const sl = sl_ ? '⏰ ងើប' : '🛏 គេង';
    if (btnSleep.textContent !== sl) btnSleep.textContent = sl;
    if (showOutfit !== btnOutfit.classList.contains('show')) btnOutfit.classList.toggle('show', showOutfit);
    const hl = inside ? '🚪 ចេញ' : '🏠 ផ្ទះ';
    if (btnHouse.textContent !== hl) btnHouse.textContent = hl;
    const ok = carrying || near;
    btnCarry.disabled = !ok;
    btnCarry.classList.toggle('ready', ok);
    btnSwitch.disabled = carrying;
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
      carrying = true; girl.style.display = 'none'; btnCarry.textContent = '⬇ ដាក់ចុះ';
    } else {
      carrying = false; girlIn = boyIn; girlX = boyX; girlDir = -boyDir; girl.style.display = ''; btnCarry.textContent = '🤗 បី';
    }
    frame = 0; acc = 0;
  });

  // ប៊ូតុង ប្ដូរតួអង្គ
  btnSwitch.addEventListener('click', () => {
    if (carrying) return;
    playClick();
    const next = active === 'boy' ? 'girl' : 'boy';
    const target = next === 'boy' ? boyIn : girlIn;   // តួអង្គបន្ទាប់ នៅក្នុងផ្ទះឬអត់
    const apply = () => {
      active = next;
      inside = target; cur = target ? IN : OUT;
      btnSwitch.textContent = active === 'boy' ? '🔄 👧' : '🔄 👦';
      frame = 0; acc = 0;
    };
    if (target !== inside) transition(apply); else apply();
  });

  // ប៊ូតុង ផ្ទះ / ចេញ (ងងឹត រួចភ្លឺនៅឆាកថ្មី)
  function transition(change) {
    if (fading) return;
    fading = true; fade.style.opacity = 1;
    setTimeout(() => {
      change();
      bg.src = viewSrc();
      layout();
      fade.style.opacity = 0;
      setTimeout(() => { fading = false; }, 400);
    }, 400);
  }
  btnHouse.addEventListener('click', () => {
    if (fading) return;
    playClick();
    // ចូល/ចេញ: បានតែតួអង្គដែលកំពុងបញ្ជា (បើកំពុងបីតួស្រី នាងទៅជាមួយ)
    transition(() => {
      if (!inside) {
        inside = true; cur = IN;
        if (active === 'boy') { boyIn = true; boyX = 0.12; boyDir = 1; if (carrying) girlIn = true; }
        else { girlIn = true; girlX = 0.12; girlDir = 1; }
      } else {
        inside = false; cur = OUT;
        if (active === 'boy') { boyIn = false; boyX = DOOR_X; boyDir = 1; if (carrying) girlIn = false; }
        else { girlIn = false; girlX = DOOR_X; girlDir = 1; }
      }
    });
  });

  // ប៊ូតុង គេង / ងើប (ផ្ទៃខាងក្រោយប្ដូរតាមឈុតតួស្រី)
  btnSleep.addEventListener('click', () => {
    if (fading) return;
    playClick();
    transition(() => {
      if (!actSleep()) {
        // ចាប់ផ្តើមគេង: បើកំពុងបីតួស្រី ដាក់នាងចុះ ហើយគេងទាំង 2
        const wasCarrying = carrying;
        if (carrying) { carrying = false; girlIn = boyIn; girlX = boyX; girlDir = -boyDir; btnCarry.textContent = '🤗 បី'; }
        if (active === 'boy') boySleep = true; else girlSleep = true;
        if (wasCarrying) girlSleep = true;
      } else {
        if (active === 'boy') boySleep = false; else girlSleep = false;
        if (!boySleep && !girlSleep) night = !night;   // ងើបគ្រប់គ្នា: ថ្ងៃ ↔ យប់ (ឃើញពេលចេញពីផ្ទះ)
      }
    });
  });

  // ប៊ូតុង ប្ដូរឈុត (តួស្រីនៅក្បែរទូខោអាវក្នុងផ្ទះ)
  btnOutfit.addEventListener('click', () => {
    if (fading) return;
    playClick();
    transition(() => { if (active === 'boy') boyOutfit = boyOutfit === 1 ? 2 : 1; else outfit = outfit === 1 ? 2 : 1; });
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
  const all = [bg, houseImg, nightImg, ...sleepImgs, ...boySleepImgs, ...Object.values(pairImgs), idle, girlIdle, carryIdle, girlIdle2, carryIdle2, ...walk, ...carry, ...gwalk, ...gwalk2, ...carry2, b2idle, b2c1Idle, b2c2Idle, ...b2walk, ...b2c1, ...b2c2];
  Promise.all(all.map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; }))).then(start);
  setTimeout(start, 6000);
})();
