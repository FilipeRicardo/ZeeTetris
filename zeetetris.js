const initialGameState = {
  live: true,
  playerScore: 0,
  loop: 0
};

const initialPlayer = {
  aimX: 100,
  aimY: 405
};

let gameState = { ...initialGameState };
let player = { ...initialPlayer };

const colors = ["#0142fe","#ff3401","#fef52a","#01ed31","#ff8e0c","#ab4eff"];
let blocks = [];
let intGameLoop;
let intCreateLine;
const moveAimSound = new Audio("sound.mp3");

class Block {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = 50;
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
  context = canvas.getContext("2d");        
  document.addEventListener('keydown', keyDown);
  gameLoop();
}

function startGame() {
  if (blocks.length == 0) {
    clearInterval(intGameLoop);
    clearInterval(intCreateLine);
    createLine(1);
    intGameLoop = setInterval(gameLoop, 30);
    intCreateLine = setInterval(createLine, 1000);
  }
}

function restartGame() {
  blocks.length = 0; // clear blocks
  gameState = { ...initialGameState };
  player = { ...initialPlayer };
  startGame();
}

function shuffle(arr) {
  for(var j, x, i = arr.length; i; j = Math.floor(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
  return arr;
}

function moveAim(x,y) {
  player.aimX += x;
  // aim collision low
  if (player.aimX < 0 || player.aimX > 200) {
    player.aimX -= x;
  }
  // aim collision side
  player.aimY += y;
  if (player.aimY > 450) {
    player.aimY -= y;
  }
  // aim collision top
  if (player.aimY < 0) {
    player.aimY += 50;
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
      tempBlocks = [];
      item_x = 0;
      for (var i = 0; i < 6; i++) {
        //tempBlocks.push([item_x,500,shuffle(colors)[0]]);
        let block = new Block(item_x, 500, shuffle(colors)[0]);
        tempBlocks.push(block);
        item_x += 50;
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
      if (block.y == player.aimY && block.x >= player.aimX && block.x <= player.aimX + 50) {
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

function checkGravity() {
  for (let i = 0; i < 6; i++) {
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
  if (blocks.length > 10) {
    let position = blocks.length - 11;
    for (let i = 0; i < blocks[position].length; i++) {
      let block = blocks[position][i];
      if (block.color !== "") {
        gameState.live = false;
        break;
      }
    }
  }
}

function explosion(arr) {
  var alpha = 1;
  let intervalo = setInterval(function(){
    for (let i = 0; i < arr.length; i++) {
      let block = blocks[arr[i][0]][arr[i][1]];
      let x = block.x;
      let y = block.y;
      //context.fillStyle = "rgba(128, 128, 128, " + alpha + ")";
      context.fillStyle = `rgba(128, 128, 128, ${alpha})`;
      context.fillRect(x, y, block.size, block.size);
      context.beginPath();
      context.lineWidth = "1";
      context.strokeStyle = "#404040";
      context.rect(x, y, block.size, block.size);
      context.stroke();
    }
    if(alpha < 0){
      for (let i = 0; i < arr.length; i++) {
        let block = blocks[arr[i][0]][arr[i][1]];
        block.color = "";
      }
      clearInterval(intervalo);
    }
    alpha -= 0.1;
  },1000);
}

function checkExplosion() {
  let arr = [];
  for (let i = 0; i < blocks.length; i++) {
    let ac = 0;
    for (let ii = 0; ii < blocks[i].length; ii++) {
      if (ii > 0) {
        let currentBlock = blocks[i][ii];
        let previousBlock = blocks[i][ii - 1];
        if (currentBlock.color === previousBlock.color && currentBlock.color !== "" && currentBlock.color !== "grey") {
          ac += 1;
        } else {
          ac = 0;
        }
        if (ac > 1) {
          for (let iii = 0; iii < ac + 1; iii++) {
            blocks[i][ii - ac + iii].color = "";
            arr.push([i,iii+(ii-ac)]);
          }
          gameState.playerScore += ((ac+1) * 10);
        }
      }
    }
  }
  checkGravity();
  for (let i = 0; i < 6; i++) {
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
  checkGravity();
}

function keyDown(e) {
  switch (e.keyCode) {
    case 37:
      moveAim(-50,0); // left
      break;
    case 38:
      moveAim(0,-50); // up
      break;
    case 39:
      moveAim(50,0); // right
      break;
    case 40:
      moveAim(0,50); // down
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
      if (block.color !== "" && block.color !== "grey") {
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
  context.beginPath();
  context.lineWidth = "4";
  context.strokeStyle = "black";
  context.rect(player.aimX+2, player.aimY+2, 96, 46); 
  context.stroke();
}

function drawScoreboard() {
  context.fillStyle = "black";
  context.textAlign = 'right';
  context.font = "32pt Tahoma";
  context.fillText(gameState.playerScore, canvas.width - 20, 50);
}

function gameLoop() {

  // Clear Screen
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Background
  context.fillStyle = "#e5e5e5";
  context.fillRect(300, 0, 300, 500);

  drawBlocks();

  drawAim();

  drawScoreboard();

  checkExplosion();

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
    context.fillText("Press 'ENTER' to start", canvas.width / 2, canvas.height / 2);
  }

  // Game Over

  if (gameState.live == false) {
    context.fillStyle = "black";
    context.textAlign = 'center';
    context.font = "32pt Arial";
    context.fillText("Game Over", canvas.width / 2, canvas.height / 2);

    context.fillStyle = "black";
    context.textAlign = 'center';
    context.font = "14pt Arial";
    context.fillText("Press 'backSpace' to restart game", canvas.width / 2, (canvas.height / 2) + 25);

    clearInterval(intGameLoop);
    clearInterval(intCreateLine);
  }

}
