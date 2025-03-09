// Initialize Telegram Web App
const tgApp = window.Telegram.WebApp;
tgApp.expand();
tgApp.enableClosingConfirmation();

// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const pauseBtn = document.getElementById('pause-btn');
const cancelBtn = document.getElementById('cancel-btn');
const gameOver = document.getElementById('game-over');
const winnerText = document.getElementById('winner-text');

// Main menu elements
const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const exitBtn = document.getElementById('exit-btn');

// Leaderboard elements
const leaderboard = document.getElementById('leaderboard');
const backBtn = document.getElementById('back-btn');

// Game variables
let gameWidth = 400;
let gameHeight = 600;
const paddleHeight = 10;
const paddleWidth = 70;
const ballSize = 8;
const maxScore = 10;

// Game state
let player1Score = 0;
let player2Score = 0;
let ballX = gameWidth / 2;
let ballY = gameHeight / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;
let player1PaddleX = gameWidth / 2 - paddleWidth / 2;
let player2PaddleX = gameWidth / 2 - paddleWidth / 2;

let gameRunning = false;
let touchStartX = 0;
let lastTouch = 0;
let animationFrameId;

// Set canvas size based on screen
function resizeCanvas() {
    // Calculate game dimensions while maintaining aspect ratio
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight * 0.8;
    
    if (containerWidth / containerHeight > gameWidth / gameHeight) {
        // Height limited
        canvas.height = containerHeight;
        canvas.width = containerHeight * (gameWidth / gameHeight);
    } else {
        // Width limited
        canvas.width = containerWidth;
        canvas.height = containerWidth * (gameHeight / gameWidth);
    }
    
    // Adjust game coordinates based on canvas size
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    
    // Reset paddles and ball positions when resizing
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
    playBtn.addEventListener('click', startNewGame);
    exitBtn.addEventListener('click', exitGame);
    backBtn.addEventListener('click', showMainMenu);
    
    // Show main menu by default
    showMainMenu();
}

// Show main menu screen
function showMainMenu() {
    // Hide other screens
    canvas.style.display = 'none';
    scoreDisplay.style.display = 'none';
    pauseBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    gameOver.style.display = 'none';
    
    // Stop game if running
    if (gameRunning) {
        gameRunning = false;
        cancelAnimationFrame(animationFrameId);
    }
    
    // Show leaderboard first then main menu
    leaderboard.style.display = 'flex';
    mainMenu.style.display = 'flex';
    
    // Update leaderboard
    LeaderboardUI.display();
}

// Show game screen
function showGameScreen() {
    // Hide other screens
    mainMenu.style.display = 'none';
    leaderboard.style.display = 'none';
    gameOver.style.display = 'none';
    
    // Show game elements
    canvas.style.display = 'block';
    scoreDisplay.style.display = 'block';
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    update();
    render();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
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
    }
    
    // Ball out of bounds (scoring)
    if (ballY < 0) {
        // Player 2 scores
        player2Score++;
        updateScore();
        playSound(100, 0.3);
        resetBall();
    } else if (ballY > gameHeight) {
        // Player 1 scores
        player1Score++;
        updateScore();
        playSound(100, 0.3);
        resetBall();
    }
    
    // Check for game over
    if (player1Score >= maxScore || player2Score >= maxScore) {
        endGame();
    }
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

// Reset game state
function resetGame() {
    player1Score = 0;
    player2Score = 0;
    player1PaddleX = gameWidth / 2 - paddleWidth / 2;
    player2PaddleX = gameWidth / 2 - paddleWidth / 2;
    resetBall();
    updateScore();
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = `${player1Score} - ${player2Score}`;
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    lastTouch = touch.clientY < window.innerHeight / 2 ? 1 : 2; // 1 for top paddle, 2 for bottom
}

// Handle touch move
function handleTouchMove(e) {
    e.preventDefault();
    if (gameRunning) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        touchStartX = touch.clientX;
        
        // Determine which paddle to move based on touch position
        if (lastTouch === 1) {
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

// End the game
function endGame() {
    gameRunning = false;
    gameOver.style.display = 'flex';
    
    if (player1Score >= maxScore) {
        winnerText.textContent = 'PLAYER 1 WINS';
    } else {
        winnerText.textContent = 'PLAYER 2 WINS';
    }
    
    // Victory sound
    playSound(440, 0.2);
    setTimeout(() => playSound(660, 0.2), 200);
    setTimeout(() => playSound(880, 0.5), 400);
    
    // Notify Telegram Mini App
    tgApp.HapticFeedback.notificationOccurred('success');
    
    // Save score to leaderboard
    const winnerScore = Math.max(player1Score, player2Score);
    if (ScoreManager.isHighScore(winnerScore)) {
        ScoreManager.saveScore('PLAYER', winnerScore);
        TelegramCloudStorage.backupToTelegram();
    }
}

// Start a new game
function startNewGame() {
    resetGame();
    showGameScreen();
    gameRunning = true;
    cancelAnimationFrame(animationFrameId);
    gameLoop();
}

// Exit the game
function exitGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    tgApp.close();
}

// Initialize the game when the page loads
window.onload = initGame;