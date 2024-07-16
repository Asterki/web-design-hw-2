var w = window.innerWidth,
	h = window.innerHeight;

var game = new Phaser.Game(w, h, Phaser.AUTO, 'game',
	{ preload: preload, create: create, update: update, render: render });

function preload() {
	// Carga la imagen de las frutas
	let fruitsBMD = game.add.bitmapData(100, 100); // Crear un bitmap de 100x100
	var fruits_image = new Image(); // Crear una imagen
	
	fruits_image.src = '/assets/images/circle0.png'; // Cargar la imagen
	fruitsBMD.ctx.arc(50, 50, 50, 0, Math.PI * 2); // Dibujar un círculo
	fruits_image.onload = function () { // Cuando la imagen se cargue
		fruitsBMD.ctx.drawImage(fruits_image, 0, 0, 100, 100); // Dibujar la imagen
	}
	game.cache.addBitmapData('fruit', fruitsBMD); // Guardar el bitmap en la caché


	// Carga la imagen de la bomba
	let bombsBMD = game.add.bitmapData(100, 100); // Lo mismo que antes
	var bombs_image = new Image();
	
	bombs_image.src = '/assets/images/bomb.png';
	bombsBMD.ctx.arc(50, 50, 50, 0, Math.PI * 2);
	bombs_image.onload = function () {
		bombsBMD.ctx.drawImage(bombs_image, 0, 0, 100, 100);
	}
	game.cache.addBitmapData('bomb', bombsBMD);

	// Carga la imagen de las partículas
	let partsBMD = game.add.bitmapData(64, 64); // Lo mismo que antes
	partsBMD.ctx.fillStyle = '#ff0000'; // Color rojo para las bombas
	partsBMD.ctx.arc(32, 32, 32, 0, Math.PI * 2); // Dibuja un círculo
	partsBMD.ctx.fill();
	game.cache.addBitmapData('parts', partsBMD);

	// Carga la imagen del fondo
	this.load.image('background', "/assets/images/bg.jpeg") // Cargar la imagen del fondo
}

// Variables
var fruit_objects,
	bomb_objects,
	slashes,
	line,
	scoreLabel,
	score = 0,
	points = [];

// Dificultad
var fireRate = 1000;
var nextFire = 0;


function create() {
	game.add.sprite(0, 0, 'background'); // Agregar el fondo

	setTimeout(function () { // Esperar 2 segundos para que carguen los objetos
		game.physics.startSystem(Phaser.Physics.ARCADE); // Iniciar el sistema de físicas
		game.physics.arcade.gravity.y = 400;
	
		// Crear los grupos de frutas y bombas
		fruit_objects = createGroup(4, game.cache.getBitmapData('fruit'));
		bomb_objects = createGroup(4, game.cache.getBitmapData('bomb'));
	
		// Crear la katana
		slashes = game.add.graphics(0, 0);
	
		// Crear el texto de la puntuación
		scoreLabel = game.add.text(10, 10, '');
		scoreLabel.fill = 'white';
	
		// Crear el emisor de partículas para cuando se corta una fruta
		emitter = game.add.emitter(0, 0, 300);
		emitter.makeParticles(game.cache.getBitmapData('parts'));
		emitter.lifespan = 100
		emitter.minParticleSpeed.setTo(-300, -300);
		emitter.maxParticleSpeed.setTo(300, 300);
		emitter.minParticleScale = 0.1;
		emitter.maxParticleScale = 0.5;
		// Set the colour of the particles
		emitter.setAlpha(0.3, 0.8);
		// Set the gravity for the particles
		emitter.gravity = 300;
		emitter.setYSpeed(-400, 400);
	
		// Iniciar el juego
		throwObject();
	}, 2000);

}

function createGroup(numItems, sprite) {
	var group = game.add.group();
	group.enableBody = true;
	group.physicsBodyType = Phaser.Physics.ARCADE;
	group.createMultiple(numItems, sprite);
	group.setAll('checkWorldBounds', true);
	group.setAll('outOfBoundsKill', true);
	return group;
}

