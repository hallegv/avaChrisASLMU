let squares = 5 * 6;
let target;

let correctLetters = new Set();
let misplacedLetters = new Set();
let wrongLetters = new Set();

let enterCode = 13;
let backspaceCode = 8;
let gridRow = 0;
let currentGuess = new Array();
let colorsGuess = new Array();

const KEYS = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"];

$(main);

function main() {
  target = getTarget();
  loadLetters();
  $(document.body).keydown(handleInput);
  loadKeyboard();
}

function getTarget() {
  return TARGETS[Math.floor(Math.random()*TARGETS.length)].split("");
}

function loadLetters() {
  for (let i = 0; i < squares; i++) {
    $("#letters").append('<div class="letter"><p></p></div>');
  }
}

function loadKeyboard() {
  for (let row of KEYS) {
    let rowDiv = $('<div class ="kRow"></div>');
    for (let letter of row) {
      let handler = (x) => handleLetter(letter);
      let id = letter;
      if (letter === "+") {
        handler = handleEnter;
        letter = "ENTER";
        id = "ENTER";
      } else if (letter === "-") {
        handler = handleBackspace;
        letter = "\u232b";
        id = "DELETE";
      }
      let keyDiv = $(
        `<div class ="key" id="${id}"><p>${letter.toUpperCase()}</p></div>`
      );
      keyDiv.on("click", handler);
      rowDiv.append(keyDiv);
    }
    $("#keyboard").append(rowDiv);
  }
}

function handleInput(e) {
  if (e.keyCode === enterCode) {
    handleEnter();
  } else if (e.keyCode === backspaceCode) {
    handleBackspace();
  } else if (e.keyCode >= 65 && e.keyCode <= 90) {
    handleLetter(e.key.toLowerCase());
  }
}

function handleEnter() {
  if (currentGuess.length < 5) {
    console.log("MISSING LETTERS");
    return;
  }
  if (!OPTIONS.has(currentGuess.join(''))){
    console.log("NOT IN WORD LIST MESSAGE");
    return;
  }
  renderGuess();
  const states = checkGuess();
  renderColors(states);
  renderKeyboard();
  currentGuess = new Array();
  gridRow++;
  if (isEndGame(states)) {
    $(document.body).off("keydown");
    $(".key").off("click");
  }
}

function checkGuess() {
  if (currentGuess === target) {
    return new Array(5).fill("correct");
  }

  let targetCopy = [...target];
  let currentGuessCopy = [...currentGuess];
  let states = new Array(target.length);

  for (let i = 0; i < states.length; i++) {
    if (currentGuess[i] === targetCopy[i]) {
      states[i] = "correct";
      targetCopy[i] = undefined;
      currentGuess[i] = undefined;
      correctLetters.add(currentGuessCopy[i]);
      misplacedLetters.delete(currentGuessCopy[i]);
    }
  }

  for (let i = 0; i < states.length; i++) {
    if (currentGuess[i] != undefined && targetCopy.includes(currentGuess[i])) {
      states[i] = "misplaced";
      targetCopy[targetCopy.indexOf(currentGuess[i])] = undefined;
      currentGuess[i] = undefined;
      if (!correctLetters.has(currentGuessCopy[i])) {
        misplacedLetters.add(currentGuessCopy[i]);
      }
    }
  }

  for (let i = 0; i < states.length; i++) {
    if (states[i] === undefined) {
      states[i] = "wrong";
      if (
        !correctLetters.has(currentGuessCopy[i]) &&
        !misplacedLetters.has(currentGuessCopy[i])
      ) {
        wrongLetters.add(currentGuessCopy[i]);
      }
    }
  }
  return states;
}

function renderColors(states) {
  let start = gridRow * 5 + 1;
  for (let i = 0; i < states.length; i++) {
    $(`.letter:nth-child(${i + start})`).addClass(states[i]);
  }
}

function isEndGame(states) {
  if (states.every(x => x === "correct")) {
    console.log("YOU WON");
    return true;
  } else if (gridRow >= 6) {
    console.log("YOU LOST");
    return true;
  }
  return false;
}

function handleBackspace() {
  currentGuess.pop();
  renderGuess();
}

function handleLetter(letter) {
  if (currentGuess.length >= 5) {
    return;
  }
  currentGuess.push(letter);
  renderGuess();
}

function renderGuess() {
  let start = gridRow * 5 + 1;
  for (let i = 0; i < currentGuess.length; i++) {
    $(`.letter:nth-child(${i + start}) > p`).text(
      currentGuess[i].toUpperCase()
    );
  }
  for (let i = currentGuess.length; i < 5; i++) {
    $(`.letter:nth-child(${i + start}) > p`).empty();
  }
}

function renderKeyboard() {
  for (let l of correctLetters) {
    $(`#${l}`).addClass("correct");
  }
  for (let l of misplacedLetters) {
    $(`#${l}`).addClass("misplaced");
  }
  for (let l of wrongLetters) {
    $(`#${l}`).addClass("wrong");
  }
}
