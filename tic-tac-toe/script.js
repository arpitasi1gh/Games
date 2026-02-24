let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;

const winningLines = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

// ----------------------------
//  YOUR FUNCTIONS (UNCHANGED)
// ----------------------------

function handleClick(index) {
  if (board[index] || gameOver) return;

  board[index] = currentPlayer;
  updateUI(index, currentPlayer);

  const winningLine = checkWin();
  if (winningLine) return endGame(winningLine);

  if (!board.includes(null)) return endGame(null);

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

function checkWin() {
  for (let [a,b,c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a,b,c];
    }
  }
  return null;
}

function endGame(winningLine) {
  gameOver = true;

  if (winningLine) {
    highlightCells(winningLine);
    showMessage(`Player ${board[winningLine[0]]} wins!`);
  } else {
    showMessage("It's a draw!");
  }
}

function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  clearUI();
}

// ----------------------------
// AI (optional, still your code)
// ----------------------------
function aiMove() {
  const emptyCells = board
    .map((v, i) => (v === null ? i : null))
    .filter(v => v !== null);

  const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  handleClick(choice);
}

function rematchGame() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  clearUI();
}

// ----------------------------
// Helper Functions (NEW)
// ----------------------------
function updateUI(index, player) {
  document.querySelector(`[data-index="${index}"]`).textContent = player;
}

function showMessage(msg) {
  document.getElementById("message").textContent = msg;
}

function highlightCells(winningLine) {
  winningLine.forEach(i => {
    document.querySelector(`[data-index="${i}"]`).classList.add("win");
  });
}

function clearUI() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("win");
  });
  showMessage("");
}

// ----------------------------
// Event Listeners
// ----------------------------
document.querySelectorAll(".cell").forEach(cell => {
  cell.addEventListener("click", () => handleClick(cell.dataset.index));
});

document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("rematch-btn").addEventListener("click", rematchGame);
