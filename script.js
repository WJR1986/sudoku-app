// Global variables
let solvedBoard;
let puzzleBoard;
let initialPuzzle; 
let selectedCell = null;
let gameActive = true;

// Difficulty settings (number of holes)
const DIFFICULTY_LEVELS = {
    easy: 30,
    medium: 40,
    hard: 50,
    expert: 60
};

/**
 * Renders the Sudoku board with enhanced grid visibility
 */
function renderBoard(board) {
    const boardContainer = document.getElementById('sudoku-board');
    boardContainer.innerHTML = ''; 

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i; 
            cell.dataset.col = j;

            const isPuzzleCell = initialPuzzle[i][j] !== 0;
            const cellValue = board[i][j];

            if (isPuzzleCell) {
                cell.textContent = cellValue;
                cell.classList.add('puzzle-cell');
            } else {
                if (cellValue !== 0) {
                    cell.textContent = cellValue;
                    cell.classList.add('user-cell');
                    // Check if the user's number is valid
                    if (!isValidPlacement(board, cellValue, [i, j])) {
                        cell.classList.add('incorrect');
                    }
                }
                cell.addEventListener('click', function() {
                    if (gameActive) handleCellClick(this);
                });
            }

            if (selectedCell && selectedCell.row == i && selectedCell.col == j) {
                cell.classList.add('selected');
            }
            
            boardContainer.appendChild(cell);
        }
    }
}

/**
 * Handles clicks on cells to select them.
 */
function handleCellClick(cellElement) {
    selectedCell = {
        row: parseInt(cellElement.dataset.row),
        col: parseInt(cellElement.dataset.col)
    };
    renderBoard(puzzleBoard);
    
    // Show keyboard on mobile after selection
    if (window.innerWidth < 992) {
        document.getElementById('number-pad').style.display = 'flex';
    }
}

/**
 * Handles keyboard input to place numbers
 */
document.addEventListener('keydown', function(event) {
    if (!selectedCell || !gameActive) return; 

    const key = event.key;
    const row = selectedCell.row;
    const col = selectedCell.col;
    let num;

    // Only allow changes to non-puzzle cells
    if (initialPuzzle[row][col] !== 0) return;

    if (key >= '1' && key <= '9') {
        num = parseInt(key);
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        num = 0; 
    } else {
        return; 
    }

    puzzleBoard[row][col] = num;
    renderBoard(puzzleBoard);
    checkWinCondition();
});

/**
 * Checks if the board is fully and correctly solved.
 */
function checkWinCondition() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            // If any cell is empty or incorrect, the game is not won yet
            if (puzzleBoard[i][j] === 0 || puzzleBoard[i][j] !== solvedBoard[i][j]) {
                return;
            }
        }
    }
    
    // If we get here, the board is perfect!
    gameActive = false;
    setStatusMessage("Congratulations! You solved the puzzle!", true);
    showConfetti();
}

// --- Game Control Functions ---

/**
 * Checks the current board for errors
 */
function checkAnswers() {
    let hasErrors = false;
    
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (initialPuzzle[i][j] === 0 && puzzleBoard[i][j] !== 0) {
                if (puzzleBoard[i][j] !== solvedBoard[i][j]) {
                    hasErrors = true;
                }
            }
        }
    }
    
    if (hasErrors) {
        setStatusMessage("Some answers are incorrect. Keep trying!", false);
    } else {
        setStatusMessage("All your answers are correct so far! Keep going!", true);
    }
    
    // Re-render to show errors
    renderBoard(puzzleBoard);
}

/**
 * Resets the puzzle to its initial state
 */
function resetPuzzle() {
    puzzleBoard = initialPuzzle.map(row => [...row]);
    selectedCell = null;
    gameActive = true;
    renderBoard(puzzleBoard);
    setStatusMessage("Puzzle has been reset", true);
}

/**
 * Creates a new game with the selected difficulty
 */
function newGame() {
    const difficulty = document.getElementById('difficulty').value;
    startNewGame(difficulty);
}

/**
 * Starts a new game with the specified difficulty
 */
function startNewGame(difficulty) {
    const holes = DIFFICULTY_LEVELS[difficulty];
    initializeGame(holes);
    setStatusMessage(`New ${difficulty} game started!`, true);
}

/**
 * Sets the status message
 */
function setStatusMessage(message, isSuccess) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? 'var(--success-color)' : 'var(--danger-color)';
}

// --- Generator and Solver Functions ---

function createPuzzle(board, holes) {
    let puzzle = board.map(row => [...row]); 
    let removed = 0;
    let cells = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) cells.push([i, j]);
    cells = shuffle(cells);

    for (let [row, col] of cells) {
        if (removed >= holes) break;
        let temp = puzzle[row][col];
        puzzle[row][col] = 0; 
        let solutionCount = countSolutions(puzzle.map(r => [...r]));
        if (solutionCount !== 1) {
            puzzle[row][col] = temp;
        } else {
            removed++;
        }
    }
    return puzzle;
}

