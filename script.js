const rows = 10; // Số hàng trên bảng
const cols = 10; // Số cột trên bảng
const board = Array.from({ length: rows }, () => Array(cols).fill(0)); // Khởi tạo bảng (0: chưa bắn)
const shipSizes = [ 5, 4, 3, 3, 2 ]; // Kích thước tàu (vd: tàu 5 ô, 4 ô, ...)

const boardElement = document.getElementById("board");
const calculateButton = document.getElementById("calculateButton");
const bestShotDisplay = document.getElementById("bestShotDisplay");

// Hàm render bảng
function renderBoard() {
  boardElement.innerHTML = "";

  // Thêm tiêu đề cột (0, 1, 2, ...)
  for (let col = 0; col <= cols; col++) {
    const cell = document.createElement("div");
    cell.classList.add("cell", "header-cell");
    if (col > 0) {
      cell.textContent = col; // 0, 1, 2, ...
      cell.classList.add("col-header");
    }
    boardElement.appendChild(cell);
  }

  // Thêm các hàng và cột
  for (let row = 0; row < rows; row++) {
    // Thêm tiêu đề hàng (A, B, C, ...)
    const rowHeader = document.createElement("div");
    rowHeader.classList.add("cell", "header-cell", "row-header");
    rowHeader.textContent = String.fromCharCode(65 + row); // A, B, C, ...
    boardElement.appendChild(rowHeader);

    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (board[ row ][ col ] === 1) cell.classList.add("missed"); // Bắn trượt
      if (board[ row ][ col ] === -1) cell.classList.add("hit"); // Bắn trúng
      cell.dataset.row = row;
      cell.dataset.col = col;
      boardElement.appendChild(cell);
    }
  }
  addCellClickListeners();
}

// Hàm thêm sự kiện click cho từng ô
function addCellClickListeners() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.addEventListener("click", () => {
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);

      // Xoay trạng thái ô (0 -> 1 -> -1 -> 0)
      if (board[ row ][ col ] === 0) {
        board[ row ][ col ] = 1; // Bắn trượt
        cell.classList.add("missed");
        cell.classList.remove("hit", "best");
      } else if (board[ row ][ col ] === 1) {
        board[ row ][ col ] = -1;
        cell.classList.add("hit");
        cell.classList.remove("missed", "best");
      } else {
        board[ row ][ col ] = 0;
        cell.classList.remove("missed", "hit", "best");
      }
    });
  });
}

function findTopShots(board, remainingShips, topN = 3) {
  const rows = board.length;
  const cols = board[ 0 ].length;
  const probability = Array.from({ length: rows }, () => Array(cols).fill(0));

  function canPlaceShip(x, y, length, isHorizontal) {
    for (let i = 0; i < length; i++) {
      const nx = x + (isHorizontal ? 0 : i);
      const ny = y + (isHorizontal ? i : 0);
      if (nx < 0 || nx >= rows || ny < 0 || ny >= cols || board[ nx ][ ny ] !== 0) {
        return false;
      }
    }
    return true;
  }

  function addShipProbability(x, y, length, isHorizontal) {
    for (let i = 0; i < length; i++) {
      const nx = x + (isHorizontal ? 0 : i);
      const ny = y + (isHorizontal ? i : 0);
      probability[ nx ][ ny ]++;
    }
  }

  // Thêm xác suất dựa trên các tàu còn lại
  for (const ship of remainingShips) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (board[ i ][ j ] === 0) {
          // Nếu chưa bắn, tính toán xác suất dựa trên khả năng đặt tàu
          if (canPlaceShip(i, j, ship, true)) addShipProbability(i, j, ship, true);
          if (canPlaceShip(i, j, ship, false)) addShipProbability(i, j, ship, false);
        }
      }
    }
  }

  // Tìm các ô có xác suất cao nhất
  const candidates = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (board[ i ][ j ] === 0) {
        candidates.push({ row: i, col: j, prob: probability[ i ][ j ] });
      }
    }
  }

  // Sắp xếp theo xác suất giảm dần
  candidates.sort((a, b) => b.prob - a.prob);
  return candidates.slice(0, topN);
}


// Sự kiện khi nhấn nút tính toán
calculateButton.addEventListener("click", () => {
  const topShots = findTopShots(board, shipSizes, 10);
  renderBoard();

  if (topShots.length > 0) {
    const totalProb = topShots.reduce((sum, shot) => sum + shot.prob, 0);

    bestShotDisplay.textContent = `Best Shots: ${topShots
      .map(({ row, col, prob }) => {
        const letter = String.fromCharCode(65 + row); // Convert to A-J
        const number = col + 1; // Convert to 1-10
        const percentage = ((prob / totalProb) * 100).toFixed(1);
        return `${letter}${number} (${percentage}%)`;
      })
      .join(" | ")}`;

    topShots.forEach(({ row, col }) => {
      const bestCell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
      if (bestCell) bestCell.classList.add("best");
    });
  } else {
    bestShotDisplay.textContent = "No possible shots remaining!";
  }
});

// Hiển thị bảng lần đầu
renderBoard();
