const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// Get difficulty from URL (easy, medium, hard)
const urlParams = new URLSearchParams(window.location.search);
let difficulty = urlParams.get("difficulty") || "medium";

// Load pixel font
const racingFont = new FontFace("Pixel Font", "url(fonts/slkscr.ttf)");
racingFont.load().then(function(font) {
    document.fonts.add(font);
});

// Canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//different vehicle traits depending on difficulty
const vehicleProfiles = {
    easy: { accel: 0.1, maxSpeed: 2.5, turnSpeed: 0.07, color: "red" },
    medium: { accel: 0.2, maxSpeed: 4, turnSpeed: 0.05, color: "green" },
    hard: { accel: 0.3, maxSpeed: 6, turnSpeed: 0.035, color: "blue" }
};

//Sprites and setup
const spriteFiles = {
    easy: "sprites/sprite1.png",
    medium: "sprites/sprite2.png",
    hard: "sprites/sprite3.png"
};

const carImage = new Image();
carImage.src = spriteFiles[difficulty];

//audio setup
const sound = new Audio('audio/carstatic.m4a');
sound.loop = true;
sound.volume = 0.06;

//constructing camera
class Camera {
    #x;
    #y;
    constructor(x = 0, y = 0) {
        this.#x = x;
        this.#y = y;
    }

