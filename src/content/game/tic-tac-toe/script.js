// DEVELOPER REMINDER: Ensure all visual assets, text, and code for this game are your original creation or are properly licensed for commercial use to avoid copyright infringement.

export function init() {
    const boardElement = document.getElementById('game-board');
    const statusElement = document.getElementById('status-text');
    const overlay = document.getElementById('game-overlay');
    const overlayMessage = document.getElementById('game-overlay-message');
    const resetButton = document.getElementById('reset-game-btn');

    const size = 3;
    let board = Array(size * size).fill(null);
    let currentPlayer = 'X';
    let gameActive = true;
    let cells = [];

    function setupGame() {
        board.fill(null);
        gameActive = true;
        currentPlayer = 'X';
        statusElement.textContent = `${currentPlayer}'s Turn`;
        overlay.classList.remove('visible');
        
        // Create grid cells if they don't exist
        if (cells.length === 0) {
            boardElement.innerHTML = ''; // Clear board
            for (let i = 0; i < size * size; i++) {
                const cell = document.createElement('div');
                cell.classList.add('game-cell');
                cell.dataset.index = i;
                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
                cells.push(cell);
            }
        }

        // Reset cell content and styles
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'win', 'win-x', 'win-o');
        });
    }

    function handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);
        if (!gameActive || board[index] !== null) {
            return;
        }

        updateCell(index);
        
        const winnerInfo = checkWinner();
        if (winnerInfo) {
            endGame(`${currentPlayer} Wins!`, winnerInfo.pattern);
            return;
        }

        if (board.every(cell => cell !== null)) {
            endGame('Draw!');
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusElement.textContent = `${currentPlayer}'s Turn`;
    }

    function updateCell(index) {
        board[index] = currentPlayer;
        cells[index].textContent = currentPlayer;
        cells[index].classList.add(currentPlayer.toLowerCase());
    }

    function checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], pattern };
            }
        }
        return null;
    }

    function endGame(message, winPattern = []) {
        gameActive = false;
        overlayMessage.textContent = message;
        overlay.classList.add('visible');

        if (winPattern.length > 0) {
            const winnerClass = `win-${currentPlayer.toLowerCase()}`;
            winPattern.forEach(index => {
                cells[index].classList.add('win', winnerClass);
            });
        }
    }

    resetButton.addEventListener('click', setupGame);
    setupGame();
}