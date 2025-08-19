// Utility functions
function rand(max) { return Math.floor(Math.random() * max); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function changeBrightness(factor, sprite) {
    const virtCanvas = document.createElement("canvas");
    virtCanvas.width = sprite.width;
    virtCanvas.height = sprite.height;
    const ctx = virtCanvas.getContext("2d");
    ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height);
    const imgData = ctx.getImageData(0, 0, sprite.width, sprite.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] *= factor;
        imgData.data[i + 1] *= factor;
        imgData.data[i + 2] *= factor;
    }
    ctx.putImageData(imgData, 0, 0);
    const out = new Image();
    out.src = virtCanvas.toDataURL();
    return out;
}

function toggleVisablity(id) {
    const elem = document.getElementById(id);
    elem.style.visibility = (elem.style.visibility === "visible") ? "hidden" : "visible";
}

function displayVictoryMess(moves) {
    document.getElementById("moves").innerText = "You Moved " + moves + " Steps.";
    toggleVisablity("Message-Container");
}

// Maze Generator
function Maze(width, height) {
    let mazeMap = [], startCoord, endCoord;
    const dirs = ["n", "s", "e", "w"];
    const modDir = { n: {x:0,y:-1,o:"s"}, s:{x:0,y:1,o:"n"}, e:{x:1,y:0,o:"w"}, w:{x:-1,y:0,o:"e"} };

    this.map = () => mazeMap;
    this.startCoord = () => startCoord;
    this.endCoord = () => endCoord;

    // Initialize maze
    for (let y = 0; y < height; y++) {
        mazeMap[y] = [];
        for (let x = 0; x < width; x++) mazeMap[y][x] = { n:false,s:false,e:false,w:false,visited:false,priorPos:null };
    }

    // Start & End
    switch(rand(4)){
        case 0: startCoord={x:0,y:0}; endCoord={x:width-1,y:height-1}; break;
        case 1: startCoord={x:0,y:height-1}; endCoord={x:width-1,y:0}; break;
        case 2: startCoord={x:width-1,y:0}; endCoord={x:0,y:height-1}; break;
        case 3: startCoord={x:width-1,y:height-1}; endCoord={x:0,y:0}; break;
    }

    // Maze carving
    let pos={x:0,y:0}, cellsVisited=1, numCells=width*height;
    while(cellsVisited < numCells){
        mazeMap[pos.y][pos.x].visited = true;
        shuffle(dirs);
        let moved = false;
        for(let dir of dirs){
            let nx = pos.x + modDir[dir].x, ny = pos.y + modDir[dir].y;
            if(nx >= 0 && nx < width && ny >= 0 && ny < height && !mazeMap[ny][nx].visited){
                mazeMap[pos.y][pos.x][dir] = true;
                mazeMap[ny][nx][modDir[dir].o] = true;
                mazeMap[ny][nx].priorPos = {x:pos.x, y:pos.y};
                pos = {x:nx,y:ny};
                cellsVisited++;
                moved = true;
                break;
            }
        }
        if(!moved) pos = mazeMap[pos.y][pos.x].priorPos;
    }
}

// Draw Maze
function DrawMaze(Maze, ctx, cellSize, endSprite=null, background=null){
    const map = Maze.map();
    ctx.lineWidth = cellSize/40;

    function clear(){
        ctx.clearRect(0,0,cellSize*map[0].length,cellSize*map.length);
        if(background) ctx.drawImage(background, 0, 0, cellSize*map[0].length, cellSize*map.length);
    }

    function drawCell(x,y,cell){
        const px = x*cellSize, py=y*cellSize;
        ctx.strokeStyle="black";
        if(!cell.n){ ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+cellSize,py); ctx.stroke(); }
        if(!cell.s){ ctx.beginPath(); ctx.moveTo(px,py+cellSize); ctx.lineTo(px+cellSize,py+cellSize); ctx.stroke(); }
        if(!cell.e){ ctx.beginPath(); ctx.moveTo(px+cellSize,py); ctx.lineTo(px+cellSize,py+cellSize); ctx.stroke(); }
        if(!cell.w){ ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px,py+cellSize); ctx.stroke(); }
    }

    function drawMap(){ for(let y=0;y<map.length;y++) for(let x=0;x<map[y].length;x++) drawCell(x,y,map[y][x]); }

    function drawEnd(){
        const coord = Maze.endCoord();
        if(endSprite) ctx.drawImage(endSprite, coord.x*cellSize, coord.y*cellSize, cellSize, cellSize);
        else{ ctx.fillStyle="red"; ctx.fillRect(coord.x*cellSize,coord.y*cellSize,cellSize,cellSize); }
    }

    clear();
    drawMap();
    drawEnd();

    this.redrawMaze = function(newSize){ cellSize=newSize; ctx.lineWidth=cellSize/50; clear(); drawMap(); drawEnd(); };
}

