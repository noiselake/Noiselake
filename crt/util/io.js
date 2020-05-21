import { typeSound } from "../sound/index.js";
import say from "./speak.js";
import pause from "./pause.js";

// history
let prev = getHistory();
let historyIndex = -1;
let tmp = "";

function getHistory() {
	let storage = localStorage.getItem("commandHistory");
	let prev;
	if (storage) {
		try {
			let json = JSON.parse(storage);
			prev = Array.isArray(json) ? json : [];
		} catch (e) {
			prev = [];
		}
	} else {
		prev = [];
	}
	return prev;
}

function addToHistory(cmd) {
	prev = [cmd, ...prev];
	historyIndex = -1;
	tmp = "";

	try {
		localStorage.setItem("commandHistory", JSON.stringify(prev));
	} catch (e) {}
}

/**
 * Convert a character that needs to be typed into something that can be shown on the screen.
 * Newlines becomes <br>
 * Tabs become three spaces.
 * Spaces become &nbsp;
 * */
function getChar(char) {
	let result;
	if (typeof char === "string") {
		if (char === "\n") {
			result = document.createElement("br");
		} else if (char === "\t") {
			let tab = document.createElement("span");
			tab.innerHTML = "&nbsp;&nbsp;&nbsp;";
			result = tab;
		} else if (char === " ") {
			let space = document.createElement("span");
			space.innerHTML = "&nbsp;";
			space.classList.add("char");
			result = space;
		} else {
			let span = document.createElement("span");
			span.classList.add("char");
			span.textContent = char;
			result = span;
		}
	}
	return result;
}

/** Types the given text on the screen */
async function type(
	text,
	{
		wait = 50,
		initialWait = 1000,
		finalWait = 500,
		useContainer = false
	} = {},
	container = document.querySelector(".terminal")
) {
	let typerDiv = useContainer ? container : document.createElement("div");
	typerDiv.classList.add("typer", "active");
	if (!useContainer) {
		container.appendChild(typerDiv);
	}

	if (initialWait) {
		await pause(initialWait / 1000);
	}

	if (Array.isArray(text)) {
		text = text.join("\n");
	}
	let queue = text.split("");

	say(text);

	while (queue.length) {
		let char = queue.shift();
		let element = getChar(char);
		if (element) {
			typerDiv.appendChild(element);
		}
		scroll(container);
		await pause(wait / 1000);
	}

	await pause(finalWait / 1000);
	typerDiv.classList.remove("active");
	return;
}

function isPrintable(keycode) {
	return (
		(keycode > 47 && keycode < 58) || // number keys
		keycode === 32 || // spacebar & return key(s) (if you want to allow carriage returns)
		(keycode > 64 && keycode < 91) || // letter keys
		(keycode > 95 && keycode < 112) || // numpad keys
		(keycode > 185 && keycode < 193) || // ;=,-./` (in order)
		(keycode > 218 && keycode < 223)
	);
}

function moveCaretToEnd(el) {
	var range, selection;
	if (document.createRange) {
		range = document.createRange(); //Create a range (a range is a like the selection but invisible)
		range.selectNodeContents(el); //Select the entire contents of the element with the range
		range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
		selection = window.getSelection(); //get the selection object (allows you to change selection)
		selection.removeAllRanges(); //remove any selections already made
		selection.addRange(range); //make the range you have just created the visible selection
	}
}

/** Shows an input field, returns a resolved promise with the typed text on <enter> */
async function input(pw) {
	return new Promise(resolve => {
		// This handles all user input
		const onKeyDown = event => {
			typeSound();
			// ENTER
			if (event.keyCode === 13) {
				event.preventDefault();
				event.target.setAttribute("contenteditable", false);
				let result = cleanInput(event.target.textContent);

				// history
				addToHistory(result);
				resolve(result);
			}
			// UP
			else if (event.keyCode === 38) {
				if (historyIndex === -1) tmp = event.target.textContent;
				historyIndex = Math.min(prev.length - 1, historyIndex + 1);
				let text = prev[historyIndex];
				event.target.textContent = text;
			}
			// DOWN
			else if (event.keyCode === 40) {
				historyIndex = Math.max(-1, historyIndex - 1);
				let text = prev[historyIndex] || tmp;
				event.target.textContent = text;
			}
			// BACKSPACE
			else if (event.keyCode === 8) {
				// Prevent inserting a <br> when removing the last character
				if (event.target.textContent.length === 1) {
					event.preventDefault();
					event.target.innerHTML = "";
				}
			}
			// Check if character can be shown as output (skip if CTRL is pressed)
			else if (isPrintable(event.keyCode) && !event.ctrlKey) {
				event.preventDefault();
				// Wrap the character in a span
				let span = document.createElement("span");

				let keyCode = event.keyCode;
				let chrCode = keyCode - 48 * Math.floor(keyCode / 48);
				let chr = String.fromCharCode(
					96 <= keyCode ? chrCode : keyCode
				);
				// Add span to the input
				span.classList.add("char");
				span.textContent = chr;
				event.target.appendChild(span);

				// For password field, fill the data-pw attr with asterisks
				// which will be shown using CSS
				if (pw) {
					let length = event.target.textContent.length;
					event.target.setAttribute(
						"data-pw",
						Array(length)
							.fill("*")
							.join("")
					);
				}
				moveCaretToEnd(event.target);
			}
		};

		// Add input to terminal
		let terminal = document.querySelector(".terminal");
		let input = document.createElement("span");
		input.setAttribute("id", "input");
		if (pw) {
			input.classList.add("password");
		}
		input.setAttribute("contenteditable", true);
		input.addEventListener("keydown", onKeyDown);
		terminal.appendChild(input);
		input.focus();
	});
}

// Processes the user input and executes a command
async function parse(input) {
	input = cleanInput(input);

	if (!input) {
		return;
	}
	// Only allow words, separated by space
	let matches = String(input).match(/^(\w+)(?:\s((?:\w+(?:\s\w+)*)))?$/);

	if (!matches) {
		throw new Error("Invalid command");
	}
	let command = matches[1];
	let args = matches[2];

	let naughty = ["fuck", "shit", "die", "ass", "cunt"];
	if (naughty.some(word => command.includes(word))) {
		throw new Error("Please don't use that language");
	}

	let module;

	// Try to import the command function
	try {
		module = await import(`../commands/${command}.js`);
	} catch (e) {
		console.error(e);
		// Kinda abusing TypeError to check if the import failed
		if (e instanceof TypeError) {
			return await type("Unknown command");
		}
		// E.g. syntax error while executing the command
		else {
			return await type("Error while executing command");
		}
	}

	// Try to import and parse any HTML templates that the command module exports
	if (module && module.template) {
		let path = `../templates/${module.template}.html`;

		let txt = await fetch(path).then(res => res.text());
		let html = new DOMParser().parseFromString(txt, "text/html");
		let templates = html.querySelectorAll("template");

		templates.forEach(template => {
			document.head.appendChild(template);
		});
	}

	// Show any output if the command exports any
	if (module && module.output) {
		await type(module.output);
	}

	await pause();

	// Execute the command (default export)
	if (module.default) {
		await module.default(args);
	}
	return;
}

function cleanInput(input) {
	return input.toLowerCase().trim();
}

function scroll(el = document.querySelector(".terminal")) {
	el.scrollTop = el.scrollHeight;
}

/** Types the given text and asks input */
async function prompt(text, pw = false) {
	await type(text);
	return input(pw);
}

export { prompt, input, cleanInput, type, parse, scroll };