function countSolutions(board) {
    let count = 0;
    function solve() {
        let find = findEmptyCell(board);
        if (!find) { count++; return; }
        let [row, col] = find;
        for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(board, num, [row, col])) {
                board[row][col] = num;
                solve();
                if (count > 1) return; 
                board[row][col] = 0;
            }
        }
    }
    solve();
    return count;
}

function generateSolvedSudokuGrid(board) {
    let find = findEmptyCell(board);
    if (!find) return true;
    let [row, col] = find;
    let numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let num of numbers) {
        if (isValidPlacement(board, num, [row, col])) {
            board[row][col] = num;
            if (generateSolvedSudokuGrid(board)) return true;
            board[row][col] = 0;
        }
    }
    return false;
}

function findEmptyCell(board) {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (board[i][j] === 0) return [i, j];
    return null;
}

function isValidPlacement(board, num, pos) {
    const [row, col] = pos;
    // Check row for duplicates
    for (let j = 0; j < 9; j++) {
        if (board[row][j] === num && col !== j) return false;
    }
    // Check column for duplicates
    for (let i = 0; i < 9; i++) {
        if (board[i][col] === num && row !== i) return false;
    }
    // Check 3x3 sub-grid for duplicates
    const boxX = Math.floor(col / 3);
    const boxY = Math.floor(row / 3);
    for (let i = boxY * 3; i < boxY * 3 + 3; i++) {
        for (let j = boxX * 3; j < boxX * 3 + 3; j++) {
            if (board[i][j] === num && (i !== row || j !== col)) return false;
        }
    }
    return true;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Main Execution ---

function initializeGame(holes = 40) {
    let baseBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    generateSolvedSudokuGrid(baseBoard);
    solvedBoard = baseBoard.map(row => [...row]); 

    puzzleBoard = createPuzzle(solvedBoard, holes);
    initialPuzzle = puzzleBoard.map(row => [...row]); 

    selectedCell = null;
    gameActive = true;
    renderBoard(puzzleBoard);
}

// --- Theme Switching Functionality ---

function setupThemeSwitcher() {
    const themeSwitch = document.getElementById('theme-switch');
    const htmlElement = document.documentElement;
    
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-bs-theme', savedTheme);
    themeSwitch.checked = savedTheme === 'dark';
    
    // Add event listener
    themeSwitch.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// --- Confetti Animation ---

function showConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '1000';
    document.body.appendChild(confettiContainer);
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.top = '-10px';
            confetti.style.opacity = '0.8';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confettiContainer.appendChild(confetti);
            
            const animation = confetti.animate([
                { top: '-10px', transform: `rotate(${Math.random() * 360}deg)` },
                { top: `${100 + Math.random() * 20}%`, transform: `rotate(${Math.random() * 720}deg)` }
            ], {
                duration: 3000 + Math.random() * 3000,
                easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
            });
            
            animation.onfinish = () => confetti.remove();
        }, i * 20);
    }
    
    // Remove container after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 10000);
}

// --- Mobile Keyboard Functions ---

function setupMobileKeyboard() {
    const numberPad = document.getElementById('number-pad');
    const keyboardToggle = document.getElementById('keyboard-toggle');
    
    // Add event listeners to number buttons
    document.querySelectorAll('.num-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (!selectedCell || !gameActive) return;
            
            const value = parseInt(this.dataset.value);
            const row = selectedCell.row;
            const col = selectedCell.col;
            
            // Only allow changes to non-puzzle cells
            if (initialPuzzle[row][col] !== 0) return;
            
            puzzleBoard[row][col] = value;
            renderBoard(puzzleBoard);
            checkWinCondition();
        });
    });
    
    // Add event listener to clear button
    document.querySelector('.clear-btn').addEventListener('click', function() {
        if (!selectedCell || !gameActive) return;
        
        const row = selectedCell.row;
        const col = selectedCell.col;
        
        // Only allow changes to non-puzzle cells
        if (initialPuzzle[row][col] !== 0) return;
        
        puzzleBoard[row][col] = 0;
        renderBoard(puzzleBoard);
    });
    
    // Toggle keyboard visibility
    keyboardToggle.addEventListener('click', function() {
        if (numberPad.style.display === 'flex') {
            numberPad.style.display = 'none';
        } else {
            numberPad.style.display = 'flex';
        }
    });
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('check-button').addEventListener('click', checkAnswers);
    document.getElementById('reset-button').addEventListener('click', resetPuzzle);
    document.getElementById('new-game-button').addEventListener('click', newGame);
    
    // Add event listener for difficulty change
    document.getElementById('difficulty').addEventListener('change', function() {
        const difficulty = this.value;
        startNewGame(difficulty);
    });
    
    // Set up theme switcher
    setupThemeSwitcher();
    
    // Set up mobile keyboard
    setupMobileKeyboard();
    
    // Start the game
    initializeGame();
});