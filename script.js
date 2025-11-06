// Tetris game logic
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let currentPiece;
let nextPiece;
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = false;
let paused = false;
let dropTimer = 0;
let dropInterval = 1000;

// Tetromino shapes
const TETROMINOS = {
    I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    O: [[1,1], [1,1]],
    T: [[0,1,0], [1,1,1], [0,0,0]],
    S: [[0,1,1], [1,1,0], [0,0,0]],
    Z: [[1,1,0], [0,1,1], [0,0,0]],
    J: [[1,0,0], [1,1,1], [0,0,0]],
    L: [[0,0,1], [1,1,1], [0,0,0]]
};

const COLORS = {
    I: '#00FFFF',
    O: '#FFFF00',
    T: '#800080',
    S: '#00FF00',
    Z: '#FF0000',
    J: '#0000FF',
    L: '#FFA500'
};

// Initialize game
function init() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    currentPiece = createPiece();
    nextPiece = createPiece();
    updateDisplay();
}

// Create a new piece
function createPiece(type = null) {
    const types = Object.keys(TETROMINOS);
    const randomType = type || types[Math.floor(Math.random() * types.length)];
    return {
        shape: TETROMINOS[randomType],
        color: COLORS[randomType],
        x: Math.floor(COLS / 2) - 1,
        y: 0,
        type: randomType
    };
}

// Draw the board
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#333';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Draw the current piece
function drawPiece(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                ctx.fillStyle = piece.color;
                ctx.fillRect((piece.x + x) * BLOCK_SIZE, (piece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#333';
                ctx.strokeRect((piece.x + x) * BLOCK_SIZE, (piece.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Draw next piece
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            if (nextPiece.shape[y][x]) {
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.fillRect(x * 20 + 20, y * 20 + 20, 20, 20);
                nextCtx.strokeStyle = '#333';
                nextCtx.strokeRect(x * 20 + 20, y * 20 + 20, 20, 20);
            }
        }
    }
}

// Check collision
function collision(piece, dx = 0, dy = 0, newShape = null) {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Rotate piece
function rotate(piece) {
    const rotated = piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse());
    if (!collision(piece, 0, 0, rotated)) {
        piece.shape = rotated;
    }
}

// Move piece
function move(piece, dx, dy) {
    if (!collision(piece, dx, dy)) {
        piece.x += dx;
        piece.y += dy;
        return true;
    }
    return false;
}

// Place piece on board
function placePiece(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                board[piece.y + y][piece.x + x] = piece.color;
            }
        }
    }
}

// Clear lines
function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(50, 1000 - (level - 1) * 50);
    }
}

// Game over check
function isGameOver() {
    return board[0].some(cell => cell !== 0);
}

// Update display
function updateDisplay() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('lines').textContent = `Lines: ${lines}`;
    document.getElementById('level').textContent = `Level: ${level}`;
    drawNextPiece();
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning || paused) return;

    if (timestamp - dropTimer > dropInterval) {
        if (!move(currentPiece, 0, 1)) {
            placePiece(currentPiece);
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            if (collision(currentPiece)) {
                gameRunning = false;
                alert('Game Over!');
                return;
            }
        }
        dropTimer = timestamp;
    }

    drawBoard();
    drawPiece(currentPiece);
    updateDisplay();

    requestAnimationFrame(gameLoop);
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning || paused) return;

    switch (e.key) {
        case 'ArrowLeft':
            move(currentPiece, -1, 0);
            break;
        case 'ArrowRight':
            move(currentPiece, 1, 0);
            break;
        case 'ArrowDown':
            move(currentPiece, 0, 1);
            break;
        case 'ArrowUp':
            rotate(currentPiece);
            break;
        case ' ':
            e.preventDefault();
            while (move(currentPiece, 0, 1)) {}
            break;
    }
});

// Start game
document.getElementById('start-btn').addEventListener('click', () => {
    init();
    gameRunning = true;
    paused = false;
    requestAnimationFrame(gameLoop);
});

// Pause game
document.getElementById('pause-btn').addEventListener('click', () => {
    paused = !paused;
    if (!paused) {
        requestAnimationFrame(gameLoop);
    }
});
