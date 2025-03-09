const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Paddle properties
const paddleWidth = 10;
const paddleHeight = 100;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
const paddleSpeed = 7;

// Ball properties
const ballSize = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 5;

// Score
let leftScore = 0;
let rightScore = 0;

// Draw paddles
function drawPaddles() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
}

// Draw ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

// Move paddles
function movePaddles() {
    if (leftPaddleUp && leftPaddleY > 0) {
        leftPaddleY -= paddleSpeed;
    }
    if (leftPaddleDown && leftPaddleY < canvas.height - paddleHeight) {
        leftPaddleY += paddleSpeed;
    }
    if (rightPaddleUp && rightPaddleY > 0) {
        rightPaddleY -= paddleSpeed;
    }
    if (rightPaddleDown && rightPaddleY < canvas.height - paddleHeight) {
        rightPaddleY += paddleSpeed;
    }
}

// Move ball
function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Ball collision with top and bottom walls
    if (ballY + ballSize > canvas.height || ballY - ballSize < 0) {
        ballSpeedY = -ballSpeedY;
    }

    // Ball collision with paddles
    if (ballX - ballSize < paddleWidth) {
        if (ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else if (ballX - ballSize < 0) {
            rightScore++;
            resetBall();
        }
    } else if (ballX + ballSize > canvas.width - paddleWidth) {
        if (ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else if (ballX + ballSize > canvas.width) {
            leftScore++;
            resetBall();
        }
    }
}

// Reset ball position
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 5;
}

// Draw score
function drawScore() {
    ctx.font = '45px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(leftScore, canvas.width / 4, canvas.height / 5);
    ctx.fillText(rightScore, 3 * canvas.width / 4, canvas.height / 5);
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddles();
    drawBall();
    movePaddles();
    moveBall();
    drawScore();
    requestAnimationFrame(gameLoop);
}

// Controls
let leftPaddleUp = false;
let leftPaddleDown = false;
let rightPaddleUp = false;
let rightPaddleDown = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'w') {
        leftPaddleUp = true;
    } else if (event.key === 's') {
        leftPaddleDown = true;
    } else if (event.key === 'ArrowUp') {
        rightPaddleUp = true;
    } else if (event.key === 'ArrowDown') {
        rightPaddleDown = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w') {
        leftPaddleUp = false;
    } else if (event.key === 's') {
        leftPaddleDown = false;
    } else if (event.key === 'ArrowUp') {
        rightPaddleUp = false;
    } else if (event.key === 'ArrowDown') {
        rightPaddleDown = false;
    }
});

// Start the game
gameLoop();