function throwObject() {
	if (game.time.now > nextFire && fruit_objects.countDead() > 0 && bomb_objects.countDead() > 0) {
		nextFire = game.time.now + fireRate;
		tirarFruta();
		if (Math.random() > .5) {
			tirarBomba();
		}
	}
}

function tirarFruta() {
	var obj = fruit_objects.getFirstDead();
	obj.reset(game.world.centerX + Math.random() * 100 - Math.random() * 100, h);
	obj.anchor.setTo(0.5, 0.5);
	obj.body.angularAcceleration = 300;
	game.physics.arcade.moveToXY(obj, game.world.centerX, game.world.centerY, h-300);
}

function tirarBomba() {
	var obj = bomb_objects.getFirstDead();
	obj.reset(game.world.centerX + Math.random() * 100 - Math.random() * 100, h);
	obj.anchor.setTo(0.5, 0.5);
	obj.body.angularAcceleration = 100;
	game.physics.arcade.moveToXY(obj, game.world.centerX, game.world.centerY, h-300);
}

function update() {
	setTimeout(() => {
		if (game.paused) return
		throwObject();

	points.push({
		x: game.input.x,
		y: game.input.y
	});
	points = points.splice(points.length - 10, points.length);
	//game.add.sprite(game.input.x, game.input.y, 'hit');

	if (points.length < 1 || points[0].x == 0) {
		return;
	}

	slashes.clear();
	slashes.beginFill(0xFFFFFF);
	slashes.alpha = .5;
	slashes.moveTo(points[0].x, points[0].y);
	for (var i = 1; i < points.length; i++) {
		slashes.lineTo(points[i].x, points[i].y);
	}
	slashes.endFill();

	for (var i = 1; i < points.length; i++) {
		line = new Phaser.Line(points[i].x, points[i].y, points[i - 1].x, points[i - 1].y);
		game.debug.geom(line);

		fruit_objects.forEachExists(checkIntersects);
		bomb_objects.forEachExists(checkIntersects);
	}
	}, 3000)
}

var contactPoint = new Phaser.Point(0, 0);

function checkIntersects(fruit, callback) {
	var l1 = new Phaser.Line(fruit.body.right - fruit.width, fruit.body.bottom - fruit.height, fruit.body.right, fruit.body.bottom);
	var l2 = new Phaser.Line(fruit.body.right - fruit.width, fruit.body.bottom, fruit.body.right, fruit.body.bottom - fruit.height);
	l2.angle = 90;

	if (Phaser.Line.intersects(line, l1, true) ||
		Phaser.Line.intersects(line, l2, true)) {

		contactPoint.x = game.input.x;
		contactPoint.y = game.input.y;
		var distance = Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y));
		if (Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y)) > 110) {
			return;
		}

		if (fruit.parent == fruit_objects) {
			killFruit(fruit);
		} else {
		game.physics.arcade.gravity.y = 100000;
			resetScore();
		}
	}

}

function setGamePaused(paused) {
	game.paused = paused;
}

function resetScore() {
	var highscore = Math.max(score, localStorage.getItem("highscore"));
	localStorage.setItem("highscore", highscore);

	fruit_objects.forEachExists(killFruit);
	bomb_objects.forEachExists(killFruit);

	score = 0;
	scoreLabel.text = '\nFinal Score: ' + highscore;
	// Retrieve

	setTimeout(() => {
		window.location.reload();
	}, 2000);
}

function render() {
}

function killFruit(fruit) {

	emitter.x = fruit.x;
	emitter.y = fruit.y;
	emitter.start(true, 2000, null, 4);
	fruit.kill();
	points = [];
	score++;
	scoreLabel.text = 'Score: ' + score;
}


// When the esc key is pressed, pause the game (use DOM)
document.querySelector("body").addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		setGamePaused(!game.paused);
	}
})