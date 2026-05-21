// ======================
// Retro Snake
// ======================

// ── Constants ──────────────────────────────────────────────
const COLS = 25;
const HEADER_HEIGHT = 40;

let CELL;

// ── Intro ────────────────────────────────────────────────
let showIntro = true;
let introStart;

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
let snakeHeadImg;
let snakeBodyImg;

hiScore = +localStorage.getItem('snakeHS') || 0;

// ── Food object ────────────────────────────────────────────
meatball = {
  visible: false,
  x: 0,
  y: 0,
  w: 0,
  h: 0
};

// ── Helpers ────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(5, '0');
}

function spawnFood() {
  let valid = false;

  while (!valid) {
    foodX = floor(random(COLS));
    foodY = floor(random(COLS));

    valid = true;
    for (let s of snake) {
      if (s.x === foodX && s.y === foodY) {
        valid = false;
        break;
      }
    }
  }

  meatball.x = foodX * CELL + CELL / 2;
  meatball.y = foodY * CELL + CELL / 2 + HEADER_HEIGHT;

  meatball.visible = true;
}

// ── Init ───────────────────────────────────────────────────
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

// ── Particles ──────────────────────────────────────────────
function spawnParticles(px, py) {
  const colors = [COL.sauce, COL.sauceDim, COL.amber, COL.brown];

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

// ── Game tick ──────────────────────────────────────────────
function tick() {
  const head = {
    x: snake[0].x + vx,
    y: snake[0].y + vy
  };

  prevVx = vx;
  prevVy = vy;

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= COLS ||
    head.y >= COLS
  ) {
    endGame();
    return;
  }

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
      foodY * CELL + CELL / 2 + HEADER_HEIGHT
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

// ── Movement ───────────────────────────────────────────────
function move(dx, dy) {
  if (!gameOn && !over) gameOn = true;

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

// ── Grid ───────────────────────────────────────────────────
function drawGrid() {
  stroke(COL.grid);
  strokeWeight(0.5);

  for (let i = 0; i <= COLS; i++) {
    line(i * CELL, HEADER_HEIGHT, i * CELL, height);
    line(0, i * CELL + HEADER_HEIGHT, width, i * CELL + HEADER_HEIGHT);
  }
}

// ── Snake ──────────────────────────────────────────────────
function drawSnake() {
  noStroke();

  snake.forEach((seg, i) => {
    const x = seg.x * CELL;
    const y = seg.y * CELL + HEADER_HEIGHT;

    if (i === 0) {
      drawingContext.shadowColor = COL.headGlow;
      drawingContext.shadowBlur = 8;
    } else {
      drawingContext.shadowBlur = 0;
    }

    if (i === 0 && snakeHeadImg) {
      push();
      imageMode(CENTER);
      translate(x + CELL / 2, y + CELL / 2);
      rotate(atan2(vy, vx) + PI / 2);
      image(snakeHeadImg, 0, 0, CELL - 4, CELL - 4);
      pop();
    } else if (i > 0 && snakeBodyImg) {
      push();
      imageMode(CENTER);
      translate(x + CELL / 2, y + CELL / 2);

      const p = snake[i - 1];
      rotate(atan2(p.y - seg.y, p.x - seg.x) + PI / 2);

      image(snakeBodyImg, 0, 0, CELL - 4, CELL - 4);
      pop();
    } else {
      fill(i === 0 ? COL.headFill : COL.amber);
      rect(x + 2, y + 2, CELL - 4, CELL - 4, 3);
    }
  });

  drawingContext.shadowBlur = 0;
}

// ── Meatball ───────────────────────────────────────────────
function drawMeatball() {
  if (!meatball.visible) return;

  push();
  imageMode(CENTER);
  noTint();

  if (meatballImg) {
    image(meatballImg, meatball.x, meatball.y, meatball.w, meatball.h);
  } else {
    fill(COL.sauce);
    ellipse(meatball.x, meatball.y, meatball.w, meatball.h);
  }

  pop();
}

// ── Particles ──────────────────────────────────────────────
function drawParticles() {
  noStroke();

  particles.forEach(p => {
    drawingContext.globalAlpha = p.life;
    fill(p.col);
    rect(p.x - 2, p.y - 2, 4, 4);
  });

  drawingContext.globalAlpha = 1;
}

// ── HUD ────────────────────────────────────────────────────
function drawHUD() {
  fill(COL.brown);
  noStroke();
  rect(0, 0, width, HEADER_HEIGHT);

  fill(COL.textAmber);
  textFont('monospace');
  textSize(18);

  textAlign(LEFT, CENTER);
  text(`SCORE ${pad(score)}`, 20, HEADER_HEIGHT / 2);

  textAlign(RIGHT, CENTER);
  text(`BEST ${pad(hiScore)}`, width - 20, HEADER_HEIGHT / 2);
}

// ── Overlay ────────────────────────────────────────────────
function drawOverlay(title, sub, scoreStr) {
  fill(COL.overlayBg);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textFont('monospace');

  if (over) {
    fill('#7a1f16');
    drawingContext.shadowBlur = 0;
  } else {
    fill(COL.textLight);
  }

  textSize(72);
  text(title, width / 2, height / 2 - 100);

  if (scoreStr) {
    fill(COL.textAmber);
    textSize(48);
    text(scoreStr, width / 2, height / 2 - 10);
  }

  fill('#fff6e6');
  textSize(32);
  text(sub, width / 2, height / 2 + 80);
}

// ── Main draw loop ─────────────────────────────────────────
function draw() {

  // ── INTRO SCREEN ──
  if (showIntro) {
    background(COL.board);

    textAlign(CENTER, CENTER);
    textFont('monospace');

    fill(COL.brown);
    textSize(42);
    text('q5play', width / 2, height / 2 - 30);

    fill(COL.textAmber);
    textSize(18);
    text('HAPPY SPAGHETTI', width / 2, height / 2 + 10);

    fill(COL.textLight);
    textSize(12);
    text('loading...', width / 2, height / 2 + 40);

    if (millis() - introStart > 1500) {
      showIntro = false;
    }

    return;
  }

  background(COL.board);

  if (gameOn && !over) {
    const now = millis();
    if (now - lastTick >= speedMs) {
      tick();
      lastTick = now;
    }
  }

  drawHUD();
  drawGrid();
  drawSnake();
  drawMeatball();
  drawParticles();

  if (!gameOn && !over) {
    drawOverlay('HAPPY SPAGHETTI', 'PRESS ARROW KEY OR WASD');
  }

  if (over) {
    drawOverlay('GAME OVER', 'PRESS ARROW / WASD TO RESTART', `SCORE ${pad(score)}`);
  }
}

// ── Controls ───────────────────────────────────────────────
function keyPressed() {
  if (keyCode === UP_ARROW || key === 'w') move(0, -1);
  if (keyCode === DOWN_ARROW || key === 's') move(0, 1);
  if (keyCode === LEFT_ARROW || key === 'a') move(-1, 0);
  if (keyCode === RIGHT_ARROW || key === 'd') move(1, 0);
  if (key === ' ' && over) restart();
}

// ── Setup ──────────────────────────────────────────────────
function setup() {
  const canvasSize = min(windowWidth, windowHeight);

  createCanvas(canvasSize, canvasSize + HEADER_HEIGHT);

  CELL = width / COLS;

  meatball.w = CELL - 2;
  meatball.h = CELL - 2;

  introStart = millis();

  init();
}

function windowResized() {
  const canvasSize = min(windowWidth, windowHeight);

  resizeCanvas(canvasSize, canvasSize + HEADER_HEIGHT);

  CELL = width / COLS;

  meatball.w = CELL - 2;
  meatball.h = CELL - 2;
}

// ── Images ─────────────────────────────────────────────────
function preload() {
  snakeHeadImg = loadImage(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA3UlEQVR4AZyOvQ3CMBCFD4tJmIIxSAEtNQWL0CJETU0DW1BkBkCZAxH8WTnriA+hJNKTn99fHMT5nlXV9mVPI+MOvNdToXC/LFsAR6PQRzFAgRCFcHoJgKOpB1d8DdjAcXvTjFhuMwTygDUo7JpGDnWdAEejAGw2DViBwGY/l8d1JZxAOZ5CO2lARXvOFud8tTyLHQm61N3zEXWXZzGSmGndF3h/9LS4IcXAryBhzysG4rMEULBAA1aDh7g6gYwB3eIFQ4fSAEtDi9pJA5RVgP+DzeYBShgA7gEPWO8DAAD//3Vl8hwAAAAGSURBVAMAomlrbaMM5cYAAAAASUVORK5CYIIA'
  );

  snakeBodyImg = loadImage(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAe0lEQVR4AeySQQqAMAwEo0/xRV58pRdf5FeUVFI261Jy8KgQ1GR2WkpnE895bJcqgdpL4EEFek/NkkABHsRipgt4gCH+RrYLGKr+NwEaq8HINEE1pLhfYM9NXNZ9Ugc06kXmu0MM42jVmCGbdoCDgPnNTBI4zID3otTsBgAA//93sIZ/AAAABklEQVQDACh2MW12xuIKAAAAAElFTkSuQmCC'
  );

  meatballImg = loadImage(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA8klEQVR4AYySMQrCUBBEvwGr4AnsrexyMzuPYOMpPILXSKU2OYG1WAgqmrcwcfL5QgLDzu7OzP4iVSp8p7r+lFCQplGATOumSSA3aO/zIYAlJnBu2wQkPCxnohGMVoMIYICRoRvpc2iPh10FcbNfQ6A+r+xAvACiZPg/seZoAMcjwM0sQC5mVkIEaCHTvntqNNTSjGW1XbypSWaazWpOGcFnro0XEHK5vUYGv+hcIoVEgIYewkWMAC6NV0Kq4/Xx+0v6LSGgpwkjgJew6+6z0QtcRIjDd84jIH+FC8QVpp7r8AiATAlBR5DM9EMAzZSQXPMFAAD//9NqunoAAAAGSURBVAMA2N+Febx6LYMAAAAASUVORK5CYIIA'
  );
}