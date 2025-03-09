// Storage utilities for Pong game
const STORAGE_KEY = 'pong_leaderboard';

// ScoreManager handles all score-related operations
const ScoreManager = {
    // Get all scores from storage
    getScores: function() {
        try {
            const scores = localStorage.getItem(STORAGE_KEY);
            return scores ? JSON.parse(scores) : [];
        } catch (error) {
            console.error('Failed to get scores:', error);
            return [];
        }
    },
    
    // Save a new score
    saveScore: function(name, score) {
        try {
            // Get existing scores
            let scores = this.getScores();
            
            // Create new score entry
            const newScore = {
                name: name || 'PLAYER',
                score: score,
                date: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
            };
            
            // Add new score
            scores.push(newScore);
            
            // Sort by score (highest first)
            scores.sort((a, b) => b.score - a.score);
            
            // Keep only top 10 scores
            if (scores.length > 10) {
                scores = scores.slice(0, 10);
            }
            
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
            
            return true;
        } catch (error) {
            console.error('Failed to save score:', error);
            return false;
        }
    },
    
    // Check if a score is high enough to make the leaderboard
    isHighScore: function(score) {
        const scores = this.getScores();
        
        // If there are fewer than 10 scores, any score can make it
        if (scores.length < 10) {
            return true;
        }
        
        // Check if the score is higher than the lowest score on the board
        return score > scores[scores.length - 1].score;
    }
};

// Telegram-specific storage backup for users with WebApp
const TelegramCloudStorage = {
    // Store scores in Telegram cloud if available
    backupToTelegram: function() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                const tgApp = window.Telegram.WebApp;
                
                // Check if cloud storage is available
                if (tgApp.CloudStorage) {
                    const scores = localStorage.getItem(STORAGE_KEY);
                    
                    if (scores) {
                        tgApp.CloudStorage.setItem(STORAGE_KEY, scores)
                            .then(() => console.log('Scores backed up to Telegram'))
                            .catch(err => console.error('Failed to backup to Telegram:', err));
                    }
                }
            }
        } catch (error) {
            console.error('Telegram backup error:', error);
        }
    },
    
    // Restore scores from Telegram cloud if available
    restoreFromTelegram: function() {
        return new Promise((resolve) => {
            try {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
                    const tgApp = window.Telegram.WebApp;
                    
                    tgApp.CloudStorage.getItem(STORAGE_KEY)
                        .then(value => {
                            if (value) {
                                localStorage.setItem(STORAGE_KEY, value);
                                console.log('Scores restored from Telegram');
                            }
                            resolve();
                        })
                        .catch(err => {
                            console.error('Failed to restore from Telegram:', err);
                            resolve();
                        });
                } else {
                    resolve();
                }
            } catch (error) {
                console.error('Telegram restore error:', error);
                resolve();
            }
        });
    }
};

// LeaderboardUI handles the display of scores
const LeaderboardUI = {
    // Display the leaderboard
    display: function() {
        const scores = ScoreManager.getScores();
        const tableBody = document.getElementById('scores-table-body');
        const noScoresMessage = document.getElementById('no-scores-message');
        
        // Clear current table
        tableBody.innerHTML = '';
        
        if (scores.length === 0) {
            // Show "no scores" message
            document.getElementById('scores-table').style.display = 'none';
            noScoresMessage.style.display = 'block';
        } else {
            // Hide "no scores" message and show table
            document.getElementById('scores-table').style.display = 'table';
            noScoresMessage.style.display = 'none';
            
            // Add each score to the table
            scores.forEach((score, index) => {
                const row = document.createElement('tr');
                
                const rankCell = document.createElement('td');
                rankCell.textContent = index + 1;
                
                const nameCell = document.createElement('td');
                nameCell.textContent = score.name;
                
                const scoreCell = document.createElement('td');
                scoreCell.textContent = score.score;
                
                const dateCell = document.createElement('td');
                dateCell.textContent = score.date;
                
                row.appendChild(rankCell);
                row.appendChild(nameCell);
                row.appendChild(scoreCell);
                row.appendChild(dateCell);
                
                tableBody.appendChild(row);
            });
        }
    }
};

// Initialize storage on page load
window.addEventListener('DOMContentLoaded', () => {
    // Try to restore data from Telegram cloud storage if available
    TelegramCloudStorage.restoreFromTelegram().then(() => {
        // Prepare leaderboard UI after potential restore
        LeaderboardUI.display();
    });
});