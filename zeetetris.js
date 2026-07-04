const initialGameState = {
  live: true,
  playerScore: 0,
  loop: 0,
  started: false
};

const initialPlayer = {
  aimX: 100,
  aimY: 405
};

let gameState = { ...initialGameState };
let player = { ...initialPlayer };

const CONFIG = {
  BLOCK_SIZE: 50,
  COLUMNS: 6,
  ROWS_VISIBLE: 10, // Quantidade de blocos antes do Game Over
  CANVAS_HEIGHT: 500,
  COLORS: ["#0142fe","#ff3401","#fef52a","#01ed31","#ff8e0c","#ab4eff"],
  get CANVAS_WIDTH() {
    return this.COLUMNS * this.BLOCK_SIZE;
  }
};

let canvas;
let context;
let blocks = [];
let intGameLoop;
let intCreateLine;
const moveAimSound = new Audio("sound.mp3");

class Block {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = CONFIG.BLOCK_SIZE;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  moveDown() {
    this.y += this.size;
  }
}

function initialize() {
  gameState.playerScore = 0;
  canvas = document.getElementById("canvas");
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  context = canvas.getContext("2d");
  document.addEventListener('keydown', keyDown);
  intGameLoop = setInterval(gameLoop, 30);
}

function startGame() {
  if (!gameState.started) {
    gameState.started = true;

    createLine(1);
    clearInterval(intCreateLine);
    intCreateLine = setInterval(createLine, 1000);
  }
}

function restartGame() {
  clearInterval(intCreateLine);
  blocks.length = 0;
  gameState = { ...initialGameState };
  player = { ...initialPlayer };
  startGame();
}

function randomColor() {
  return CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
}

function moveAim(x,y) {
  // aim collision low
  player.aimX += x;
  let maxX = (CONFIG.COLUMNS - 2) * CONFIG.BLOCK_SIZE;
  if (player.aimX < 0 || player.aimX > maxX) {
    player.aimX -= x;
  }
  // aim collision side
  player.aimY += y;
  let maxY = CONFIG.CANVAS_HEIGHT - CONFIG.BLOCK_SIZE
  if (player.aimY > maxY) {
    player.aimY -= y;
  }
  // aim collision top
  if (player.aimY < 0) {
    player.aimY += CONFIG.BLOCK_SIZE;
  }
}

function moveLines(num) {
  for (var i = 0; i < blocks.length; i++) {
    for (var ii = 0; ii < blocks[i].length; ii++) {
      let block = blocks[i][ii];
      block.y -= num;
    }
  }
  moveAim(0,-num);
}

function createLine(lines) {
  if (gameState.loop%10 == 0) {
    lines = typeof lines !== 'undefined' ? lines : 1;
    for (var line = 0; line < lines; line++) {
      moveLines(5);
      let tempBlocks = [];
      let itemX = 0;
      for (var i = 0; i < CONFIG.COLUMNS; i++) {
        let block = new Block(itemX, CONFIG.CANVAS_HEIGHT, randomColor());
        tempBlocks.push(block);
        itemX += CONFIG.BLOCK_SIZE;
      }
      blocks.push(tempBlocks);
    }
  } else {
    moveLines(5);
  }
  gameState.loop += 1;
}

function reverseBlock() {
  let tempBlocks = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let ii = 0; ii < blocks[i].length; ii++) {
      let block = blocks[i][ii];
      if (block.y == player.aimY && block.x >= player.aimX && block.x <= player.aimX + CONFIG.BLOCK_SIZE) {
        tempBlocks.push([i,ii]);
      }
    }
  }
  if (tempBlocks.length >= 2) {
    let firstBlock = blocks[tempBlocks[0][0]][tempBlocks[0][1]];
    let secondBlock = blocks[tempBlocks[1][0]][tempBlocks[1][1]];
    let tempColor = firstBlock.color;
    firstBlock.color = secondBlock.color;
    secondBlock.color = tempColor;
    console.debug(firstBlock.color + " - " + secondBlock.color);
  }
  moveAimSound.play();
}

function applyGravity() {
  for (let i = 0; i < CONFIG.COLUMNS; i++) {
    for (let ii = blocks.length-1; ii > 0; ii--) {
      let currentBlock = blocks[ii][i];
      let aboveBlock = blocks[ii - 1][i];
      if (ii > 0) {
        if (currentBlock.color === "") {
          currentBlock.color = aboveBlock.color;
          aboveBlock.color = "";
        }
      }
    }
  }
}

function checkLive() {
  if (blocks.length > CONFIG.ROWS_VISIBLE) {
    let position = blocks.length - (CONFIG.ROWS_VISIBLE + 1);
    for (let i = 0; i < blocks[position].length; i++) {
      let block = blocks[position][i];
      if (block.color !== "") {
        gameState.live = false;
        break;
      }
    }
  }
}

