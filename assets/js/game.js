// Obtiene el ancho y alto de la ventana
let w = window.innerWidth,
    h = window.innerHeight;

// Crea el juego con Phaser
let game = new Phaser.Game(w, h, Phaser.AUTO, 'game',
    { preload: preload, create: create, update: update, render: render });

// Selecciona elementos del DOM para la música y la cuenta regresiva
let music = document.querySelector("#music");
let countdown = document.querySelector("#countdown-number");
let countdownOverlay = document.querySelector("#countdown-overlay");

// Selecciona el elemento del DOM para el sonido de corte y ajusta su volumen
let cutSoundElement = document.querySelector("#cut");
cutSoundElement.volume = 0.3;

function preload() {
    // Iniciar la música
    music.volume = 0.3;
    music.play();

    // Iniciar el contador de inicio
    let count = 3;
    let interval = setInterval(() => {
        countdown.innerHTML = count;
        count--;
        if (count < 0) {
            clearInterval(interval);
            countdown.style.display = "none";
            countdownOverlay.style.display = "none";
        }
    }, 1000);
    
    // Carga la imagen de las frutas
    let fruitsBMD = game.add.bitmapData(100, 100); // Crear un bitmap de 100x100
    let fruits_image = new Image(); // Crear una imagen
    fruits_image.src = '../../assets/images/circle0.png'; // Cargar la imagen
    fruitsBMD.ctx.arc(50, 50, 50, 0, Math.PI * 2); // Dibujar un círculo
    fruits_image.onload = function () { // Cuando la imagen se cargue
        fruitsBMD.ctx.drawImage(fruits_image, 0, 0, 100, 100); // Dibujar la imagen
    };
    game.cache.addBitmapData('fruit', fruitsBMD); // Guardar el bitmap en la caché

    // Carga la imagen de la bomba
    let bombsBMD = game.add.bitmapData(100, 100); // Lo mismo que antes
    let bombs_image = new Image();
    bombs_image.src = '../../assets/images/bomb.png';
    bombsBMD.ctx.arc(50, 50, 50, 0, Math.PI * 2);
    bombs_image.onload = function () {
        bombsBMD.ctx.drawImage(bombs_image, 0, 0, 100, 100);
    };
    game.cache.addBitmapData('bomb', bombsBMD);

    // Carga la imagen de las partículas
    let partsBMD = game.add.bitmapData(64, 64); // Lo mismo que antes
    let parts_image = new Image();
    parts_image.src = '../../assets/images/part.png'; // Cargar la imagen
    partsBMD.ctx.arc(50, 50, 50, 0, Math.PI * 2);
    parts_image.onload = function () {
        partsBMD.ctx.drawImage(parts_image, 0, 0, 100, 100);
    };
    game.cache.addBitmapData('parts', partsBMD);

    // Carga la imagen del fondo
    this.load.image('background', "../../assets/images/bg.jpeg"); // Cargar la imagen del fondo
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
    // Agrega el fondo al juego
    game.add.sprite(0, 0, 'background');

    // Configura un retraso de 3 segundos antes de iniciar la lógica del juego
    setTimeout(function () {
        // Inicia el sistema de físicas de Phaser con gravedad
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 400; // Establece la gravedad

        // Crea grupos de frutas y bombas usando una función personalizada
        fruit_objects = createGroup(4, game.cache.getBitmapData('fruit'));
         bomb_objects = createGroup(4, game.cache.getBitmapData('bomb'));

        // Prepara los gráficos para la "katana" (trazos de corte)
        slashes = game.add.graphics(0, 0);

        // Crea y configura la etiqueta de puntuación
    	scoreLabel = game.add.text(10, 10, '');
        scoreLabel.fill = 'white';

        // Configura el emisor de partículas para simular el corte de frutas
        emitter = game.add.emitter(0, 0, 300);
        emitter.makeParticles(game.cache.getBitmapData('parts')); // Usa partículas personalizadas
        emitter.lifespan = 100; // Tiempo de vida de las partículas
        emitter.minParticleSpeed.setTo(-300, -300); // Velocidad mínima de partículas
        emitter.maxParticleSpeed.setTo(300, 300); // Velocidad máxima de partículas
        emitter.minParticleScale = 0.5; // Escala mínima de partículas
        emitter.maxParticleScale = 0.8; // Escala máxima de partículas
        emitter.setAlpha(0.8, 0.9); // Transparencia de las partículas
        emitter.gravity = 300; // Gravedad de las partículas
        emitter.setYSpeed(-400, 400); // Velocidad vertical de las partículas

        // Inicia la lógica para lanzar objetos en el juego
        throwObject();
    }, 3000); // Retraso de 3 segundos
}

function createGroup(numItems, sprite) {
	var group = game.add.group(); // Crea un grupo de objetos
	group.enableBody = true; // Habilita el cuerpo de los objetos
	group.physicsBodyType = Phaser.Physics.ARCADE; // Establece el tipo de físicas
	group.createMultiple(numItems, sprite); // Crea múltiples objetos
	group.setAll('checkWorldBounds', true);
	group.setAll('outOfBoundsKill', true);
	return group; // Devuelve el grupo de objetos
}

function throwObject() {
	if (game.time.now > nextFire && fruit_objects.countDead() > 0 && bomb_objects.countDead() > 0) { // Si es hora de lanzar un objeto
		nextFire = game.time.now + fireRate; // Establece el tiempo del próximo lanzamiento
		tirarFruta(); // Lanza una fruta
		if (Math.random() > .5) { // Si el número aleatorio es mayor a 0.5, lanza una bomba
			tirarBomba();
		}
	}
}

