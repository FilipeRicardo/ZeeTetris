let live = true;
let playerScore;
let lineY = 450;
let aimX = 100;
let aimY = 405;
const colors = ["#0142fe","#ff3401","#fef52a","#01ed31","#ff8e0c","#ab4eff"];
let blocks = [];
let intGameLoop;
let intCreateLine;
let loop = 0;
const moveAimSound = new Audio("sound.mp3");

function initialize() {
  playerScore = 0;
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
  live = true;
  playerScore = 0;
  aimX = 100;
  aimY = 405;
  loop = 0;
  startGame();
}

function shuffle(arr) {
  for(var j, x, i = arr.length; i; j = Math.floor(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
  return arr;
}

function moveAim(x,y) {
  aimX += x;
  // aim collision low
  if (aimX < 0 || aimX > 200) {
    aimX -= x;
  }
  // aim collision side
  aimY += y;
  if (aimY > 450) {
    aimY -= y;
  }
  // aim collision top
  if (aimY < 0) {
    aimY += 50;
  }
}

function moveLines(num) {
  for (var i = 0; i < blocks.length; i++) {
    for (var ii = 0; ii < blocks[i].length; ii++) {
      blocks[i][ii][1] -= num; 
    }
  }
  moveAim(0,-num);
}

function createLine(lines) {
  //console.debug("loop:" + loop + " resto:" + loop%10);
  if (loop%10 == 0) {
    lines = typeof lines !== 'undefined' ? lines : 1;
    for (var line = 0; line < lines; line++) {
      moveLines(5);
      tempBlocks = [];
      item_x = 0;
      for (var i = 0; i < 6; i++) {
        tempBlocks.push([item_x,500,shuffle(colors)[0]]);
        item_x += 50;
      }
      blocks.push(tempBlocks);
    }
  } else {
    moveLines(5);
  }
  loop += 1;
}

function reverseBlock() {
  tempBlocks = [];
  for (var i = 0; i < blocks.length; i++) {
    for (var ii = 0; ii < blocks[i].length; ii++) {
      if (blocks[i][ii][1] == aimY && (blocks[i][ii][0] >= aimX && blocks[i][ii][0] <= aimX + 50)) {
        tempBlocks.push([i,ii]);
      }
    }
  }
  cor1 = blocks[tempBlocks[0][0]][tempBlocks[0][1]][2];
  cor2 = blocks[tempBlocks[1][0]][tempBlocks[1][1]][2];
  console.debug(cor1 + " - " + cor2);
  //if (cor1 != "grey" && cor2 != "grey") {
    blocks[tempBlocks[0][0]][tempBlocks[0][1]][2] = cor2;
    blocks[tempBlocks[1][0]][tempBlocks[1][1]][2] = cor1;
  //}
  moveAimSound.play();
}

function checkGravity() {
  for (var i = 0; i < 6; i++) {
    for (var ii = blocks.length-1; ii > 0; ii--) {
      if (ii > 0) {
        if (blocks[ii][i][2] == "") {
          blocks[ii][i][2] = blocks[ii-1][i][2];
          blocks[ii-1][i][2] = "";
        }
      }
    }
  }
}

function checkLive() {
  if (blocks.length > 10) {
    position = blocks.length - 11
    for (var i = 0; i < blocks[position].length; i++) {
      if (blocks[position][i][2] != "") {
        live = false;
        break;
      }
    }
  }
}

function explosion(arr) {
  var alpha = 1;
  intervalo = setInterval(function(){
    for (var i = 0; i < arr.length; i++) {
      x = blocks[arr[i][0]][arr[i][1]][0];
      y = blocks[arr[i][0]][arr[i][1]][1];
      context.fillStyle = "rgba(128, 128, 128, " + alpha + ")";
      context.fillRect(x, y, 50, 50);
      context.beginPath();
      context.lineWidth="1";
      context.strokeStyle="#404040";
      context.rect(x, y, 50, 50);
      context.stroke();
    }
    if(alpha < 0){
      for (var i = 0; i < arr.length; i++) {
        blocks[arr[i][0]][arr[i][1]][2] = "";
      }
      clearInterval(intervalo);
    }
    alpha -= 0.1;
  },1000);
}

function checkExplosion() {
  arr = [];
  for (var i = 0; i < blocks.length; i++) {
    var ac = 0;
    for (var ii = 0; ii < blocks[i].length; ii++) {
      if (ii > 0) {
        if (blocks[i][ii][2] == blocks[i][ii-1][2] && (blocks[i][ii-1][2] != "" && blocks[i][ii-1][2] != "grey")) {
          ac += 1;
        } else {
          ac = 0;
        }
        if (ac > 1) {
          for (var iii = 0; iii < ac+1; iii++) {
            blocks[i][iii+(ii-ac)][2] = "";
            arr.push([i,iii+(ii-ac)]);
          }
          playerScore += ((ac+1) * 10);
        }
      }
    }
  }
  checkGravity();
  for (var i = 0; i < 6; i++) {
    var ac = 0;
    var check = false;
    for (var ii = 0; ii < blocks.length; ii++) {
      if (ii > 0) {
        if (blocks[ii][i][2] == blocks[ii-1][i][2] && blocks[ii-1][i][2] != "") {
          ac += 1;
          check = true;
        } else {
          check = false;
        }
        if (ac > 1 && (!check || ii >= blocks.length-1)) {
          if (check) {
            position = ii;
          } else {
            position = ii-1;
          }
          for (var iii = 0; iii < ac+1; iii++) {
            blocks[iii+(position-ac)][i][2] = "";
          }
          if (ac+1 == 3) { 
            playerScore += ((ac+1) * 10);
          } else if (ac+1 == 4) {
            playerScore += ((ac+1) * 30);
          } else if (ac+1 > 4) {
            playerScore += ((ac+1) * 50);
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
      if (blocks[i][ii][2] != "" && blocks[i][ii][2] != "grey") {
        context.fillStyle = blocks[i][ii][2];
        context.fillRect(blocks[i][ii][0], blocks[i][ii][1], 50, 50);
        context.beginPath();
        context.lineWidth="3";
        context.strokeStyle="#ffffff";
        context.rect(blocks[i][ii][0], blocks[i][ii][1], 50, 50);
        context.stroke();
      }
    }
  }
}

function drawAim() {
  context.beginPath();
  context.lineWidth = "4";
  context.strokeStyle = "black";
  context.rect(aimX+2, aimY+2, 96, 46); 
  context.stroke();
}

function drawScoreboard() {
  context.fillStyle = "black";
  context.textAlign = 'right';
  context.font = "32pt Tahoma";
  context.fillText(playerScore, canvas.width - 20, 50);
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
  context.fillText("X: " + aimX + " Y:" + aimY,5,15);

  checkLive();

  // Start

  if (blocks.length == 0) {
    context.fillStyle = "black";
    context.textAlign = 'center';
    context.font = "14pt Arial";
    context.fillText("Press 'ENTER' to start", canvas.width / 2, canvas.height / 2);
  }

  // Game Over

  if (live == false) {
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