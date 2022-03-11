const RESULTS_TEMPLATE = new Image();
RESULTS_TEMPLATE.setAttribute('crossOrigin', 'anonymous');
// RESULTS_TEMPLATE.src = "https://drive.google.com/file/d/1qdgcTFSSHKNuKiVIJwsjCUJTQyB_9O-6/preview";
// RESULTS_TEMPLATE.src = "../images/The Christopherdle!-3.png"
RESULTS_TEMPLATE.src = "https://static.wixstatic.com/media/f978aa_c24b902f2ac348fbb0d852e71c3f4575~mv2.png/v1/fill/w_1080,h_1919,al_c,enc_auto/The%20Christopherdle!-3.png"

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
let prevStates = new Array();

const DAY_INDEX = 3;//(new Date).getDate() - 14;

const KEYS = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"];

const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

$(main);

function main() {
  target = getTarget();
  loadLetters();
  $(document.body).keydown(handleInput);
  loadKeyboard();
  setSyncScheduler(updateClock, 1000, $('#time'));
  loadButton();
}

function loadButton(){
  let text = "Download";
  if (IS_MOBILE) {
    text = "Share";
  }
  $(".button").text(text);
}

function getTarget() {
  // return TARGETS[Math.floor(Math.random()*TARGETS.length)].split("");
  return TARGETS[DAY_INDEX];
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
  prevStates.push(states);
  renderColors(states);
  renderKeyboard();
  currentGuess = new Array();
  gridRow++;
  let gameOver = isGameOver(states);
  if (gameOver != 0) {
    $(document.body).off("keydown");
    $(".key").off("click");
    let tries = gameOver === 1 ? gridRow : "X";
    makeResults(tries, getColorSquares());
    showResults();
  }
}

function makeResults(tries, colorSquares) {
  const canvas = $("canvas").get(0);
  const ctx = canvas.getContext('2d');

  const vh = window.innerHeight / 100;
  const base = 3;
  const w = base * 9 * vh;
  const h = base * 16 * vh;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(RESULTS_TEMPLATE, 0, 0, w, h);
  ctx.textAlign = "center";
  ctx.font = "3vh serif";
  const lineheight = ctx.font.match(/\d+/).join('') * 1.4;
  for (let i = 0; i < colorSquares.length; i++) {
    ctx.fillText(colorSquares[i], w/2, h/4 + (i * lineheight));
  }
  ctx.font = "bold 3vh 'playfair display'"
  ctx.fillText(`#${DAY_INDEX+1}`, w - 4 * vh, 6.15 * vh);

  let winText = "You won! Now show the world how smart you are (and who you're voting for). Don't forget to tag @chrisandava2022";
  let lossText = "Better luck next time. Share your results (and who you're voting for). Don't forget to tag @chrisandava2022"
  $("#results > p").text(`${tries}/6 ${tries != "X" ? winText : lossText}`);
  addButtonDownload(canvas);
}

function addButtonDownload(canvas) {
  $(".button").on("click", x => {
    let anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "result.png";
    anchor.click();
    anchor.remove();
    if (IS_MOBILE) {
      let anchor = document.createElement("a");
      anchor.href = "instagram://story-camera";
      anchor.click();
      anchor.remove();
    }
  })
}

function showResults(){
  $("#result").removeClass("hide");
}

function getColorSquares() {
  return prevStates
  .map(states => states
    .map(state => state === "correct" ? "\uD83D\uDFE9" : state === "misplaced" ? "\uD83D\uDFE8" : "\u2B1B")
    .join(""))
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

function isGameOver(states) {
  if (states.every(x => x === "correct")) {
    console.log("YOU WON");
    return 1;
  } else if (gridRow >= 6) {
    console.log("YOU LOST");
    return -1;
  }
  return 0;
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

function updateClock(clockElement) {
  let timeString = getTimeString(new Date());
  clockElement.text(timeString);
}

function getTimeString(date) {
  let sec = twoDigit(59 - date.getSeconds());
  let min = twoDigit(59 - date.getMinutes()); 
  let hour = twoDigit(23 - date.getHours());
  return `${hour}:${min}:${sec}`;
}

function twoDigit(n){
  return (new String(n)).length === 2 ? n : "0" + n;
}

function setSyncScheduler(func, interval, ...args) {
  let now = (new Date()).getTime();
  let delay = interval - now % interval;
  func(...args);
  setInterval(func, delay, ...args);
}
