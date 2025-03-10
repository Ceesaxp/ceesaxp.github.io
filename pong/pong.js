// Initialize Telegram Web App
const tgApp = window.Telegram.WebApp;
tgApp.expand();
tgApp.enableClosingConfirmation();

// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const winsDisplay = document.getElementById('wins-display');
const pauseBtn = document.getElementById('pause-btn');
const cancelBtn = document.getElementById('cancel-btn');
const gameOver = document.getElementById('game-over');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const restartFromPauseBtn = document.getElementById('restart-from-pause-btn');
const exitBtn = document.getElementById('exit-btn');
const exitFromPauseBtn = document.getElementById('exit-from-pause-btn');
const winnerText = document.getElementById('winner-text');

// Main menu elements
const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const playAIBtn = document.getElementById('play-ai-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');

// Leaderboard elements
const leaderboard = document.getElementById('leaderboard');
const backBtn = document.getElementById('back-btn');

// Game variables
let gameWidth = 400;
let gameHeight = 600;
const paddleHeight = 10;
const paddleWidth = 70;
const ballSize = 8;
const maxScore = 11; // Changed to 11 as requested

// Game state
let player1Score = 0;
let player2Score = 0;
let player1Wins = 0;
let player2Wins = 0;
let ballX = gameWidth / 2;
let ballY = gameHeight / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;
let player1PaddleX = gameWidth / 2 - paddleWidth / 2;
let player2PaddleX = gameWidth / 2 - paddleWidth / 2;

let gameRunning = false;
let gamePaused = false;
let touchStartX = 0;
let lastTouch = 0;
let animationFrameId;

// AI settings
let aiEnabled = false;
let aiDifficulty = 0.7; // Error rate: 0 = perfect, 1 = completely random
let aiReactionRate = 0.05; // How quickly AI reacts (increases with player skill)
let playerSkillRating = 0;
let consecutiveHits = 0;

// Set canvas size based on screen
function resizeCanvas() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight * 0.8;
    
    if (containerWidth / containerHeight > gameWidth / gameHeight) {
        canvas.height = containerHeight;
        canvas.width = containerHeight * (gameWidth / gameHeight);
    } else {
        canvas.width = containerWidth;
        canvas.height = containerWidth * (gameHeight / gameWidth);
    }
    
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    
    if (!gameRunning) {
        resetGame();
    }
}

// Initialize the game
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Touch events for controlling paddles
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Button event listeners
    pauseBtn.addEventListener('click', togglePause);
    cancelBtn.addEventListener('click', confirmCancel);
    resumeBtn.addEventListener('click', resumeGame);
    restartBtn.addEventListener('click', startNewGame);
    restartFromPauseBtn.addEventListener('click', startNewGame);
    exitBtn.addEventListener('click', exitGame);
    exitFromPauseBtn.addEventListener('click', exitGame);
    playBtn.addEventListener('click', () => startNewGame(false));
    playAIBtn.addEventListener('click', () => startNewGame(true));
    leaderboardBtn.addEventListener('click', showLeaderboard);
    backBtn.addEventListener('click', showMainMenu);
    
    // Show main menu initially
    showMainMenu();
}

// Show main menu
function showMainMenu() {
    canvas.style.display = 'none';
    scoreDisplay.style.display = 'none';
    winsDisplay.style.display = 'none';
    pauseBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    gameOver.style.display = 'none';
    pauseMenu.style.display = 'none';
    leaderboard.style.display = 'none';
    
    mainMenu.style.display = 'flex';
    
    // Stop game if running
    if (gameRunning) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
    }
}

