// ======================
// Retro Snake — q5play
// ======================


// ── Constants ──────────────────────────────────────────────
const COLS = 25;
let CELL;

// ── Palette ────────────────────────────────────────────────
const COL = {
  board: '#f4dfc3',
  grid: 'rgba(160,98,42,0.10)',
  headFill: '#e8a857',
  headGlow: '#e8a857',
  sauce: '#c0392b',
  sauceDim: '#e74c3c',
  amber: '#e8a857',
  brown: '#a0622a',
  dark: '#1a0a00',
  textLight: '#fff2d8',
  textAmber: '#ffb347',
  overlayBg: 'rgba(0,0,0,0.42)',
};

// ── State ───────────────────────────────────────────────────
let snake, vx, vy, prevVx, prevVy;
let foodX, foodY;
let meatball;
let score, hiScore;
let gameOn, over;
let speedMs, lastTick;
let particles;
let meatballImg;

hiScore = +localStorage.getItem('snakeHS') || 0;

// ── Food sprite ─────────────────────────────────────────────
// ── Food sprite (simple fallback object, avoids q5play dependency)
meatball = {
  img: 'meatball.png',
  w: 0,
  h: 0,
  collider: 'none',
  visible: false,
  x: 0,
  y: 0
};

// ── Helpers ────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(5, '0');
}

function spawnFood() {
  let fx, fy, clash;

  do {
    fx = floor(random(COLS));
    fy = floor(random(COLS));

    clash = snake.some(s => s.x === fx && s.y === fy);
  } while (clash);

  foodX = fx;
  foodY = fy;

  meatball.x = fx * CELL + CELL / 2;
  meatball.y = fy * CELL + CELL / 2;
  meatball.visible = true;
}

// ── Init ────────────────────────────────────────────────────
function init() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];

  vx = 1;
  vy = 0;

  prevVx = 1;
  prevVy = 0;

  score = 0;
  over = false;
  gameOn = false;

  speedMs = 120;
  particles = [];

  lastTick = millis();

  spawnFood();
}

// ── Particles ───────────────────────────────────────────────
function spawnParticles(px, py) {
  const colors = [
    COL.sauce,
    COL.sauceDim,
    COL.amber,
    COL.brown
  ];

  for (let i = 0; i < 12; i++) {
    const angle = random(TWO_PI);
    const spd = random(1, 4);

    particles.push({
      x: px,
      y: py,
      vx: cos(angle) * spd,
      vy: sin(angle) * spd,
      life: 1,
      col: random(colors),
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.07;

    return p.life > 0;
  });
}

// ── Game tick ───────────────────────────────────────────────
function tick() {
  const head = {
    x: snake[0].x + vx,
    y: snake[0].y + vy
  };

  prevVx = vx;
  prevVy = vy;

  // Wall collision
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= COLS ||
    head.y >= COLS
  ) {
    endGame();
    return;
  }

  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === foodX && head.y === foodY) {
    score++;

    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem('snakeHS', hiScore);
    }

    spawnParticles(
      foodX * CELL + CELL / 2,
      foodY * CELL + CELL / 2
    );

    spawnFood();

    speedMs = max(55, 120 - score * 3);
  } else {
    snake.pop();
  }

  updateParticles();
}

function endGame() {
  over = true;
}

function restart() {
  speedMs = 120;
  init();
  gameOn = true;
}

// ── Movement ────────────────────────────────────────────────
function move(dx, dy) {
  if (!gameOn && !over) {
    gameOn = true;
  }

  if (over) {
    restart();
    return;
  }

  if (dx === 1 && prevVx === -1) return;
  if (dx === -1 && prevVx === 1) return;
  if (dy === 1 && prevVy === -1) return;
  if (dy === -1 && prevVy === 1) return;

  vx = dx;
  vy = dy;
}

// ── Draw helpers ────────────────────────────────────────────
function drawGrid() {
  stroke(COL.grid);
  strokeWeight(0.5);

  for (let i = 0; i <= COLS; i++) {
    line(i * CELL, 0, i * CELL, height);
    line(0, i * CELL, width, i * CELL);
  }
}

function drawSnake() {
  noStroke();

  snake.forEach((seg, i) => {
    if (i === 0) {
      drawingContext.shadowColor = COL.headGlow;
      drawingContext.shadowBlur = 8;
      fill(COL.headFill);
    } else {
      drawingContext.shadowBlur = 0;

      const f = 1 - (i / snake.length) * 0.65;

      const r = floor(200 * f + 30);
      const g = floor(120 * f + 10);
      const b = floor(20 * f);

      fill(r, g, b);
    }

    rect(
      seg.x * CELL + 2,
      seg.y * CELL + 2,
      CELL - 4,
      CELL - 4,
      3
    );

    drawingContext.shadowBlur = 0;

    // Eyes
    if (i === 0) {
      fill(COL.dark);

      const ex2 = vx === 0 ? 1 : 0;
      const ey2 = vy === 0 ? 1 : 0;

      const cx = seg.x * CELL + CELL / 2;
      const cy = seg.y * CELL + CELL / 2;

      rect(
        cx + vx * 4 + ey2 * 3 - 1,
        cy + vy * 4 + ex2 * 3 - 1,
        3,
        3
      );

      rect(
        cx + vx * 4 - ey2 * 3 - 1,
        cy + vy * 4 - ex2 * 3 - 1,
        3,
        3
      );
    }
  });
}

