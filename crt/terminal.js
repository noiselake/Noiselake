import { setVolume } from "./util/speak.js";
import { click } from "./sound/index.js";
import { on, off } from "./util/power.js";
import { toggleFullscreen } from "./util/screens.js";

function togglePower(checked) {
	if (checked) {
		on();
	} else {
		off();
	}
}

function toggleSlider(checked) {
	togglePower(checked);
	document.querySelector("#slider").classList.toggle("on", checked);
}

function handleClick(event) {
	if (event) {
		event.preventDefault();
	}
	let input = document.querySelector("[contenteditable='true']");
	if (input) {
		input.focus();
	}
}

function fly(event) {
	event.target.classList.toggle("fly");
}

function theme(event) {
	click();
	let theme = event.target.dataset.theme;
	[...document.getElementsByClassName("theme")].forEach(b =>
		b.classList.toggle("active", false)
	);
	event.target.classList.add("active");
	document.body.classList = "theme-" + theme;
	handleClick();
}

function fullscreen(event) {
	toggleFullscreen();
	event.target.blur();
}

function globalListener({ keyCode }) {
	if (keyCode === 122) {
		// F11
		toggleFullscreen();
	} else if (keyCode === 27) {
		// ESC
		toggleFullscreen(false);
	}
}
document.addEventListener("keydown", globalListener);
document.getElementById("dial").addEventListener("input", event => {
	let value = event.target.value;
	setVolume(value);
});

async function debug() {
	const { power } = await import("./util/power.js");
	const { main } = await import("./util/screens.js");
	power();
	main();
}

// Define some stuff on the window so we can use it directly from the HTML
Object.assign(window, {
	debug,
	togglePower,
	toggleSlider,
	theme,
	fly,
	handleClick,
	fullscreen
});