function executeHorizontalExplosions() {
  for (let i = 0; i < blocks.length; i++) {
    let ac = 0;
    for (let ii = 0; ii < blocks[i].length; ii++) {
      if (ii > 0) {
        let currentBlock = blocks[i][ii];
        let previousBlock = blocks[i][ii - 1];
        if (currentBlock.color === previousBlock.color && currentBlock.color !== "") {
          ac += 1;
        } else {
          ac = 0;
        }
        if (ac > 1) {
          for (let iii = 0; iii < ac + 1; iii++) {
            blocks[i][ii - ac + iii].color = "";
          }
          gameState.playerScore += ((ac+1) * 10);
        }
      }
    }
  }
}

function executeVerticalExplosions() {
  for (let i = 0; i < CONFIG.COLUMNS; i++) {
    let ac = 0;
    let check = false;
    for (let ii = 0; ii < blocks.length; ii++) {
      if (ii > 0) {
        let currentBlock = blocks[ii][i];
        let previousBlock = blocks[ii - 1][i];
        if (currentBlock.color === previousBlock.color && currentBlock.color !== "") {
          ac += 1;
          check = true;
        } else {
          check = false;
        }
        if (ac > 1 && (!check || ii >= blocks.length - 1)) {
          let position = check ? ii : ii - 1;
          for (let iii = 0; iii < ac + 1; iii++) {
            blocks[iii+(position-ac)][i].color = "";
          }
          if (ac + 1 === 3) {
            gameState.playerScore += ((ac + 1) * 10);
          } else if (ac + 1 === 4) {
            gameState.playerScore += ((ac + 1) * 30);
          } else if (ac + 1 > 4) {
            gameState.playerScore += ((ac + 1) * 50);
          }
        }
        if (check == false) {
          ac = 0;
        }
      }       
    }
  }
}

function executeExplosions() {
  executeHorizontalExplosions();

  applyGravity();

  executeVerticalExplosions();

  applyGravity();
}

function keyDown(e) {
  e.preventDefault();
  switch (e.keyCode) {
    case 37:
      moveAim(-CONFIG.BLOCK_SIZE,0); // left
      break;
    case 38:
      moveAim(0,-CONFIG.BLOCK_SIZE); // up
      break;
    case 39:
      moveAim(CONFIG.BLOCK_SIZE,0); // right
      break;
    case 40:
      moveAim(0,CONFIG.BLOCK_SIZE); // down
      break;
    case 32:
      reverseBlock(); // space
      break;
    case 13:
      startGame(); // enter
      break;
    case 8:
      restartGame(); // backSpace
      break;
    default:
  }
}

function drawBlocks() {
  for (var i = 0; i < blocks.length; i++) {
    for (var ii = 0; ii < blocks[i].length; ii++) {
      let block = blocks[i][ii];
      if (block.color !== "") {
        context.fillStyle = block.color;
        context.fillRect(block.x, block.y, block.size, block.size);
        context.beginPath();
        context.lineWidth = "3";
        context.strokeStyle = "#ffffff";
        context.rect(block.x, block.y, block.size, block.size);
        context.stroke();
      }
    }
  }
}

function drawAim() {
  const lineWidth = 4
  context.beginPath();
  context.lineWidth = lineWidth;
  context.strokeStyle = "black";
  context.rect(
    player.aimX + (lineWidth / 2), 
    player.aimY + (lineWidth / 2), 
    (CONFIG.BLOCK_SIZE * 2) - lineWidth, 
    CONFIG.BLOCK_SIZE - lineWidth
  );
  context.stroke();
}

function drawScoreboard() {
  context.fillStyle = "black";
  context.textAlign = 'right';
  context.font = "32pt Tahoma";
  context.fillText(gameState.playerScore, CONFIG.CANVAS_WIDTH - 20, 50);
}

function gameLoop() {

  // Clear Screen
  context.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Draw Background
  context.fillStyle = "#e5e5e5";
  context.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  drawBlocks();

  drawAim();

  drawScoreboard();

  executeExplosions();

  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const centerY = CONFIG.CANVAS_HEIGHT / 2;

  // Print Coordinates

  context.fillStyle = "black";
  context.textAlign = 'left';
  context.font = "10pt Arial";
  context.fillText("X: " + player.aimX + " Y:" + player.aimY,5,15);

  checkLive();

  // Start

  if (blocks.length == 0) {
    context.fillStyle = "black";
    context.textAlign = 'center';
    context.font = "14pt Arial";
    context.fillText("Press 'ENTER' to start", centerX, centerY);
  }

  // Game Over

  if (gameState.live == false) {
    context.fillStyle = "black";
    context.textAlign = 'center';
    context.font = "32pt Arial";
    context.fillText("Game Over", centerX, centerY);

    context.fillStyle = "black";
    context.textAlign = 'center';
    context.font = "14pt Arial";
    context.fillText("Press 'backSpace' to restart game", centerX, (centerY) + 25);

    clearInterval(intCreateLine);
  }

}
