let button = new Audio("./sound/button.mp3");
let keys = [
	new Audio("./sound/key1.mp3"),
	new Audio("./sound/key2.mp3"),
	new Audio("./sound/key3.mp3"),
	new Audio("./sound/key4.mp3")
];

function click() {
	button.play();
}

function typeSound() {
	let i = Math.floor(Math.random() * keys.length);
	keys[i].currentTime = 0;
	keys[i].play();
}

export { click, typeSound };
