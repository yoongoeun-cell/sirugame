import React, { useState, useRef, useEffect } from "react";

const GRID_SIZE = 4;
const CELL_SIZE = window.innerWidth < 500 ? 60 : 100;
const GAME_TIME = 30;

function getRandomNumber() {
  return Math.floor(Math.random() * 9) + 1;
}

export default function AppleGame() {
  const [grid, setGrid] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [dragRect, setDragRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const dragStartRef = useRef(null);
  const gameAreaRef = useRef(null);

  const startGame = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill(0)
        .map(() =>
          Array(GRID_SIZE)
            .fill(0)
            .map(() => getRandomNumber())
        )
    );
    setSelectedCells([]);
    setDragRect(null);
    setIsDragging(false);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setCombo(0);
    setIsGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted) return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameStarted]);

  const handleMouseDown = (e) => {
    if (isGameOver) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
    setDragRect({
      left: e.clientX - rect.left,
      top: e.clientY - rect.top,
      width: 0,
      height: 0,
    });
    setSelectedCells([]);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const left = Math.min(dragStartRef.current.x, currentX);
    const top = Math.min(dragStartRef.current.y, currentY);
    const width = Math.abs(dragStartRef.current.x - currentX);
    const height = Math.abs(dragStartRef.current.y - currentY);
    setDragRect({ left, top, width, height });
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragRect(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const endCoord = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    selectCellsInRect(dragStartRef.current, endCoord);
  };

  // 📌 모바일 드래그 개선
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const handleTouchStart = (e) => {
      if (isGameOver) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = gameArea.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      dragStartRef.current = { x, y };
      setIsDragging(true);
      setDragRect({ left: x, top: y, width: 0, height: 0 });
      setSelectedCells([]);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = gameArea.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const left = Math.min(dragStartRef.current.x, x);
      const top = Math.min(dragStartRef.current.y, y);
      const width = Math.abs(dragStartRef.current.x - x);
      const height = Math.abs(dragStartRef.current.y - y);
      setDragRect({ left, top, width, height });
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setIsDragging(false);
      setDragRect(null);
      const touch = e.changedTouches[0];
      const rect = gameArea.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      selectCellsInRect(dragStartRef.current, { x, y });
    };

    gameArea.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    gameArea.addEventListener("touchmove", handleTouchMove, { passive: false });
    gameArea.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      gameArea.removeEventListener("touchstart", handleTouchStart);
      gameArea.removeEventListener("touchmove", handleTouchMove);
      gameArea.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, isGameOver]);

  const coordToIndex = (coord) => ({
    row: Math.min(GRID_SIZE - 1, Math.floor(coord.y / CELL_SIZE)),
    col: Math.min(GRID_SIZE - 1, Math.floor(coord.x / CELL_SIZE)),
  });

  const selectCellsInRect = (start, end) => {
    if (!start || !end) return;
    const startIdx = coordToIndex(start);
    const endIdx = coordToIndex(end);
    const rowMin = Math.min(startIdx.row, endIdx.row);
    const rowMax = Math.max(startIdx.row, endIdx.row);
    const colMin = Math.min(startIdx.col, endIdx.col);
    const colMax = Math.max(startIdx.col, endIdx.col);

    const cells = [];
    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        cells.push({ row: r, col: c });
      }
    }
    setSelectedCells(cells);

    const sum = cells.reduce((acc, { row, col }) => acc + grid[row][col], 0);
    if (sum === 10) {
      removeSelectedCells(cells);
      setCombo((prev) => prev + 1);
      const comboBonus = combo >= 1 ? 5 : 0;
      setScore((prev) => prev + 10 + comboBonus);
    } else {
      setCombo(0);
    }
  };

  const removeSelectedCells = (cells) => {
    const newGrid = grid.map((row) => [...row]);
    cells.forEach(({ row, col }) => {
      newGrid[row][col] = 0;
    });

    for (let col = 0; col < GRID_SIZE; col++) {
      const colVals = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        if (newGrid[row][col] !== 0) colVals.push(newGrid[row][col]);
      }
      while (colVals.length < GRID_SIZE) {
        colVals.unshift(getRandomNumber());
      }
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row][col] = colVals[row];
      }
    }
    setGrid(newGrid);
    setSelectedCells([]);
  };

  if (!gameStarted) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2>🍎 사과 합 10 게임 🍎</h2>
        <button
          onClick={startGame}
          style={{
            fontSize: "24px",
            padding: "12px 24px",
            cursor: "pointer",
            backgroundColor: "#F44336",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
          }}
        >
          게임 시작하기
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        userSelect: "none",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <h2>🍎 사과 합 10 게임 🍎</h2>
      <div style={{ fontSize: "18px", marginBottom: "10px" }}>
        <strong>점수:</strong> {score} &nbsp;|&nbsp; <strong>콤보:</strong>{" "}
        {combo} &nbsp;|&nbsp; <strong>남은 시간:</strong> {timeLeft}s
      </div>
      {isGameOver && (
        <div
          style={{ color: "#F44336", fontWeight: "bold", marginBottom: "10px" }}
        >
          게임 종료! 최종 점수: {score}
        </div>
      )}
      <div
        ref={gameAreaRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          touchAction: "none",
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          border: "3px solid #333",
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          cursor: isGameOver ? "default" : "crosshair",
          position: "relative",
          backgroundColor: "#f9f9f9",
          margin: "0 auto",
        }}
      >
        {grid.flatMap((row, rIdx) =>
          row.map((num, cIdx) => {
            const isSelected = selectedCells.some(
              (cell) => cell.row === rIdx && cell.col === cIdx
            );
            return (
              <div
                key={`${rIdx}-${cIdx}`}
                style={{
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  lineHeight: `${CELL_SIZE - 2}px`,
                  border: "1px solid #ccc",
                  textAlign: "center",
                  backgroundColor: isSelected ? "#8fbc8f" : "#fff2f2",
                  fontWeight: "bold",
                  fontSize: CELL_SIZE / 3,
                  userSelect: "none",
                }}
              >
                🍎{num}
              </div>
            );
          })
        )}
        {dragRect && (
          <div
            style={{
              position: "absolute",
              left: dragRect.left,
              top: dragRect.top,
              width: dragRect.width,
              height: dragRect.height,
              backgroundColor: "rgba(0, 128, 255, 0.2)",
              border: "2px dashed #0080ff",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}
      </div>
      <button
        onClick={startGame}
        style={{
          fontSize: "20px",
          padding: "10px 20px",
          cursor: "pointer",
          marginTop: "20px",
          backgroundColor: "#F44336",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
        }}
      >
        게임 다시하기
      </button>
    </div>
  );
}
