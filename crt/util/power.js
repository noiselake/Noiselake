import { click } from "../sound/index.js";
import { boot } from "./screens.js";
import { stopSpeaking } from "./speak.js";
import pause from "./pause.js";

/** Turn on the terminal */
async function on() {
	click();
	await power();
	boot();
}

/** Turn off the terminal */
function off() {
	click();
	stopSpeaking();
	power(false);
}

async function power(on = true) {
	document.querySelector("#switch").checked = !on;
	await pause(0.1);

	document.getElementById("crt").classList.toggle("turn-off", !on);
	document.getElementById("crt").classList.toggle("off", !on);
	return;
}

export { power, on, off };