function tirarFruta() {
	var obj = fruit_objects.getFirstDead(); // Obtiene el primer objeto eliminado, ya sea que se corto o salió de la pantalla
	obj.reset(game.world.centerX + Math.random() * 100 - Math.random() * 100, h); // Restablece la posición del objeto
	obj.anchor.setTo(0.5, 0.5); // Establece el punto de anclaje del objeto
	obj.body.angularAcceleration = 300; // Establece la aceleración angular del objeto
	game.physics.arcade.moveToXY(obj, game.world.centerX, game.world.centerY, h - 300); // Mueve el objeto hacia el centro de la pantalla
}

function tirarBomba() {
	var obj = bomb_objects.getFirstDead(); // Obtiene el primer objeto eliminado, ya sea que se corto o salió de la pantalla
	obj.reset(game.world.centerX + Math.random() * 100 - Math.random() * 100, h); // Restablece la posición del objeto
	obj.anchor.setTo(0.5, 0.5); // Establece el punto de anclaje del objeto
	obj.body.angularAcceleration = 100; // Establece la aceleración angular del objeto
	game.physics.arcade.moveToXY(obj, game.world.centerX, game.world.centerY, h - 300); // Mueve el objeto hacia el centro de la pantalla
}

function update() {
	setTimeout(() => {
		// Si el juego está pausado, no se actualiza
		if (game.paused) return

		// Lanza la primer fruta
		throwObject();

		// Posición del mouse
		points.push({
			x: game.input.x,
			y: game.input.y
		});
		points = points.splice(points.length - 10, points.length); // Limita la cantidad de hitbox
		//game.add.sprite(game.input.x, game.input.y, 'hit');

		// Dibuja la línea de corte, si no hay velocidad en x, no dibuja
		if (points.length < 1 || points[0].x == 0) {
			return;
		}

		// Dibuja la línea de corte
		slashes.clear(); // Limpia los trazos anteriores
		slashes.beginFill(0xFFFFFF); // Establece el color de los trazos
		slashes.alpha = .5; // Establece la transparencia de los trazos
		slashes.moveTo(points[0].x, points[0].y); // Mueve el trazo al primer punto
		for (var i = 1; i < points.length; i++) {
			slashes.lineTo(points[i].x, points[i].y); // Dibuja una línea al siguiente punto
		}
		slashes.endFill(); // Finaliza el trazo

		// Verifica si la línea de corte intersecta con algún objeto
		for (var i = 1; i < points.length; i++) {
			line = new Phaser.Line(points[i].x, points[i].y, points[i - 1].x, points[i - 1].y);
			game.debug.geom(line);

			fruit_objects.forEachExists(checkIntersects); // Verifica si la línea intersecta con una fruta
			bomb_objects.forEachExists(checkIntersects); // Verifica si la línea intersecta con una bomba
		}
	}, 3000)
}

var contactPoint = new Phaser.Point(0, 0);


function checkIntersects(fruit, callback) {
	// Verifica si la línea de corte intersecta con el objeto
	var l1 = new Phaser.Line(fruit.body.right - fruit.width, fruit.body.bottom - fruit.height, fruit.body.right, fruit.body.bottom);
	var l2 = new Phaser.Line(fruit.body.right - fruit.width, fruit.body.bottom, fruit.body.right, fruit.body.bottom - fruit.height);
	l2.angle = 90;

	// Si la línea de corte intersecta con el objeto, lo detecta
	if (Phaser.Line.intersects(line, l1, true) ||
		Phaser.Line.intersects(line, l2, true)) {

		// Verifica si la línea de corte intersecta con el objeto
		contactPoint.x = game.input.x;
		contactPoint.y = game.input.y;
		var distance = Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y));
		if (Phaser.Point.distance(contactPoint, new Phaser.Point(fruit.x, fruit.y)) > 110) { // Si se pasa de la hitbox
			return;
		}

		// Si la fruta está en el grupo de frutas, se corta
		if (fruit.parent == fruit_objects) {
			cutSoundElement.play() // Reproduce el sonido de corte
			killFruit(fruit); // Elimina la fruta
		} else {
			resetScore(); // Si la fruta es una bomba, se reinicia el juego
		}
	}

}

function setGamePaused(paused) {
	game.paused = paused; // Pausa el juego
}

function resetScore() {
	game.paused = true; // Pausa el juego

	document.querySelector("#game-over").style.display = "block"; // Muestra el mensaje de game over
	document.querySelector("#score").innerHTML = score; // Muestra el puntaje

	fruit_objects.forEachExists(killFruit); // Elimina todas las frutas
	bomb_objects.forEachExists(killFruit); // Elimina todas las bombas

	music.volume = 0.1 // Reduce el volumen de la música
}

function render() {
}

function reload() {
	window.location.reload(); // Recarga la página
}

function killFruit(fruit) {
	// Genera las partículas
	emitter.x = fruit.x;
	emitter.y = fruit.y;
	emitter.start(true, 2000, null, 4);

	// Elimina la fruta
	fruit.kill();
	points = [];
	score++; // Aumenta el puntaje
	scoreLabel.text = 'Puntaje: ' + score; // Muestra el puntaje
}


// Pausar el juego con la tecla "Escape"
document.querySelector("body").addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		setGamePaused(!game.paused);
	}

	// Muestra u oculta el overlay de pausa
	document.querySelector("#pause-overlay").style.display = game.paused ? "block" : "none";
})