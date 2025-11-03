// DEVELOPER REMINDER: Ensure all visual assets, text, and code for this game are your original creation or are properly licensed for commercial use to avoid copyright infringement.

export function init() {
    const boardElement = document.getElementById('game-board');
    const statusElement = document.getElementById('status-text');
    const overlay = document.getElementById('game-overlay');
    const overlayMessage = document.getElementById('game-overlay-message');
    const resetButton = document.getElementById('reset-game-btn');
    const i18nData = document.getElementById('i18n-data');

    const size = 15;
    let board = [];
    let currentPlayer = 1; // 1 for Black, 2 for White
    let gameActive = true;

    function setupGame() {
        board = Array.from({ length: size }, () => Array(size).fill(0));
        gameActive = true;
        currentPlayer = 1;
        statusElement.textContent = i18nData.dataset.blackTurn;
        overlay.classList.remove('visible');
        createBoard();
        updateForbiddenMarkers();
    }

    function createBoard() {
        boardElement.innerHTML = '<div class="gomoku-board-bg"></div>';
    }

    function updateTurn() {
        statusElement.textContent = `${currentPlayer === 1 ? i18nData.dataset.blackTurn : i18nData.dataset.whiteTurn}`;
        updateForbiddenMarkers();
    }

    function handleBoardClick(e) {
        if (!gameActive) return;

        const rect = boardElement.getBoundingClientRect();
        const totalSize = rect.width;
        const padding = totalSize / (size + 1) / 2; // Approximate padding
        const effectiveSize = totalSize - padding * 2;
        const cellSize = effectiveSize / (size - 1);
        
        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;

        const col = Math.round(x / cellSize);
        const row = Math.round(y / cellSize);

        if (col < 0 || col >= size || row < 0 || row >= size || board[row][col] !== 0) {
            return;
        }

        if (currentPlayer === 1 && isForbidden(row, col)) {
            return;
        }

        placeStone(row, col);

        if (checkWin(row, col)) {
            endGame(`${currentPlayer === 1 ? i18nData.dataset.blackWins : i18nData.dataset.whiteWins}`);
            return;
        }

        if (board.flat().every(cell => cell !== 0)) {
            endGame(i18nData.dataset.draw);
            return;
        }

        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurn();
    }

    function placeStone(row, col, isMark = false) {
        if (!isMark) board[row][col] = currentPlayer;
        
        const element = document.createElement('div');
        const paddingPercent = (100 / (size + 1) / 2);
        const areaPercent = 100 - (paddingPercent * 2);
        const cellPercent = areaPercent / (size - 1);

        if (isMark) {
            element.className = 'forbidden-mark';
            element.textContent = 'X';
        } else {
            element.className = `stone ${currentPlayer === 1 ? 'black' : 'white'}`;
        }
        
        element.style.left = `${paddingPercent + col * cellPercent}%`;
        element.style.top = `${paddingPercent + row * cellPercent}%`;
        
        boardElement.appendChild(element);
    }

    function updateForbiddenMarkers() {
        boardElement.querySelectorAll('.forbidden-mark').forEach(m => m.remove());
        if (currentPlayer !== 1 || !gameActive) return;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0 && isForbidden(r, c)) {
                    placeStone(r, c, true);
                }
            }
        }
    }

    function isForbidden(r, c) {
        board[r][c] = 1;
        const patterns = getPatterns(r, c, 1);
        board[r][c] = 0;

        if (patterns.overlines > 0) return true;
        if (patterns.openThrees >= 2) return true;
        if (patterns.fours >= 2) return true;
        
        return false;
    }

    function getPatterns(r, c, player) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        let overlines = 0, openThrees = 0, fours = 0;

        for (const [dr, dc] of directions) {
            let stones = 1;
            let line = [player];

            for (let i = 1; i < 6; i++) {
                const cell = board[r + dr * i]?.[c + dc * i];
                line.push(cell);
                if (cell === player) stones++; else break;
            }
            for (let i = 1; i < 6; i++) {
                const cell = board[r - dr * i]?.[c - dc * i];
                line.unshift(cell);
                if (cell === player) stones++; else break;
            }

            if (stones >= 6) overlines++;
            const lineStr = line.map(v => v === undefined ? 'B' : v).join('');
            if (player === 1) {
                if (/(01110|010110|011010)/.test(lineStr)) openThrees++;
                if (lineStr.match(/11101|11011|10111|01111|11110/)) fours++;
            }
        }
        return { overlines, openThrees, fours };
    }

    function checkWin(r, c) {
        const player = board[r][c];
        const directions = [[1,0], [0,1], [1,1], [1,-1]];

        for (const [dr, dc] of directions) {
            let count = 1;
            for (let i = 1; i < 6; i++) { if (board[r + dr * i]?.[c + dc * i] === player) count++; else break; }
            for (let i = 1; i < 6; i++) { if (board[r - dr * i]?.[c - dc * i] === player) count++; else break; }

            if (player === 1) { if (count === 5) return true; }
            else { if (count >= 5) return true; }
        }
        return false;
    }

    function endGame(message) {
        gameActive = false;
        overlayMessage.textContent = message;
        overlay.classList.add('visible');
        updateForbiddenMarkers();
    }

    boardElement.addEventListener('click', handleBoardClick);
    resetButton.addEventListener('click', setupGame);
    setupGame();
}