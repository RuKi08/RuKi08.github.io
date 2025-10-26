export function init2048Game() {
    const gridElement = document.getElementById('grid-container');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const newGameButton = document.getElementById('new-game-btn');
    const overlay = document.getElementById('game-overlay');
    const overlayMessage = document.getElementById('game-overlay-message');

    const size = 4;
    const storageKey = '2048-best-score';
    let board = [];
    let score = 0;
    let bestScore = 0;
    let gameActive = true;

    function setupGame() {
        board = Array.from({ length: size }, () => Array(size).fill(0));
        score = 0;
        gameActive = true;
        updateScore(0, true); // Reset score, but don't add to it
        overlay.classList.remove('visible');
        createBackgroundGrid();
        
        addRandomTile();
        addRandomTile();
        renderTiles({ newPositions: board.flat().map((v, i) => v ? {r: Math.floor(i/4), c: i%4} : null).filter(Boolean) });
    }

    function createBackgroundGrid() {
        if (gridElement.children.length === 0) {
            for (let i = 0; i < size * size; i++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                gridElement.appendChild(cell);
            }
        }
    }

    function renderTiles({ newPositions = [], mergedPositions = [] } = {}) {
        const tileContainer = document.getElementById('tile-container');
        tileContainer.innerHTML = '';

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const value = board[r][c];
                if (value > 0) {
                    const isNew = newPositions.some(p => p.r === r && p.c === c);
                    const isMerged = mergedPositions.some(p => p.r === r && p.c === c);
                    createTile(r, c, value, isNew, isMerged);
                }
            }
        }
    }

    function createTile(row, col, value, isNew = false, isMerged = false) {
        const tile = document.createElement('div');
        const tileContainer = document.getElementById('tile-container');
        tile.className = 'game-tile';
        if (isNew) tile.classList.add('tile-new');
        if (isMerged) tile.classList.add('tile-merged');
        
        tile.dataset.value = value;
        tile.style.setProperty('--x', col + 1);
        tile.style.setProperty('--y', row + 1);
        tile.textContent = value;
        
        tile.addEventListener('animationend', () => tile.classList.remove('tile-new', 'tile-merged'), { once: true });

        tileContainer.appendChild(tile);
    }

    function updateScore(points, isReset = false) {
        if (isReset) {
            score = 0;
        } else {
            score += points;
        }
        scoreElement.textContent = score;

        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem(storageKey, bestScore);
        }
    }

    function loadBestScore() {
        bestScore = parseInt(localStorage.getItem(storageKey) || '0');
        bestScoreElement.textContent = bestScore;
    }

    function addRandomTile() {
        let emptyTiles = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0) {
                    emptyTiles.push({ r, c });
                }
            }
        }
        if (emptyTiles.length > 0) {
            const pos = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            board[pos.r][pos.c] = Math.random() > 0.9 ? 4 : 2;
            return pos;
        }
        return null;
    }

    function move(direction) {
        if (!gameActive) return;
        let moved = false;
        let tempScore = 0;
        let newBoard = board.map(row => [...row]);
        let mergedPositions = [];

        const isVertical = direction === 'ArrowUp' || direction === 'ArrowDown';
        const isReverse = direction === 'ArrowRight' || direction === 'ArrowDown';

        for (let i = 0; i < size; i++) {
            const line = isVertical ? newBoard.map(row => row[i]) : newBoard[i];
            const { newLine, moved: lineMoved, score: lineScore, merges } = transformLine(line, isReverse);
            
            if (lineMoved) moved = true;
            tempScore += lineScore;

            merges.forEach(merge => {
                const mergePos = isVertical ? { r: merge.to, c: i } : { r: i, c: merge.to };
                mergedPositions.push(mergePos);
            });

            for (let j = 0; j < size; j++) {
                if (isVertical) newBoard[j][i] = newLine[j];
                else newBoard[i][j] = newLine[j];
            }
        }

        if (moved) {
            board = newBoard;
            updateScore(tempScore);
            const newTilePos = addRandomTile();
            renderTiles({ newPositions: newTilePos ? [newTilePos] : [], mergedPositions });
            
            if (isGameOver()) {
                gameActive = false;
                setTimeout(() => {
                    overlayMessage.textContent = 'Game Over!';
                    overlay.classList.add('visible');
                }, 200);
            }
        }
    }

    function transformLine(line, reverse) {
        if (reverse) line.reverse();
        let filtered = line.filter(v => v > 0);
        let score = 0;
        const merges = [];
        let resultLine = [];

        for (let i = 0; i < filtered.length; i++) {
            if (i < filtered.length - 1 && filtered[i] === filtered[i+1]) {
                const newValue = filtered[i] * 2;
                score += newValue;
                resultLine.push(newValue);
                merges.push({ to: resultLine.length - 1 });
                i++;
            } else {
                resultLine.push(filtered[i]);
            }
        }

        let newLine = Array(size).fill(0);
        resultLine.forEach((v, i) => newLine[i] = v);
        
        if (reverse) {
            newLine.reverse();
            merges.forEach(m => m.to = size - 1 - m.to);
        }

        const moved = line.join(',') !== newLine.join(',');
        return { newLine, moved, score, merges };
    }

    function isGameOver() {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0) return false;
                if (r < size - 1 && board[r][c] === board[r + 1][c]) return false;
                if (c < size - 1 && board[r][c] === board[r][c + 1]) return false;
            }
        }
        return true;
    }

    function handleKeyPress(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            move(e.key);
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    newGameButton.addEventListener('click', setupGame);
    overlay.querySelector('button').addEventListener('click', setupGame);
    
    loadBestScore();
    setupGame();
}