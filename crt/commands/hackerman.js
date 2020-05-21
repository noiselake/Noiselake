import clear from "./clear.js";
import { type, scroll } from "../util/io.js";
import alert from "../util/alert.js";
import { typeSound } from "../sound/index.js";

const output = "ALL YOUR BASE ARE BELONG TO US";

async function hackerman() {
	// Fetch the source code of this file as text :D
	let response = await fetch("../terminal.js").then(res => res.text());

	return new Promise(resolve => {
		clear();

		// let first = true;
		let terminal = document.querySelector(".terminal");
		let typerDiv = document.createElement("div");

		const step = async event => {
			typeSound();
			event.preventDefault();
			if (event.keyCode === 67 && event.ctrlKey) {
				// Ctrl+C
				clear();
				resolve();
			} else if (event.keyCode === 13) {
				// Enter
				await alert("ACCESS GRANTED");
			} else {
				let text = response.slice(0, 5);
				response = response.slice(5);
				await type(
					text,
					{
						wait: 15,
						initialWait: 0,
						finalWait: 0,
						useContainer: true
					},
					typerDiv
				);
				scroll();
			}
		};

		typerDiv.setAttribute("contenteditable", true);
		typerDiv.addEventListener("keydown", step);
		terminal.appendChild(typerDiv);
		typerDiv.focus();
	});
}

export { output };

export default hackerman;
