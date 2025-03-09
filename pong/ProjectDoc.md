# Telegram Pong Mini-App Documentation

## Overview

This documentation covers the implementation of a classic Pong game as a Telegram mini-app. The game features touch controls, responsive design, score tracking, and a persistent leaderboard system.

## Project Structure

The application is organized into the following files:

```
📦 telegram-pong
 ┣ 📜 index.html      # Main HTML structure
 ┣ 📜 styles.css      # CSS styling
 ┣ 📜 game.js         # Game logic and UI interactions
 ┣ 📜 storage.js      # Data persistence and leaderboard functionality
```

## Features

- Classic monochrome Pong aesthetic
- Responsive design that adapts to different screen sizes
- Touch controls for paddle movement
- Games played until one player reaches 10 points
- Pause/resume functionality
- Persistent leaderboard with top 10 scores
- Cross-device score syncing via Telegram Cloud Storage
- Classic arcade sound effects

## Technical Implementation

### HTML Structure (index.html)

The HTML provides the basic structure with several key sections:

1. **Main Menu** - Entry point with game and leaderboard options
2. **Game Canvas** - Where gameplay occurs
3. **Game Controls** - Pause and exit buttons
4. **Game Over Screen** - Displays winner and allows score saving
5. **Pause Menu** - Options to resume, restart, or exit
6. **Leaderboard** - Displays saved scores in a table format

### Styling (styles.css)

The CSS implements a classic arcade aesthetic:

- Monochrome color scheme (white on black)
- ‘Courier New’ monospace font with letter spacing
- ALL CAPS text for menus
- Clean table layout for leaderboard
- Responsive sizing with max-width/height constraints
- Hover effects for buttons

### Game Logic (game.js)

The game.js file handles core gameplay mechanics:

#### Game Initialization and UI Management

```javascript
// Initialize the game
function initGame() {
    resizeCanvas();
    window.addEventListener(‘resize’, resizeCanvas);
    
    // Event listeners setup
    // ...
    
    resetGame();
    showMainMenu();
}

// UI state management functions
function showMainMenu() { /* ... */ }
function showGameScreen() { /* ... */ }
function showLeaderboard() { /* ... */ }
```

#### Canvas Sizing

```javascript
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
```

#### Game Loop

```javascript
function gameLoop() {
    if (!gameRunning) return;
    if (!gamePaused) {
        update();
        render();
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function update() {
    // Ball movement
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // Collision detection
    // Score tracking
    // Game over conditions
}

function render() {
    // Draw game elements
    // ...
}
```

#### Touch Controls

```javascript
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    lastTouch = touch.clientY < window.innerHeight / 2 ? 1 : 2;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gamePaused && gameRunning) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        touchStartX = touch.clientX;
        
        if (lastTouch === 1) {
            player1PaddleX += deltaX;
        } else {
            player2PaddleX += deltaX;
        }
        
        player1PaddleX = Math.max(0, Math.min(gameWidth - paddleWidth, player1PaddleX));
        player2PaddleX = Math.max(0, Math.min(gameWidth - paddleWidth, player2PaddleX));
    }
}
```

#### Sound Effects

```javascript
function playSound(frequency, duration = 0.1) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = ‘square’;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, duration * 1000);
    } catch (e) {
        console.error(‘Audio playback error:’, e);
    }
}
```

### Data Persistence (storage.js)

The storage.js file manages score persistence and the leaderboard system:

#### Score Management

```javascript
const ScoreManager = {
    // Get all scores from storage
    getScores: function() {
        try {
            const scores = localStorage.getItem(STORAGE_KEY);
            return scores ? JSON.parse(scores) : [];
        } catch (error) {
            console.error(‘Failed to get scores:’, error);
            return [];
        }
    },
    
    // Save a new score
    saveScore: function(name, score) {
        try {
            let scores = this.getScores();
            
            const newScore = {
                name: name || ‘UNKNOWN’,
                score: score,
                date: new Date().toISOString().split(‘T’)[0]
            };
            
            scores.push(newScore);
            scores.sort((a, b) => b.score - a.score);
            
            if (scores.length > 10) {
                scores = scores.slice(0, 10);
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
            return true;
        } catch (error) {
            console.error(‘Failed to save score:’, error);
            return false;
        }
    },
    
    // Other methods...
}
```

