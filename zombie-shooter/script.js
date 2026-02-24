// game.js
// Basic zombie shooter - single-file example

// ---- Setup ----
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// Assets (replace filenames with yours)
const assets = {
  zombieWalk: createImage("zombie.gif"),
  zombieDead: createImage("deadzombie.gif"),
  zombieAttack: createImage("zombieattack.gif"),
  shootSound: new Audio("win.mp3"),
  zombieDeathSound: new Audio("lost.mp3"),
  bgMusic: new Audio("assets/bgMusic.mp3")
};

// helper to create image and handle load
function createImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Prevent autoplay policy issues: start audio on first user gesture
let audioStarted = false;
function ensureAudioStarted() {
  if (!audioStarted) {
    try {
      assets.bgMusic.loop = true;
      assets.bgMusic.volume = 0.4;
      assets.bgMusic.play().catch(e => {/* ignore until user gesture */});
    } catch (e) {}
    audioStarted = true;
  }
}

// ---- Game state ----
const player = {
  x: W / 2,
  y: H / 2,
  radius: 16,
  speed: 220,     // px per second
  angle: 0,
  hp: 100,
  maxHp: 100,
  ammo: 30
};

let bullets = [];
let zombies = [];
let score = 0;
let level = 1;
let zombiesToSpawn = 5;
let gameOver = false;
let lastSpawnTime = 0;
let spawnInterval = 1.0; // seconds between spawn when wave active

// Input
const keys = {};
let mouse = { x: 0, y: 0, down: false };

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  // restart on Enter
  if (e.key === "Enter" && gameOver) restartGame();
  // play audio on first gesture
  ensureAudioStarted();
});
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", (e) => {
  mouse.down = true;
  ensureAudioStarted();
  shoot(); // immediate shot on click
});
canvas.addEventListener("mouseup", (e) => { mouse.down = false; });

// ---- Game functions ----
function restartGame() {
  bullets = [];
  zombies = [];
  score = 0;
  level = 1;
  zombiesToSpawn = 5;
  player.x = W / 2;
  player.y = H / 2;
  player.hp = player.maxHp;
  player.ammo = 30;
  gameOver = false;
  lastSpawnTime = 0;
  spawnInterval = 0.8;
  if (!audioStarted) ensureAudioStarted();
}

function shoot() {
  if (gameOver) return;
  if (player.ammo <= 0) return;
  // compute direction
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const len = Math.hypot(dx, dy) || 1;
  // bullet speed in px/sec
  const speed = 600;
  bullets.push({
    x: player.x,
    y: player.y,
    vx: (dx / len) * speed,
    vy: (dy / len) * speed,
    radius: 5,
    life: 1.8 // seconds
  });
  player.ammo--;
  playSound("shoot");
}

function playSound(name) {
  const s = {
    shoot: assets.shootSound,
    zombieDeath: assets.zombieDeathSound,
    bg: assets.bgMusic
  }[name];
  if (!s) return;
  try {
    s.currentTime = 0;
    s.play();
  } catch (e) { /* ignore autoplay errors */ }
}

function spawnZombie() {
  // spawn on a random side outside the canvas
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 30;
  if (side === 0) { x = -margin; y = Math.random() * H; }
  if (side === 1) { x = W + margin; y = Math.random() * H; }
  if (side === 2) { x = Math.random() * W; y = -margin; }
  if (side === 3) { x = Math.random() * W; y = H + margin; }

  const baseSpeed = 40;
  const speed = baseSpeed + level * 8 + Math.random() * 20;
  const hp = 1 + Math.floor(level / 2);
  zombies.push({
    x, y,
    radius: 18,
    speed,
    hp,
    state: "walk", // or 'dead' or 'attack'
    sprite: assets.zombieWalk,
    spriteTimer: 0
  });
}