function drawParticles() {
  noStroke();

  particles.forEach(p => {
    drawingContext.globalAlpha = p.life;

    fill(p.col);

    rect(p.x - 2, p.y - 2, 4, 4);
  });

  drawingContext.globalAlpha = 1;
}

function drawMeatball() {
  if (!meatball.visible) return;

  push();

  imageMode(CENTER);

  // ensure no tint and normal compositing so image colors draw correctly
  noTint();
  drawingContext.globalAlpha = 1;
  drawingContext.globalCompositeOperation = 'source-over';
  blendMode(BLEND);

  if (meatballImg) {
    image(meatballImg, meatball.x, meatball.y, meatball.w, meatball.h);
  } else {
    // fallback: draw a circle if image hasn't loaded
    noStroke();
    fill(COL.sauce);
    ellipse(meatball.x, meatball.y, meatball.w, meatball.h);
  }

  pop();
}

function drawHUD() {
  textFont('monospace');
  textSize(11);

  noStroke();

  fill(COL.textLight);

  textAlign(LEFT, TOP);
  text(`SCORE ${pad(score)}`, 8, 6);

  textAlign(RIGHT, TOP);
  text(`BEST ${pad(hiScore)}`, width - 8, 6);

  textAlign(LEFT, TOP);
  text(`LV ${floor(score / 5) + 1}`, 8, height - 18);

  textAlign(RIGHT, TOP);
  text(`SPD ${floor(score / 5) + 1}`, width - 8, height - 18);
}

function drawOverlay(title, sub, scoreStr) {
  fill(COL.overlayBg);

  noStroke();

  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textFont('monospace');

  if (over) {
    fill('#ffcab0');

    drawingContext.shadowColor = 'rgba(181,58,45,0.9)';
    drawingContext.shadowBlur = 20;
  } else {
    fill(COL.textLight);

    drawingContext.shadowColor = 'rgba(255,255,255,0.45)';
    drawingContext.shadowBlur = 14;
  }

  textSize(26);
  text(title, width / 2, height / 2 - 60);

  drawingContext.shadowBlur = 0;

  if (scoreStr) {
    fill(COL.textAmber);

    drawingContext.shadowColor = 'rgba(255,179,71,0.8)';
    drawingContext.shadowBlur = 8;

    textSize(12);
    text(scoreStr, width / 2, height / 2 - 10);

    drawingContext.shadowBlur = 0;
  }

  fill('#fff6e6');

  textSize(9);

  text(sub, width / 2, height / 2 + 20);

  textAlign(LEFT, TOP);
}

// ── Main draw loop ──────────────────────────────────────────
function draw() {
  background(COL.board);

  if (gameOn && !over) {
    const now = millis();

    if (now - lastTick >= speedMs) {
      tick();
      lastTick = now;
    }
  }

  drawGrid();
  drawSnake();
  drawMeatball();
  drawParticles();
  drawHUD();

  if (!gameOn && !over) {
    drawOverlay(
      'RETRO SNAKE',
      'PRESS ARROW KEY OR WASD',
      null
    );
  }

  if (over) {
    drawOverlay(
      'GAME OVER',
      'PRESS ARROW / WASD TO RESTART',
      `SCORE ${pad(score)}`
    );
  }
}

// ── Keyboard controls ───────────────────────────────────────
function keyPressed() {
  if (keyCode === UP_ARROW || key === 'w') {
    move(0, -1);
  }

  if (keyCode === DOWN_ARROW || key === 's') {
    move(0, 1);
  }

  if (keyCode === LEFT_ARROW || key === 'a') {
    move(-1, 0);
  }

  if (keyCode === RIGHT_ARROW || key === 'd') {
    move(1, 0);
  }

  if (key === ' ' && over) {
    restart();
  }
}

// ── Boot ────────────────────────────────────────────────────
// ── Setup & Boot ───────────────────────────────────────────
function setup() {
  createCanvas(500, 500);

  CELL = width / COLS;

  // set meatball size now that CELL is defined
  meatball.w = CELL - 2;
  meatball.h = CELL - 2;

  init();
}

function preload() {
  // load the meatball image directly from an inline data URL to avoid live preview proxy auth issues
  meatballImg = loadImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA8klEQVR4AYySMQrCUBBEvwGr4AnsrexyMzuPYOMpPILXSKU2OYG1WAgqmrcwcfL5QgLDzu7OzP4iVSp8p7r+lFCQplGATOumSSA3aO/zIYAlJnBu2wQkPCxnohGMVoMIYICRoRvpc2iPh10FcbNfQ6A+r+xAvACiZPg/seZoAMcjwM0sQC5mVkIEaCHTvntqNNTSjGW1XbypSWaazWpOGcFnro0XEHK5vUYGv+hcIoVEgIYewkWMAC6NV0Kq4/Xx+0v6LSGgpwkjgJew6+6z0QtcRIjDd84jIH+FC8QVpp7r8AiATAlBR5DM9EMAzZSQXPMFAAD//9NqunoAAAAGSURBVAMA2N+Febx6LYMAAAAASUVORK5CYIIA');
}