// Show leaderboard
function showLeaderboard() {
    mainMenu.style.display = 'none';
    leaderboard.style.display = 'flex';
    
    // Update leaderboard
    LeaderboardUI.display();
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    if (!gamePaused) {
        update();
        render();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // AI paddle movement
    if (aiEnabled) {
        controlAIPaddle();
    }
    
    // Move the ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // Ball collision with left and right walls
    if (ballX <= 0 || ballX >= gameWidth - ballSize) {
        ballSpeedX = -ballSpeedX;
        
        // Classic pong sound effect
        playSound(150);
    }
    
    // Ball collision with paddles
    if (
        (ballY <= paddleHeight && ballX >= player1PaddleX && ballX <= player1PaddleX + paddleWidth) ||
        (ballY >= gameHeight - paddleHeight - ballSize && ballX >= player2PaddleX && ballX <= player2PaddleX + paddleWidth)
    ) {
        ballSpeedY = -ballSpeedY;
        
        // Add some variation based on where the ball hits the paddle
        const paddleX = ballY <= paddleHeight ? player1PaddleX : player2PaddleX;
        const hitPosition = (ballX - paddleX) / paddleWidth; // 0 to 1
        ballSpeedX = 7 * (hitPosition - 0.5); // -3.5 to 3.5
        
        // Speed up the ball slightly as the game progresses
        const maxBallSpeed = 8;
        const speedMultiplier = 1.05;
        
        if (Math.abs(ballSpeedY) < maxBallSpeed) {
            ballSpeedY = ballSpeedY > 0 ? 
                Math.min(ballSpeedY * speedMultiplier, maxBallSpeed) : 
                Math.max(ballSpeedY * speedMultiplier, -maxBallSpeed);
        }
        
        // Classic pong sound effect (higher pitch for paddle)
        playSound(220);
        
        // Haptic feedback
        tgApp.HapticFeedback.impactOccurred('light');
        
        // Increase consecutive hits and player skill when human player hits the ball
        if (ballY >= gameHeight - paddleHeight - ballSize) {
            consecutiveHits++;
            
            // Adjust AI difficulty based on consecutive hits
            if (consecutiveHits > 3) {
                increasePlayerSkill();
            }
        }
    }
    
    // Ball out of bounds (scoring)
    if (ballY < 0) {
        // Player 2 scores
        player2Score++;
        updateScore();
        playSound(100, 0.3);
        resetBall();
        consecutiveHits = 0;
    } else if (ballY > gameHeight) {
        // Player 1 scores
        player1Score++;
        updateScore();
        playSound(100, 0.3);
        resetBall();
        consecutiveHits = 0;
        
        // Reduce player skill slightly when they miss
        if (aiEnabled) {
            playerSkillRating = Math.max(0, playerSkillRating - 0.5);
            updateAIDifficulty();
        }
    }
    
    // Check for game over
    if (player1Score >= maxScore || player2Score >= maxScore) {
        endGame();
    }
}

// AI paddle control
function controlAIPaddle() {
    // Target position where the AI wants to move
    let targetX;
    
    // If ball is moving toward AI, track it with some error
    if (ballSpeedY < 0) {
        // Calculate perfect position (middle of paddle aligned with ball)
        const perfectX = ballX - (paddleWidth / 2);
        
        // Add error based on difficulty
        const errorAmount = aiDifficulty * paddleWidth * 1.5;
        const randomError = (Math.random() * 2 - 1) * errorAmount;
        targetX = perfectX + randomError;
        
        // Move toward target position based on reaction rate
        player1PaddleX += (targetX - player1PaddleX) * aiReactionRate;
    } else {
        // If ball is moving away, gradually move toward center
        targetX = (gameWidth - paddleWidth) / 2;
        player1PaddleX += (targetX - player1PaddleX) * 0.02;
    }
    
    // Keep paddle within bounds
    player1PaddleX = Math.max(0, Math.min(gameWidth - paddleWidth, player1PaddleX));
}

// Increase player skill rating
function increasePlayerSkill() {
    playerSkillRating += 0.2;
    updateAIDifficulty();
}

// Update AI difficulty based on player skill
function updateAIDifficulty() {
    // Decrease error rate as player skill increases
    aiDifficulty = Math.max(0.1, 0.7 - (playerSkillRating * 0.05));
    
    // Increase reaction rate as player skill increases
    aiReactionRate = Math.min(0.2, 0.05 + (playerSkillRating * 0.01));
}

// Render game objects
function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(0, gameHeight / 2);
    ctx.lineTo(gameWidth, gameHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(player1PaddleX, 0, paddleWidth, paddleHeight);
    ctx.fillRect(player2PaddleX, gameHeight - paddleHeight, paddleWidth, paddleHeight);
    
    // Draw ball
    ctx.fillStyle = '#fff';
    ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

// Simple sound effect generator
function playSound(frequency, duration = 0.1) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        
        // Stop the sound after the specified duration
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, duration * 1000);
    } catch (e) {
        console.error('Audio playback error:', e);
    }
}

