"use strict";

window.onload = init

// 重みづけデータ
const WeightData = [
    [30, -12, 0, -1, -1, 0, -12, 30],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [-1, -3, -1, -1, -1, -1, -3, -1],
    [0, -3, 0, -1, -1, 0, -3, 0],
    [-12, -15, -3, -3, -3, -3, -15, -12],
    [30, -12, 0, -1, -1, 0, -12, 30],
];

const BLACK = 1; // 自分
const WHITE = 2; // PC
let data = Array.from({ length: 8 }, () => Array(8).fill(0)); // 盤データ（0:なし、1:黒、2:白）
let myTurn = false; // 自分の番か否か

// 初期化
function init() {
    const board = document.getElementById("board");

    for (let i = 0; i < 8; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("td");
            cell.className = "cell";
            cell.id = `cell${i}${j}`;
            cell.onclick = handleClick;
            row.appendChild(cell);
        }
        board.appendChild(row);
    }

    // 最初に4つの石を配置
    put(3, 3, BLACK);
    put(4, 4, BLACK);
    put(3, 4, WHITE);
    put(4, 3, WHITE);
    update();
}

// 更新
function update() {
    const numWhite = countPieces(WHITE);
    const numBlack = countPieces(BLACK);

    document.getElementById("numBlack").textContent = numBlack;
    document.getElementById("numWhite").textContent = numWhite;

    const blackCanFlip = canFlip(BLACK);
    const whiteCanFlip = canFlip(WHITE);
    const message = document.getElementById("message");

    //黒または白が返せなかったら、または数が合計64だった場合

    if (numWhite + numBlack === 64 || (!blackCanFlip && !whiteCanFlip)) {
        if (numWhite > numBlack) message.textContent = "白の勝ち！";
        else if (numWhite < numBlack) message.textContent = "黒の勝ち！";
        else message.textContent = "引き分け";
        return;
    }

    if (!blackCanFlip) {
        showMessage("黒スキップ");
        myTurn = false;
    } else if (!whiteCanFlip) {
        showMessage("白スキップ");
        myTurn = true;
    } else {
        myTurn = !myTurn;
    }

    if (!myTurn) setTimeout(think, 1000);
}

// セルクリック時のイベントハンドラ
function handleClick(e) {
    if (!myTurn) return;

    const [i, j] = [...e.target.id].slice(4).map(Number);
    const flipped = getFlipCells(i, j, BLACK);

    if (flipped.length > 0) {
        flipped.forEach(([x, y]) => put(x, y, BLACK));
        put(i, j, BLACK);
        update();
    }
}

// (i, j)に色を置く
function put(i, j, color) {
    const cell = document.getElementById(`cell${i}${j}`);
    cell.textContent = "●";
    cell.className = `cell ${color === BLACK ? "black" : "white"}`;
    data[i][j] = color;
}

// 石を数える
function countPieces(color) {
    return data.flat().filter((cell) => cell === color).length;
}

// メッセージ表示
function showMessage(str) {
    const message = document.getElementById("message");
    message.textContent = str;
    setTimeout(() => (message.textContent = ""), 2000);
}

// cpu思考
function think() {
    let highScore = -Infinity;
    let px = -1, py = -1;

    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const tmpData = copyData();
            const flipped = getFlipCells(x, y, WHITE);

            if (flipped.length > 0) {
                flipped.forEach(([i, j]) => (tmpData[i][j] = WHITE));
                tmpData[x][y] = WHITE;

                const score = calcWeightData(tmpData);
                if (score > highScore) [highScore, px, py] = [score, x, y];
            }
        }
    }

    if (px >= 0 && py >= 0) {
        getFlipCells(px, py, WHITE).forEach(([i, j]) => put(i, j, WHITE));
        put(px, py, WHITE);
    }

    update();
}

// 重みづけ計算
function calcWeightData(tmpData) {
    return tmpData.flat().reduce((sum, cell, idx) => {
        const [x, y] = [Math.floor(idx / 8), idx % 8];
        return sum + (cell === WHITE ? WeightData[x][y] : 0);
    }, 0);
}

// データをコピー
function copyData() {
    return data.map((row) => [...row]);
}

// 石を挟めるか判定
function canFlip(color) {
    return data.some((_, x) =>
        data[x].some((_, y) => getFlipCells(x, y, color).length > 0)
    );
}

// 挟める石を取得
function getFlipCells(i, j, color) {
    if (data[i][j]) return [];

    const directions = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0], [1, 0],
        [-1, 1], [0, 1], [1, 1],
    ];

    return directions.flatMap(([dx, dy]) => getFlipCellsInDir(i, j, dx, dy, color));
}

function getFlipCellsInDir(i, j, dx, dy, color) {
    let x = i + dx, y = j + dy;
    const flipped = [];

    while (x >= 0 && y >= 0 && x < 8 && y < 8 && data[x][y] && data[x][y] !== color) {
        flipped.push([x, y]);
        x += dx;
        y += dy;
    }

    return data[x]?.[y] === color ? flipped : [];
}