    //getters and setters for x and y
    get x() { return this.#x; }
    get y() { return this.#y; }

    set x(val) { this.#x = val; }
    set y(val) { this.#y = val; }
}

//constructing car
class Car extends Camera {
    #angle;
    #speed;
    constructor(x, y, profile) {
        super(x, y);
        this.#angle = 0;
        this.#speed = 0;

        this.width = 60;
        this.height = 30;

        this.accel = profile.accel;
        this.maxSpeed = profile.maxSpeed;
        this.turnSpeed = profile.turnSpeed;
        this.color = profile.color;

        this.checkpointIndex = 0;
        this.lap = 0;
    }

    //getters and setters for car alongside speed logic
    get angle() { return this.#angle; }
    get speed() { return this.#speed; }

    set angle(val) { this.#angle = val; }
    set speed(val) {
        this.#speed = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, val));
    }

    //actions

    //increase or decrease speed depending on direction
    accelerate(forward = true) {
        this.speed += forward ? this.accel : -this.accel;
    }

    //simulating friction
    applyFriction() {
        this.speed *= 0.95;
    }

    turn(left = true, factor = 1) {
        this.angle += (left ? -1 : 1) * this.turnSpeed * factor;
    }

    //updating x and y
    move() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    slowDown(amount = 0.95) {
        this.speed *= amount;
    }

    //collision response
    bounce() {
        this.x -= Math.cos(this.angle) * this.speed * 1.5;
        this.y -= Math.sin(this.angle) * this.speed * 1.5;
        this.speed *= 0.5;
    }

    //checkpoint logic
    nextCheckpoint(total, vehicle) {
        this.checkpointIndex++;
        if (this.checkpointIndex >= total) {
            this.checkpointIndex = 0;
            this.lap++;

            for(let i = 0; i < checkpoints.length; i++) {
                if (vehicle == car1) {
                    checkpoints[i].p1 = false;
                }
                else {
                    checkpoints[i].p2 = false;
                }
            }
        }
    }

    //used for collision detection
    get rect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}


//object creation (cameras and cars)
const camera1 = new Camera();
const camera2 = new Camera();

const car1 = new Car(300, 300, vehicleProfiles[difficulty]);
const car2 = new Car(400, 300, vehicleProfiles[difficulty]);


//the track
const road = [
    {x:0, y:200, w:2000, h:200},
    {x:800, y:200, w:200, h:900},
    {x:200, y:700, w:1600, h:200},
    {x:200, y:200, w:200, h:700}
];

//map bounds, car has to stay in map
const MAP_BOUNDS = { x: 0, y: 0, width: 3000, height: 2000 };

//data for buildings
const buildings = [
    {x:500, y:300, width:180, height:120},
    {x:1050, y:300, width:200, height:150},
    {x:600, y:820, width:240, height:130}
];

//data for checkpoints
const checkpoints = [
    {x:400, y:220, width:150, height:20, p1:false, p2:false},
    {x:1800, y:400, width:20, height:200, p1:false, p2:false},
    {x:800, y:900, width:150, height:20, p1:false, p2:false},
    {x:220, y:500, width:20, height:200, p1:false, p2:false}
];

//flowers
const flowers = Array.from({ length: 150 }, () => ({
    x: Math.random() * 3000,
    y: Math.random() * 2000,
    size: Math.random() * 4 + 3,
    color: ["#ff69b4", "#ffd700", "#ff4500", "#da70d6"][Math.floor(Math.random() * 4)]
}));

//Define maximum number of laps along with gameOver variable
const MAX_LAPS = 3;
let gameOver = false;

//controls of the car and implementing sound
const keys = {};
window.addEventListener("keydown", function(e) {
    keys[e.key.toLowerCase()] = true;
    if (keys["w"] || keys["s"] || keys["a"] || keys["d"] || keys["arrowup"] || keys["arrowdown"] || keys["arrowleft"] || keys["arrowright"]) {sound.play(); }
})

window.addEventListener("keyup", function(e) {
    keys[e.key.toLowerCase()] = false;
    if (!keys["w"] && !keys["s"] && !keys["a"] && !keys["d"] && !keys["arrowup"] && !keys["arrowdown"] && !keys["arrowleft"] && !keys["arrowright"]) { sound.pause(); }
})

//collisions with building
function boxCollision(a, b){
    const A = a.rect ? a.rect : a;
    return A.x < b.x + b.width &&
           A.x + A.width > b.x &&
           A.y < b.y + b.height &&
           A.y + A.height > b.y;
}

//collisions with car
function carCollision(carA, carB) {
    if (boxCollision(carA, carB)) {
        const tempSpeed = carA.speed;
        carA.speed = carB.speed;
        carB.speed = tempSpeed;

        const overlapX = (carA.x - carB.x) / 2;
        const overlapY = (carA.y - carB.y) / 2;
        carA.x += overlapX;
        carA.y += overlapY;
        carB.x -= overlapX;
        carB.y -= overlapY;
    }
}

//checks if something is on the road
function isOnRoad(x,y){
    return road.some(r => 
        x > r.x && x < r.x + r.w &&
        y > r.y && y < r.y + r.h
    );
}

//ensures that vehicle does not leave the map
function keepOnMap(vehicle) {
    if (vehicle.x < MAP_BOUNDS.x) {
        vehicle.x = MAP_BOUNDS.x;
        vehicle.speed *= -0.3;
    }

    if (vehicle.x > MAP_BOUNDS.width) {
        vehicle.x = MAP_BOUNDS.width;
        vehicle.speed *= -0.3;
    }

    if (vehicle.y < MAP_BOUNDS.y) {
        vehicle.y = MAP_BOUNDS.y;
        vehicle.speed *= -0.3;
    }

    if (vehicle.y > MAP_BOUNDS.height) {
        vehicle.y = MAP_BOUNDS.height;
        vehicle.speed *= -0.3;
    }
}

//updates player data -> feeds into update function
function updatePlayer(vehicle, cam, controls) {
    if (keys[controls.up])    vehicle.accelerate(true);
    if (keys[controls.down])  vehicle.accelerate(false);

    vehicle.applyFriction();

    const turnFactor = Math.max(0.3, 1 - Math.abs(vehicle.speed) / vehicle.maxSpeed);

    if (keys[controls.left])  vehicle.turn(true, turnFactor);
    if (keys[controls.right]) vehicle.turn(false, turnFactor);

    vehicle.move();
    keepOnMap(vehicle);

    if (!isOnRoad(vehicle.x, vehicle.y)) {
        vehicle.slowDown(0.92);
    }

    //updates how cars react with buildings and checkpoints
    buildings.forEach(b => {
        if (boxCollision(vehicle, b)) {
            vehicle.bounce();
        }
    });

    checkpoints.forEach((cp, i) => {
        if (boxCollision(vehicle, cp)) {
            if (vehicle === car1) cp.p1 = true;
            if (vehicle === car2) cp.p2 = true;

            if (i === vehicle.checkpointIndex) {
                vehicle.nextCheckpoint(checkpoints.length, vehicle);
            }
        }
    });

    //camera position follows player
    cam.x += (vehicle.x - cam.x - canvas.width / 4) * 0.08;
    cam.y += (vehicle.y - cam.y - canvas.height / 2) * 0.08;
}


//flowers being drawn
function drawFlower(f) {
    ctx.beginPath();
    ctx.fillStyle = f.color;
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x, f.y + 6);
    ctx.stroke();
}

//the track being drawn
function drawTrack(){
    ctx.fillStyle = "#3a5";
    ctx.fillRect(0,0,3000,2000);

    flowers.forEach(f => {
        if (!isOnRoad(f.x, f.y)) drawFlower(f);
    });

    ctx.fillStyle = "#555";
    road.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

    //sets up buildings
    buildings.forEach(b => {
        ctx.fillStyle = "#999";
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(b.x, b.y, b.width, b.height);
    });

    //sets up a lot of checkpoint logic
    checkpoints.forEach((c, i) => {
        if(c.p1 && c.p2) ctx.fillStyle = "purple";
        else if(c.p1) ctx.fillStyle = "red";
        else if(c.p2) ctx.fillStyle = "blue";
        else ctx.fillStyle = "rgba(134, 134, 32, 0.4)";
        
        ctx.fillRect(c.x, c.y, c.width, c.height);
        
        ctx.save();
        ctx.translate(c.x + c.width/2, c.y + c.height/2);
        if (c.height > c.width) {
            ctx.rotate(-Math.PI / 2);
        }
        
        ctx.fillStyle = "white";
        ctx.font = "16px Pixel Font";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.fillText(`Checkpoint ${i + 1}`, 0, 0);
        
        ctx.restore();
    });
}

//draws the players into the game world -> feeds into draw function
function drawPlayer(vehicle){
    ctx.save();
    ctx.translate(vehicle.x, vehicle.y);
    ctx.rotate(vehicle.angle);

    if (carImage.complete) {
        const ratio = carImage.width / carImage.height;
        const height = 60;
        const width = height * ratio;
        ctx.drawImage(carImage, -width/2, -height/2, width, height);
    } else {
        ctx.fillStyle = vehicle.color;
        ctx.fillRect(-20, -10, 40, 20);
    }
    ctx.restore();
}


//the camera view
function drawCamera(player, cam, viewportX){
    ctx.save();

    ctx.beginPath();
    ctx.rect(viewportX, 0, canvas.width/2, canvas.height);
    ctx.clip();

    ctx.translate(viewportX - cam.x, -cam.y);

    drawTrack();
    drawPlayer(car1);
    drawPlayer(car2);

    ctx.restore();

    ctx.strokeStyle = "white";
    ctx.strokeRect(viewportX, 0, canvas.width/2, canvas.height);
}

//Incorporates car collisions, player movement, and gameOver
function update(){
    if (gameOver == true) {return}
    updatePlayer(car1, camera1, {up:"w",down:"s",left:"a",right:"d"});
    updatePlayer(car2, camera2, {up:"arrowup",down:"arrowdown",left:"arrowleft",right:"arrowright"});
    carCollision(car1, car2);
}

//renders things and draws them into world
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawCamera(car1, camera1, 0);
    drawCamera(car2, camera2, canvas.width/2);

    ctx.fillStyle = "white";
    ctx.font = "25px Pixel Font";

    //Text to show how many laps a player has finished
    ctx.fillText(`P1 Lap: ${car1.lap}/${MAX_LAPS}`, 20, 30);
    ctx.fillText(`P2 Lap: ${car2.lap}/${MAX_LAPS}`, canvas.width - 200, 30);

    //Conditions to draw win/lose condition
    if (car1.lap == MAX_LAPS) { 
        ctx.fillText("PLAYER 1 WINS", canvas.width/4 - 120, 70);
        ctx.fillText("GOOD JOB!", canvas.width/4 - 60, 110);

        ctx.fillText("PLAYER 2 LOSES", canvas.width*3/4 - 120, 70);
        ctx.fillText("IT'S OK...", canvas.width*3/4 - 60, 110);
        gameOver = true;
    }
    else if (car2.lap == MAX_LAPS) {
        ctx.fillText("PLAYER 1 LOSES", canvas.width/4 - 120, 70);
        ctx.fillText("IT'S OK...", canvas.width/4 - 60, 110);

        ctx.fillText("PLAYER 2 WINS", canvas.width*3/4 - 120, 70);
        ctx.fillText("GOOD JOB!", canvas.width*3/4 - 60, 110);
        gameOver = true;
    };
}


//the game loop!
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();