// Reset ball position
function resetBall() {
    ballX = gameWidth / 2;
    ballY = gameHeight / 2;
    
    // Randomize initial ball direction
    ballSpeedX = (Math.random() > 0.5 ? 4 : -4) * (0.8 + Math.random() * 0.4);
    ballSpeedY = (Math.random() > 0.5 ? 4 : -4) * (0.8 + Math.random() * 0.4);
}

// Reset single game state
function resetGame() {
    player1Score = 0;
    player2Score = 0;
    player1PaddleX = gameWidth / 2 - paddleWidth / 2;
    player2PaddleX = gameWidth / 2 - paddleWidth / 2;
    resetBall();
    updateScore();
    updateWins();
}

// Reset entire match (including wins)
function resetMatch() {
    resetGame();
    player1Wins = 0;
    player2Wins = 0;
    playerSkillRating = 0;
    aiDifficulty = 0.7;
    aiReactionRate = 0.05;
    consecutiveHits = 0;
    updateWins();
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = `${player1Score} - ${player2Score}`;
}

// Update wins display
function updateWins() {
    winsDisplay.textContent = `WINS: ${player1Wins} - ${player2Wins}`;
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    
    // If AI is enabled, only control bottom paddle
    if (aiEnabled) {
        lastTouch = 2;
    } else {
        lastTouch = touch.clientY < window.innerHeight / 2 ? 1 : 2; // 1 for top paddle, 2 for bottom
    }
}

// Handle touch move
function handleTouchMove(e) {
    e.preventDefault();
    if (!gamePaused && gameRunning) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        touchStartX = touch.clientX;
        
        // Determine which paddle to move based on touch position
        if (lastTouch === 1 && !aiEnabled) {
            player1PaddleX += deltaX;
        } else {
            player2PaddleX += deltaX;
        }
        
        // Keep paddles within bounds
        player1PaddleX = Math.max(0, Math.min(gameWidth - paddleWidth, player1PaddleX));
        player2PaddleX = Math.max(0, Math.min(gameWidth - paddleWidth, player2PaddleX));
    }
}

// Handle touch end
function handleTouchEnd(e) {
    e.preventDefault();
}

// Toggle pause state
function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseMenu.style.display = 'flex';
    } else {
        pauseMenu.style.display = 'none';
    }
}

// Resume game from pause
function resumeGame() {
    gamePaused = false;
    pauseMenu.style.display = 'none';
}

// Confirm game cancellation
function confirmCancel() {
    if (confirm('Are you sure you want to exit the game?')) {
        exitGame();
    }
}

// End the game
function endGame() {
    gameRunning = false;
    gameOver.style.display = 'flex';
    
    // Update win counts
    if (player1Score >= maxScore) {
        player1Wins++;
        winnerText.textContent = aiEnabled ? 'AI WINS' : 'PLAYER 1 WINS';
    } else {
        player2Wins++;
        winnerText.textContent = aiEnabled ? 'YOU WIN' : 'PLAYER 2 WINS';
    }
    updateWins();
    
    // Victory sound
    playSound(440, 0.2);
    setTimeout(() => playSound(660, 0.2), 200);
    setTimeout(() => playSound(880, 0.5), 400);
    
    // Notify Telegram Mini App
    tgApp.HapticFeedback.notificationOccurred('success');
    
    // Save score to leaderboard if player beats AI
    if (aiEnabled && player2Score >= maxScore) {
        const winnerScore = player2Score;
        if (ScoreManager.isHighScore(winnerScore)) {
            ScoreManager.saveScore('PLAYER', winnerScore);
            TelegramCloudStorage.backupToTelegram();
        }
    }
}

// Start a new game
function startNewGame(withAI = false) {
    resetGame();
    aiEnabled = withAI;
    
    gameRunning = true;
    gamePaused = false;
    
    mainMenu.style.display = 'none';
    leaderboard.style.display = 'none';
    gameOver.style.display = 'none';
    pauseMenu.style.display = 'none';
    
    canvas.style.display = 'block';
    scoreDisplay.style.display = 'block';
    winsDisplay.style.display = 'block';
    pauseBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    
    cancelAnimationFrame(animationFrameId);
    gameLoop();
}

// Exit the game
function exitGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    resetMatch();
    showMainMenu();
}

// Initialize the game when the page loads
window.onload = initGame;
