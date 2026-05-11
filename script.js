// ============================================
// ENHANCED SNAKE GAME - FULL ENGINE
// ============================================

class SnakeGame {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 20;
    this.cols = this.canvas.width / this.gridSize;
    this.rows = this.canvas.height / this.gridSize;

    // Game state
    this.snake = [];
    this.food = [];
    this.powerUps = [];
    this.gameActive = false;
    this.gamePaused = false;
    this.gameOverFlag = false;
    this.score = 0;
    this.bestScore = localStorage.getItem('bestScore') || 0;
    this.gameMode = 'classic'; // classic, speedy, zen, hardcore
    this.speedMultiplier = 1;

    // Timing
    this.gameSpeed = 100; // ms
    this.lastMoveTime = 0;
    this.frameCount = 0;

    // Input buffering
    this.nextDirection = { x: 0, y: 0 };
    this.currentDirection = { x: 1, y: 0 };
    this.directionBuffer = [];

    // Arrays for different food effects
    this.normalFood = [];
    this.speedFood = [];
    this.bonusFood = [];

    // Initialize
    this.initializeGame();
    this.setupEventListeners();
    this.updateDisplay();
    this.showOverlay(true);
  }

  initializeGame() {
    // Create initial snake in middle of grid
    this.snake = [
      { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
      { x: Math.floor(this.cols / 2) - 1, y: Math.floor(this.rows / 2) },
      { x: Math.floor(this.cols / 2) - 2, y: Math.floor(this.rows / 2) }
    ];
    
    this.currentDirection = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.normalFood = [];
    this.speedFood = [];
    this.bonusFood = [];
    this.powerUps = [];
    this.gameOverFlag = false;
    this.frameCount = 0;

    // Spawn initial food
    this.spawnFood();
    this.spawnFood();
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Button controls
    document.getElementById('btnStart').addEventListener('click', () => this.startGame());
    document.getElementById('btnPause').addEventListener('click', () => this.togglePause());
    document.getElementById('btnMode').addEventListener('click', () => this.toggleMode());
    document.getElementById('btnReset').addEventListener('click', () => this.resetBestScore());

    // Mode switching via keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === '1') this.setGameMode('classic');
      if (e.key === '2') this.setGameMode('speedy');
      if (e.key === '3') this.setGameMode('zen');
      if (e.key === '4') this.setGameMode('hardcore');
    });
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'enter') {
      e.preventDefault();
      if (!this.gameActive) {
        this.startGame();
      } else if (this.gameOverFlag) {
        this.initializeGame();
        this.startGame();
      }
    }
    
    if (key === 'p') {
      e.preventDefault();
      this.togglePause();
    }

    // Direction input with buffering
    const dirMap = {
      'arrowup': { x: 0, y: -1 },
      'w': { x: 0, y: -1 },
      'arrowdown': { x: 0, y: 1 },
      's': { x: 0, y: 1 },
      'arrowleft': { x: -1, y: 0 },
      'a': { x: -1, y: 0 },
      'arrowright': { x: 1, y: 0 },
      'd': { x: 1, y: 0 }
    };

    if (dirMap[key]) {
      e.preventDefault();
      const newDir = dirMap[key];
      // Prevent reversing
      const isReverse = newDir.x === -this.currentDirection.x && newDir.y === -this.currentDirection.y;
      if (!isReverse && this.gameActive && !this.gamePaused) {
        this.directionBuffer.push(newDir);
      }
    }
  }

  handleKeyUp(e) {
    // Direction buffer management
  }

  startGame() {
    if (!this.gameActive) {
      this.gameActive = true;
      this.gamePaused = false;
      this.gameOverFlag = false;
      this.showOverlay(false);
      this.gameLoop();
    }
  }

  togglePause() {
    if (!this.gameActive) return;
    this.gamePaused = !this.gamePaused;
    if (this.gamePaused) {
      this.showOverlayMessage('PAUSED', 'Press P to resume');
    } else {
      this.showOverlay(false);
      this.gameLoop();
    }
  }

  toggleMode() {
    const modes = ['classic', 'speedy', 'zen', 'hardcore'];
    const currentIndex = modes.indexOf(this.gameMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setGameMode(modes[nextIndex]);
  }

  setGameMode(mode) {
    this.gameMode = mode;
    
    const modeSettings = {
      classic: { speed: 100, multiplier: 1, description: 'Standard gameplay' },
      speedy: { speed: 60, multiplier: 1.5, description: 'Speed challenge' },
      zen: { speed: 150, multiplier: 0.8, description: 'Relaxed mode' },
      hardcore: { speed: 40, multiplier: 2, description: 'Ultimate challenge' }
    };

    const settings = modeSettings[mode];
    this.gameSpeed = settings.speed;
    this.speedMultiplier = settings.multiplier;
    
    document.getElementById('mode').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    this.showOverlayMessage(`${mode.toUpperCase()}`, settings.description);
  }

  resetBestScore() {
    if (confirm('Are you sure? This will reset your best score.')) {
      this.bestScore = 0;
      localStorage.removeItem('bestScore');
      this.updateDisplay();
    }
  }

  gameLoop() {
    if (!this.gameActive || this.gamePaused) return;

    const now = Date.now();
    const deltaTime = now - this.lastMoveTime;

    if (deltaTime >= this.gameSpeed) {
      // Process buffered direction input
      if (this.directionBuffer.length > 0) {
        const nextDir = this.directionBuffer.shift();
        const isReverse = nextDir.x === -this.currentDirection.x && nextDir.y === -this.currentDirection.y;
        if (!isReverse) {
          this.nextDirection = nextDir;
        }
      }

      this.currentDirection = this.nextDirection;
      this.update();
      this.lastMoveTime = now;
    }

    this.frameCount++;
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: (head.x + this.currentDirection.x + this.cols) % this.cols,
      y: (head.y + this.currentDirection.y + this.rows) % this.rows
    };

    // Check self collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(newHead);

    // Check food collision
    let foodEaten = false;
    for (let i = this.normalFood.length - 1; i >= 0; i--) {
      if (this.normalFood[i].x === newHead.x && this.normalFood[i].y === newHead.y) {
        this.score += 10 * this.speedMultiplier;
        this.normalFood.splice(i, 1);
        foodEaten = true;
        break;
      }
    }

    for (let i = this.speedFood.length - 1; i >= 0; i--) {
      if (this.speedFood[i].x === newHead.x && this.speedFood[i].y === newHead.y) {
        this.score += 25 * this.speedMultiplier;
        this.speedFood.splice(i, 1);
        this.gameSpeed = Math.max(30, this.gameSpeed - 5);
        foodEaten = true;
        break;
      }
    }

    for (let i = this.bonusFood.length - 1; i >= 0; i--) {
      if (this.bonusFood[i].x === newHead.x && this.bonusFood[i].y === newHead.y) {
        this.score += 50 * this.speedMultiplier;
        this.bonusFood.splice(i, 1);
        foodEaten = true;
        break;
      }
    }

    if (!foodEaten) {
      this.snake.pop();
    }

    // Update best score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('bestScore', this.bestScore);
    }

    // Spawn new food if needed
    if (this.normalFood.length + this.speedFood.length + this.bonusFood.length < 3 && Math.random() < 0.3) {
      this.spawnFood();
    }

    this.updateDisplay();
  }

  spawnFood() {
    let newFood;
    let attempts = 0;
    
    // Ensure food doesn't spawn on snake
    do {
      newFood = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows)
      };
      attempts++;
    } while (
      this.snake.some(seg => seg.x === newFood.x && seg.y === newFood.y) &&
      attempts < 20
    );

    if (attempts < 20) {
      const rand = Math.random();
      if (rand < 0.7) {
        this.normalFood.push(newFood);
      } else if (rand < 0.85) {
        this.speedFood.push(newFood);
      } else {
        this.bonusFood.push(newFood);
      }
    }
  }

  draw() {
    // Clear canvas with gradient
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#0a0f1e');
    gradient.addColorStop(1, '#1a0f3a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.08)';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.cols; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.rows; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.gridSize;
      const y = segment.y * this.gridSize;

      if (index === 0) {
        // Head
        this.ctx.fillStyle = '#4dd0ff';
        this.ctx.shadowColor = 'rgba(77, 208, 255, 0.8)';
        this.ctx.shadowBlur = 10;
      } else {
        // Body
        this.ctx.fillStyle = `rgba(77, 208, 255, ${0.6 - index * 0.05})`;
        this.ctx.shadowColor = 'rgba(77, 208, 255, 0.4)';
        this.ctx.shadowBlur = 5;
      }

      this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
      this.ctx.shadowColor = 'transparent';
    });

    // Draw normal food (red)
    this.ctx.fillStyle = '#ff4d6d';
    this.ctx.shadowColor = 'rgba(255, 77, 109, 0.6)';
    this.ctx.shadowBlur = 8;
    this.normalFood.forEach(food => {
      const x = food.x * this.gridSize;
      const y = food.y * this.gridSize;
      this.ctx.beginPath();
      this.ctx.arc(x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2 - 1, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw speed food (orange/gold)
    this.ctx.fillStyle = '#ffa500';
    this.ctx.shadowColor = 'rgba(255, 165, 0, 0.6)';
    this.ctx.shadowBlur = 8;
    this.speedFood.forEach(food => {
      const x = food.x * this.gridSize;
      const y = food.y * this.gridSize;
      // Star shape
      this.drawStar(x + this.gridSize / 2, y + this.gridSize / 2, 5, this.gridSize / 3, this.gridSize / 5);
    });

    // Draw bonus food (purple/gold)
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    this.ctx.shadowBlur = 12;
    this.bonusFood.forEach(food => {
      const x = food.x * this.gridSize;
      const y = food.y * this.gridSize;
      // Diamond shape
      this.drawDiamond(x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2.5);
    });

    this.ctx.shadowColor = 'transparent';
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      this.ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      this.ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawDiamond(cx, cy, size) {
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - size);
    this.ctx.lineTo(cx + size, cy);
    this.ctx.lineTo(cx, cy + size);
    this.ctx.lineTo(cx - size, cy);
    this.ctx.closePath();
    this.ctx.fill();
  }

  endGame() {
    this.gameActive = false;
    this.gameOverFlag = true;
    this.showOverlayMessage('GAME OVER', `Final Score: ${Math.round(this.score)} | Best: ${Math.round(this.bestScore)}`);
  }

  showOverlay(show) {
    const overlay = document.getElementById('overlay');
    if (show) {
      overlay.style.display = 'flex';
      document.getElementById('overlay-title').textContent = 'Snake';
      document.getElementById('overlay-text').innerHTML = 'Press <b>Enter</b> to start';
    } else {
      overlay.style.display = 'none';
    }
  }

  showOverlayMessage(title, message) {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-text').textContent = message;
  }

  updateDisplay() {
    document.getElementById('score').textContent = Math.round(this.score);
    document.getElementById('best').textContent = Math.round(this.bestScore);
    document.getElementById('speed').textContent = this.speedMultiplier.toFixed(1);
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SnakeGame();
});