// ---- Update loop ----
let lastTime = performance.now();
function update(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // clamp dt
  lastTime = now;
  if (gameOver) return;

  // player angle
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // movement via keys (use WASD or arrow keys)
  let dx = 0, dy = 0;
  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;
  // normalize
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * player.speed * dt;
    player.y += (dy / len) * player.speed * dt;
    // clamp to canvas
    player.x = Math.max(player.radius, Math.min(W - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(H - player.radius, player.y));
  }

  // continuous shooting if mouse down (rate-limited)
  if (mouse.down) {
    // simple auto-fire: every 0.18 seconds
    if (!update._lastAutoFire || now - update._lastAutoFire > 180) {
      shoot();
      update._lastAutoFire = now;
    }
  }

  // bullets update
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    // remove if offscreen or life <= 0
    if (b.life <= 0 || b.x < -50 || b.x > W + 50 || b.y < -50 || b.y > H + 50) {
      bullets.splice(i, 1);
    }
  }

  // zombies update: move toward player
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (z.state === "dead") {
      // dead zombies could have timer; remove after a bit
      z.spriteTimer = (z.spriteTimer || 0) + dt;
      if (z.spriteTimer > 1.0) zombies.splice(i, 1);
      continue;
    }
    const vx = player.x - z.x;
    const vy = player.y - z.y;
    const dist = Math.hypot(vx, vy) || 1;
    const nx = vx / dist;
    const ny = vy / dist;

    // if close enough -> attack
    if (dist < z.radius + player.radius + 6) {
      // attack
      z.state = "attack";
      // damage player over time
      if (!z._attackTimer) z._attackTimer = 0;
      z._attackTimer += dt;
      if (z._attackTimer >= 0.45) {
        player.hp -= 8; // damage per hit
        z._attackTimer = 0;
      }
      playSound("zombieDeath"); // optional attack sound or separate attack sound

    } else {
      // walk toward player
      z.x += nx * z.speed * dt;
      z.y += ny * z.speed * dt;
      z.state = "walk";
    }
  }

  // collisions: bullets vs zombies
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dxz = z.x - b.x;
      const dyz = z.y - b.y;
      const d = Math.hypot(dxz, dyz);
      if (d < z.radius + b.radius) {
        // hit
        z.hp -= 1;
        bullets.splice(j, 1);
        if (z.hp <= 0) {
          // die
          z.state = "dead";
          z.sprite = assets.zombieDead;
          z.spriteTimer = 0;
          score += 10;
          playSound("zombieDeath");
        }
        break; // move to next zombie
      }
    }
  }

  // player vs zombies: collision reduces health when close (handled in zombie update)
  if (player.hp <= 0) {
    gameOver = true;
    // stop music optionally
    try { assets.bgMusic.pause(); assets.bgMusic.currentTime = 0; } catch (e) {}
  }

  // spawn logic: spawn until we reach zombiesToSpawn for the level
  if (zombies.filter(z => z.state !== "dead").length < zombiesToSpawn) {
    if (now - lastSpawnTime > spawnInterval * 1000) {
      spawnZombie();
      lastSpawnTime = now;
    }
  }

  // when wave cleared -> next level
  if (zombies.filter(z => z.state !== "dead").length === 0 && bullets.length === 0) {
    // small delay before starting next level
    if (!update._nextLevelTimer) update._nextLevelTimer = 0;
    update._nextLevelTimer += dt;
    if (update._nextLevelTimer > 1.1) {
      level++;
      zombiesToSpawn = 4 + level * 2;
      player.ammo = Math.min(60, player.ammo + 10); // small ammo bonus
      spawnInterval = Math.max(0.35, spawnInterval - 0.03);
      update._nextLevelTimer = 0;
    }
  } else {
    update._nextLevelTimer = 0;
  }
}

// ---- Render ----
function drawCircle(x, y, r, fillStyle) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Level: " + level, 20, 55);
}

function drawHealthBar() {
  // background
  ctx.fillStyle = "red";
  ctx.fillRect(20, 70, 100, 12);
  // current health
  ctx.fillStyle = "green";
  const hpWidth = Math.max(0, (player.hp / player.maxHp) * 100);
  ctx.fillRect(20, 70, hpWidth, 12);
  ctx.strokeStyle = "black";
  ctx.strokeRect(20, 70, 100, 12);
}

function drawAmmo() {
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText("Ammo: " + player.ammo, 20, 100);
}

function drawGameOver() {
  if (!gameOver) return;
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "red";
  ctx.font = "48px Arial";
  ctx.fillText("GAME OVER", W / 2 - 150, H / 2 - 20);
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.fillText("Final Score: " + score, W / 2 - 80, H / 2 + 20);
  ctx.fillText("Press ENTER to Restart", W / 2 - 120, H / 2 + 60);
}

function render() {
  // clear
  ctx.clearRect(0, 0, W, H);

  // background
  ctx.fillStyle = "#ffffffff";
  ctx.fillRect(0, 0, W, H);

  // draw player (simple circle)
  drawCircle(player.x, player.y, player.radius, "brown");
  // optional: draw aiming line
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();

  // draw bullets
  bullets.forEach(b => {
    drawCircle(b.x, b.y, b.radius, "orange");
  });

  // draw zombies
  zombies.forEach(z => {
    const w = z.radius * 2;
    const h = z.radius * 2;
    if (z.sprite && z.sprite.complete) {
      // draw GIF image centered
      ctx.drawImage(z.sprite, z.x - z.radius, z.y - z.radius, w, h);
    } else {
      // fallback: circle
      const color = (z.state === "dead") ? "darkred" : "green";
      drawCircle(z.x, z.y, z.radius, color);
    }
  });

  // UI
  drawScore();
  drawHealthBar();
  drawAmmo();

  // game over overlay
  drawGameOver();
}

// ---- Main loop ----
function gameLoop(now) {
  update(now || performance.now());
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame((t) => {
  lastTime = t;
  requestAnimationFrame(gameLoop);
});