// Player
function Player(maze, canvas, cellSize, onComplete, sprite=null){
    const ctx = canvas.getContext("2d");
    const halfCell = cellSize/2;
    let moves=0;
    let map = maze.map();
    let pos = {...maze.startCoord()};

    function drawPlayer(){
        if(sprite) ctx.drawImage(sprite,pos.x*cellSize,pos.y*cellSize,cellSize,cellSize);
        else{ ctx.fillStyle="yellow"; ctx.beginPath(); ctx.arc(pos.x*cellSize+halfCell,pos.y*cellSize+halfCell,halfCell-2,0,2*Math.PI); ctx.fill(); }
        if(pos.x===maze.endCoord().x && pos.y===maze.endCoord().y){ onComplete(moves); unbind(); }
    }

    function clearPlayer(){ ctx.clearRect(pos.x*cellSize,pos.y*cellSize,cellSize,cellSize); }

    function move(e){
        let cell = map[pos.y][pos.x]; moves++;
        switch(e.keyCode){
            case 37: case 65: if(cell.w){ clearPlayer(); pos.x--; drawPlayer(); } break;
            case 38: case 87: if(cell.n){ clearPlayer(); pos.y--; drawPlayer(); } break;
            case 39: case 68: if(cell.e){ clearPlayer(); pos.x++; drawPlayer(); } break;
            case 40: case 83: if(cell.s){ clearPlayer(); pos.y++; drawPlayer(); } break;
        }
    }

    function bind(){
        window.addEventListener("keydown",move);
        $("#view").swipe({swipe:function(event,direction){switch(direction){
            case "up": move({keyCode:38}); break;
            case "down": move({keyCode:40}); break;
            case "left": move({keyCode:37}); break;
            case "right": move({keyCode:39}); break;
        }}, threshold:0});
    }

    function unbind(){ window.removeEventListener("keydown",move); $("#view").swipe("destroy"); }

    drawPlayer();
    bind();

    this.redrawPlayer = function(newSize){ cellSize=newSize; drawPlayer(); };
    this.unbindKeyDown = unbind;
}

// Initialize
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
let maze, draw, player, cellSize, difficulty;
let playerSprite, goalSprite, backgroundImg;

function makeMaze(){
    if(player){ player.unbindKeyDown(); player=null; }
    const e=document.getElementById("diffSelect");
    difficulty=parseInt(e.value);
    cellSize = canvas.width/difficulty;
    maze = new Maze(difficulty,difficulty);
    draw = new DrawMaze(maze,ctx,cellSize,goalSprite,backgroundImg);
    player = new Player(maze,canvas,cellSize,displayVictoryMess,playerSprite);
    document.getElementById("mazeContainer").style.opacity="100";
}

window.onload = function(){
    const viewWidth=$("#view").width(), viewHeight=$("#view").height();
    canvas.width = canvas.height = Math.min(viewWidth,viewHeight) - 20;

    let loaded=0;
    function checkLoaded(){ loaded++; if(loaded===3) makeMaze(); }

    playerSprite = new Image(); playerSprite.src="robot.png"; playerSprite.onload=checkLoaded;
    goalSprite = new Image(); goalSprite.src="rocket.jpeg"; goalSprite.onload=checkLoaded;
    backgroundImg = new Image(); backgroundImg.src="background.jpg"; backgroundImg.onload=checkLoaded;
};

window.onresize = function(){
    const viewWidth=$("#view").width(), viewHeight=$("#view").height();
    canvas.width = canvas.height = Math.min(viewWidth,viewHeight) - 20;
    if(difficulty){
        cellSize = canvas.width/difficulty;
        if(draw){ draw.redrawMaze(cellSize); }
        if(player){ player.redrawPlayer(cellSize); }
    }
};
