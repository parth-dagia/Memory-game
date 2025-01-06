document.addEventListener('DOMContentLoaded', () => {
    // Game configuration
    const config = {
        difficulties: {
            easy: { gridSize: 4, cardPairs: 8 },
            medium: { gridSize: 6, cardPairs: 18 },
            hard: { gridSize: 8, cardPairs: 32 }
        },
        hintCount: 3,
        cardSymbols: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ',
    };

    // Game state
    let gameState = {
        cards: [],
        firstCard: null,
        secondCard: null,
        isProcessing: false,
        score: 0,
        moves: 0,
        matchedPairs: 0,
        timeElapsed: 0,
        difficulty: 'easy',
        hintsRemaining: config.hintCount,
        isPaused: false,
        timer: null,
        username: '',
        avatar: '',
    };

    // DOM Elements
    const elements = {
        gameBoard: document.getElementById('game-board'),
        timer: document.getElementById('timer'),
        score: document.getElementById('score'),
        moves: document.getElementById('moves'),
        hintCount: document.querySelector('.hint-count'),
        progress: document.querySelector('.progress'),
        startButton: document.getElementById('start-game-button'),
        resetButton: document.getElementById('reset-button'),
        pauseButton: document.getElementById('pause-button'),
        hintButton: document.getElementById('hint-button'),
        usernameInput: document.getElementById('username'),
        avatarSelection: document.querySelector('.avatar-selection'),
        leaderboardList: document.getElementById('leaderboard-list'),
        difficultyButtons: document.querySelectorAll('.difficulty-selector button'),
        leaderboardTabs: document.querySelectorAll('.leaderboard-tabs button')
    };

    // Initialize game
    function initGame() {
        bindEventListeners();
        loadLeaderboard();
    }

    // Event Listeners
    function bindEventListeners() {
        elements.startButton.addEventListener('click', startGame);
        elements.resetButton.addEventListener('click', resetGame);
        elements.pauseButton.addEventListener('click', togglePause);
        elements.hintButton.addEventListener('click', useHint);
        
        elements.difficultyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                setDifficulty(e.target.dataset.difficulty);
            });
        });

        elements.avatarSelection.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                gameState.avatar = e.target.dataset.avatar;
                document.querySelectorAll('.avatar-selection img').forEach(img => {
                    img.style.border = 'none';
                });
                e.target.style.border = '3px solid var(--primary-color)';
            }
        });
    }

    // Game Logic
    function startGame() {
        gameState.username = elements.usernameInput.value.trim();
        if (!gameState.username || !gameState.avatar) {
            alert('Please enter your name and select an avatar');
            return;
        }

        document.getElementById('registration').classList.add('hidden');
        elements.gameBoard.classList.remove('hidden');
        document.querySelector('.controls').classList.remove('hidden');

        initializeGameState();
        createBoard();
        startTimer();
    }

    function initializeGameState() {
        gameState = {
            ...gameState,
            score: 0,
            moves: 0,
            matchedPairs: 0,
            timeElapsed: 0,
            hintsRemaining: config.hintCount,
            isPaused: false
        };
        updateUI();
    }

    function createBoard() {
        const { gridSize, cardPairs } = config.difficulties[gameState.difficulty];
        const symbols = config.cardSymbols.split('').slice(0, cardPairs);
        gameState.cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    
        elements.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        elements.gameBoard.innerHTML = gameState.cards
            .map((symbol, index) => `
                <div class="card" data-index="${index}">
                    <div class="card-inner">
                        <div class="card-front"></div>
                        <div class="card-back">${symbol}</div>
                    </div>
                </div>
            `).join('');
    
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', handleCardClick);
        });
    }

    function handleCardClick(e) {
        if (gameState.isPaused || gameState.isProcessing) return;
        
        const card = e.currentTarget;
        if (card === gameState.firstCard || card.classList.contains('matched')) return;

        flipCard(card);

        if (!gameState.firstCard) {
            gameState.firstCard = card;
        } else {
            gameState.secondCard = card;
            gameState.moves++;
            checkMatch();
        }
        
        updateUI();
    }

    function flipCard(card) {
        card.classList.add('flipped');
    }

    function checkMatch() {
        gameState.isProcessing = true;
        const firstSymbol = gameState.cards[gameState.firstCard.dataset.index];
        const secondSymbol = gameState.cards[gameState.secondCard.dataset.index];

        if (firstSymbol === secondSymbol) {
            handleMatch();
        } else {
            handleMismatch();
        }
    }

    function handleMatch() {
        gameState.firstCard.classList.add('matched');
        gameState.secondCard.classList.add('matched');
        gameState.matchedPairs++;
        gameState.score += calculateScore();

        if (gameState.matchedPairs === config.difficulties[gameState.difficulty].cardPairs) {
            endGame();
        }

        resetTurn();
        updateUI();
    }

    function handleMismatch() {
        setTimeout(() => {
            gameState.firstCard.classList.remove('flipped');
            gameState.secondCard.classList.remove('flipped');
            resetTurn();
        }, 1000);
    }

    function resetTurn() {
        gameState.firstCard = null;
        gameState.secondCard = null;
        gameState.isProcessing = false;
    }

    function calculateScore() {
        const baseScore = 100;
        const timeMultiplier = Math.max(0.1, 1 - (gameState.timeElapsed / 180));
        const difficultyMultiplier = {
            easy: 1,
            medium: 1.5,
            hard: 2
        }[gameState.difficulty];

        return Math.round(baseScore * timeMultiplier * difficultyMultiplier);
    }

    // Timer Functions
    function startTimer() {
        gameState.timer = setInterval(() => {
            if (!gameState.isPaused) {
                gameState.timeElapsed++;
                updateUI();
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // UI Updates
    function updateUI() {
        elements.timer.textContent = formatTime(gameState.timeElapsed);
        elements.score.textContent = gameState.score;
        elements.moves.textContent = gameState.moves;
        elements.hintCount.textContent = gameState.hintsRemaining;
        
        const progressPercentage = (gameState.matchedPairs / config.difficulties[gameState.difficulty].cardPairs) * 100;
        elements.progress.style.width = `${progressPercentage}%`;
    }

    // Hint System
    function useHint() {
        if (gameState.hintsRemaining <= 0 || gameState.isPaused) return;

        const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
        if (unmatched.length < 2) return;

        gameState.hintsRemaining--;
        const firstUnmatched = unmatched[0];
        const symbol = gameState.cards[firstUnmatched.dataset.index];
        const match = unmatched.find(card => 
            card !== firstUnmatched && 
            gameState.cards[card.dataset.index] === symbol
        );

        if (match) {
            [firstUnmatched, match].forEach(card => {
                card.classList.add('hint');
                setTimeout(() => card.classList.remove('hint'), 1000);
            });
        }

        updateUI();
    }

    // Game Control Functions
    function togglePause() {
        gameState.isPaused = !gameState.isPaused;
        elements.gameBoard.style.filter = gameState.isPaused ? 'blur(5px)' : 'none';
        elements.pauseButton.querySelector('.text').textContent = 
            gameState.isPaused ? 'Resume' : 'Pause';
    }

    function resetGame() {
        clearInterval(gameState.timer);
        initializeGameState();
        createBoard();
        startTimer();
    }

    function setDifficulty(difficulty) {
        gameState.difficulty = difficulty;
        elements.difficultyButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.difficulty === difficulty);
        });
        if (gameState.timer) resetGame();
    }

    function endGame() {
        clearInterval(gameState.timer);
        updateLeaderboard();
        showGameOver();
    }

    // Leaderboard Functions
    function updateLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        leaderboard.push({
            name: gameState.username,
            avatar: gameState.avatar,
            score: gameState.score,
            time: gameState.timeElapsed,
            difficulty: gameState.difficulty,
            date: new Date().toISOString()
        });

        leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard.slice(0, 10)));
        displayLeaderboard();
    }

    function displayLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        elements.leaderboardList.innerHTML = leaderboard
            .map((entry, index) => `
                <li>
                    <span class="rank">#${index + 1}</span>
                    <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234CAF50'/></svg>" 
                         class="avatar" alt="Avatar ${entry.avatar}">
                    <span class="name">${entry.name}</span>
                    <span class="score">${entry.score}</span>
                </li>
            `)
            .join('');
    }

    function showGameOver() {
        const gameOver = document.getElementById('game-over');
        const finalTime = document.getElementById('final-time');
        const finalMoves = document.getElementById('final-moves');
        const finalScore = document.getElementById('final-score');
        const achievement = document.getElementById('achievement');

        finalTime.textContent = formatTime(gameState.timeElapsed);
        finalMoves.textContent = gameState.moves;
        finalScore.textContent = gameState.score;

        let achievementText = '';
        if (gameState.score > 1500) achievementText = '🏆 Memory Master!';
        else if (gameState.score > 1000) achievementText = '🌟 Expert Player!';
        else if (gameState.score > 500) achievementText = '👍 Great Job!';
        else achievementText = '🎮 Well Played!';

        achievement.textContent = achievementText;
        gameOver.classList.remove('hidden');
    }

    // Initialize the game
    initGame();
});