#### Telegram Cloud Storage Integration

```javascript
const TelegramCloudStorage = {
    // Store scores in Telegram cloud if available
    backupToTelegram: function() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                const tgApp = window.Telegram.WebApp;
                
                if (tgApp.CloudStorage) {
                    const scores = localStorage.getItem(STORAGE_KEY);
                    
                    if (scores) {
                        tgApp.CloudStorage.setItem(STORAGE_KEY, scores)
                            .then(() => console.log(‘Scores backed up to Telegram’))
                            .catch(err => console.error(‘Failed to backup to Telegram:’, err));
                    }
                }
            }
        } catch (error) {
            console.error(‘Telegram backup error:’, error);
        }
    },
    
    // Restore scores from Telegram cloud if available
    restoreFromTelegram: function() {
        // Implementation...
    }
}
```

#### Leaderboard UI

```javascript
const LeaderboardUI = {
    // Display the leaderboard
    display: function() {
        const scores = ScoreManager.getScores();
        const tableBody = document.getElementById(‘scores-table-body’);
        const noScoresMessage = document.getElementById(‘no-scores-message’);
        
        // Clear current table
        tableBody.innerHTML = ‘’;
        
        if (scores.length === 0) {
            document.getElementById(‘scores-table’).style.display = ‘none’;
            noScoresMessage.style.display = ‘block’;
        } else {
            document.getElementById(‘scores-table’).style.display = ‘table’;
            noScoresMessage.style.display = ‘none’;
            
            // Add each score to the table
            scores.forEach((score, index) => {
                // Implementation...
            });
        }
    }
}
```

## Game Mechanics

### Core Variables

```javascript
let gameWidth = 400;
let gameHeight = 600;
const paddleHeight = 10;
const paddleWidth = 70;
const ballSize = 8;
const maxScore = 10;

let player1Score = 0;
let player2Score = 0;
let ballX = gameWidth / 2;
let ballY = gameHeight / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;
let player1PaddleX = gameWidth / 2 - paddleWidth / 2;
let player2PaddleX = gameWidth / 2 - paddleWidth / 2;
```

### Ball Physics

- The ball moves in a straight line until it collides with a wall or paddle
- Ball speed increases slightly during play to increase difficulty
- Ball angle changes based on where it hits the paddle
- When a goal is scored, the ball resets to the center with a random direction

### Scoring System

- Games are played until one player reaches 10 points
- Scores are displayed at the top of the screen
- Scores can be saved to a persistent leaderboard
- Only the top 10 scores are kept

## Telegram Integration

### WebApp API Usage

- `tgApp.expand()`: Makes the mini-app full screen
- `tgApp.enableClosingConfirmation()`: Prevents accidental exits
- `tgApp.HapticFeedback`: Provides tactile feedback on important game events
- `tgApp.CloudStorage`: For cross-device leaderboard sync
- `tgApp.initDataUnsafe`: Gets user info to pre-fill name fields

## Domain Model Design

The application follows a clear domain model with separation of concerns:

1. **Game Domain** - Core gameplay mechanics and physics
2. **UI Domain** - Menu navigation and screen management
3. **Storage Domain** - Score persistence and retrieval
4. **Presentation Domain** - Rendering and display

## Future Enhancements

Potential improvements for the game:

1. **Multiplayer Mode** - Allow two users to play against each other
2. **Game Modes** - Add variations like increased speed or obstacles
3. **Themes** - Allow players to change visual themes
4. **Achievements** - Add badges for specific accomplishments
5. **Power-ups** - Add collectible items that modify gameplay

## Deployment

To deploy as a Telegram mini-app:

1. Host the files on a web server
2. Create a bot through BotFather
3. Configure the bot’s mini-app settings with the URL to your hosted app
4. Users can access the game through the bot’s menu

## Conclusion

This implementation provides a complete Pong game experience optimized for Telegram’s mini-app platform. The modular code structure makes it easy to maintain and extend with new features.