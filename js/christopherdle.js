const RESULTS_TEMPLATE = new Image();
RESULTS_TEMPLATE.setAttribute('crossOrigin', 'anonymous');
RESULTS_TEMPLATE.src = "https://static.wixstatic.com/media/f978aa_4441548ac49c4e43a629ed09a12d6a02~mv2.png/v1/fill/w_1200,h_2132,al_c,usm_0.66_1.00_0.01,enc_auto/The%20Christopherdle!-4.png"

let squares = 5 * 6;

let correctLetters = new Set();
let misplacedLetters = new Set();
let wrongLetters = new Set();

let enterCode = 13;
let backspaceCode = 8;
let gridRow = 0;
let currentGuess = new Array();
let prevGuesses = new Array();
let colorsGuess = new Array();
let prevStates = new Array();

const DAY_INDEX = (new Date).getDate() - 13;

const KEYS = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"];

const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const TARGET = getTarget();

$(main);

function main() {
  $("#modal-alert").hide().removeClass("hide");
  $('#result').hide().removeClass("hide");
  loadLetters();
  $(document.body).keydown(handleInput);
  loadKeyboard();
  setSyncScheduler(updateClock, 1000, $('#time'));
  loadButton();
  let cookies = getCookies();
  if ("date" in cookies && 
  "guesses" in cookies && 
  parseInt(cookies.date) === (new Date()).getDate()) {
    loadGame(JSON.parse(cookies.guesses));
  }
  $("#close").on("click", hideResults);
  $("#share").on("click", showResults);
  setLogoHeight()
}

function setLogoHeight() {
  $("#mainLogo").height($("#mainLogo").height());
  $("#christopherdleLogo").height($("#christopherdleLogo").height());
  $(".navbar").css("height", "auto");
}

function loadGame(guesses) {
  for (let guess of guesses) {
    currentGuess = guess;
    handleEnter();
  }
}

function getCookies() {
  let cookies = new Object();
  document.cookie.split(";").map(x => {
    cookie = x.split("=");
    cookies[cookie[0].trim()] = cookie[1].trim();
  });
  return cookies;
}

function loadButton(){
  let text = "Download";
  if (IS_MOBILE) {
    text = "SHARE";
    $("#insta").removeClass("hide");
  }
  $(".button > p").text(text);
}

function getTarget() {
  return TARGETS[DAY_INDEX].split("");
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
    modalAlert("MISSING LETTERS")
    return;
  }
  if (!OPTIONS.has(currentGuess.join(''))){
    modalAlert("NOT IN WORD LIST");
    return;
  }
  prevGuesses.push(currentGuess);
  saveGameToCookies();
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
    let colorSquares = getColorSquares();
    $("#share").removeClass("hide");
    makeResults(tries, colorSquares);
  }
}

function modalAlert(text) {
  let fadeInTime = 300;
  let fadeOutTime = 500;
  $("#modal-alert > p").text(text)
  let modalDiv = $("#modal-alert");
  modalDiv.fadeIn(fadeInTime).show();
  setTimeout(x => {
    modalDiv.fadeOut(fadeOutTime);
    setTimeout(x => {modalDiv.hide()}, fadeOutTime);
  }
  , 2000 - (fadeInTime + fadeOutTime));
}

function saveGameToCookies(){
  document.cookie = `date=${(new Date).getDate()}`;
  document.cookie = `guesses=${JSON.stringify(prevGuesses)}`;
}

function makeResults(tries, colorSquares) {
  const canvas = $("canvas").get(0);
  const ctx = canvas.getContext('2d');

  const vh = window.innerHeight / 100;
  const base = 2.5;
  const w = base * 9 * vh;
  const h = base * 16 * vh;
  canvas.width = w;
  canvas.height = h;

  while (!RESULTS_TEMPLATE.complete){}

  ctx.drawImage(RESULTS_TEMPLATE, 0, 0, w, h);
  ctx.textAlign = "center";
  ctx.font = "2.4vh serif";
  const lineheight = ctx.font.match(/\d+/).join('') * 1.4;
  for (let i = 0; i < colorSquares.length; i++) {
    ctx.fillText(colorSquares[i], w/2, h/4 + (i * lineheight));
  }
  ctx.font = "bold 3vh 'playfair display'"
  ctx.fillText(`#${DAY_INDEX}`, w - 3 * vh, 5.2 * vh);

  let winText = "You won! Now show the world how smart you are (and who you're voting for). Don't forget to tag @chrisandava2022!";
  let lossText = `Better luck next time. The word was ${TARGET.join('').toUpperCase()}. Share your results (and who you're voting for). Don't forget to tag @chrisandava2022!`;
  $("#results > p").text(`${tries}/6 ${tries != "X" ? winText : lossText}`);
  addButtonDownload(colorSquares);
  setTimeout(showResults, 1000);
}

function addButtonDownload(colorSquares) {
  $(".button").on("click", x => {
    if (IS_MOBILE) {
      shareCanvas(colorSquares);
    } else {
      let anchor = document.createElement("a");
      anchor.href = getCanvasURL(colorSquares);
      anchor.download = "result.png";
      anchor.click();
      anchor.remove();
    }
  })
}

function getCanvasURL(colorSquares) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext('2d');

  const w = 1200;
  const h = 2132;
  canvas.width = w;
  canvas.height = h;

  while (!RESULTS_TEMPLATE.complete){}

  ctx.drawImage(RESULTS_TEMPLATE, 0, 0);
  ctx.textAlign = "center";
  ctx.font = "123px serif";
  const lineheight = 123 * 1.4;
  for (let i = 0; i < colorSquares.length; i++) {
    
    ctx.fillText(addSpaces(colorSquares[i]), w/2, h/4 + (i * lineheight));
  }
  ctx.font = "bold 144px 'playfair display'"
  ctx.fillText(`#${DAY_INDEX}`, w - 144.2, 274);

  return canvas.toDataURL('image/png')
}

async function shareCanvas(colorSquares) {
  const dataUrl = getCanvasURL(colorSquares);
  const blob = await (await fetch(dataUrl)).blob();
  const filesArray = [
    new File(
      [blob],
      'result.png',
      {
        type: blob.type,
        lastModified: new Date().getTime()
      }
    )
  ];
  const shareData = {
    files: filesArray,
  };
  navigator.share(shareData);
}

function addSpaces(squaresString) {
  let newStringArray = new Array();
  for (const s of squaresString) {
    newStringArray.push(s);
    newStringArray.push(" ");
  }
  newStringArray.pop();
  return newStringArray.join('');
}

function showResults(){
  $("#result").fadeIn(400).show();
}

function hideResults() {
  let fadeTime = 300;
  $("#result").fadeOut(fadeTime);
  setTimeout($("#result").hide, fadeTime)
}

function getColorSquares() {
  return prevStates
  .map(states => states
    .map(state => state === "correct" ? "\uD83D\uDFE9" : state === "misplaced" ? "\uD83D\uDFE8" : "\u2B1B")
    .join(""))
}

function checkGuess() {
  if (currentGuess === TARGET) {
    return new Array(5).fill("correct");
  }

  let targetCopy = [...TARGET];
  let currentGuessCopy = [...currentGuess];
  let states = new Array(TARGET.length);

  for (let i = 0; i < states.length; i++) {
    if (currentGuessCopy[i] === targetCopy[i]) {
      states[i] = "correct";
      targetCopy[i] = undefined;
      currentGuessCopy[i] = undefined;
      correctLetters.add(currentGuess[i]);
      misplacedLetters.delete(currentGuess[i]);
    }
  }

  for (let i = 0; i < states.length; i++) {
    if (currentGuessCopy[i] != undefined && targetCopy.includes(currentGuessCopy[i])) {
      states[i] = "misplaced";
      targetCopy[targetCopy.indexOf(currentGuessCopy[i])] = undefined;
      currentGuessCopy[i] = undefined;
      if (!correctLetters.has(currentGuess[i])) {
        misplacedLetters.add(currentGuess[i]);
      }
    }
  }

  for (let i = 0; i < states.length; i++) {
    if (states[i] === undefined) {
      states[i] = "wrong";
      if (
        !correctLetters.has(currentGuess[i]) &&
        !misplacedLetters.has(currentGuess[i])
      ) {
        wrongLetters.add(currentGuess[i]);
      }
    }
  }
  return states;
}

function renderColors(states) {
  let start = gridRow * 5 + 1;
  for (let i = 0; i < states.length; i++) {
    setTimeout(x => $(`.letter:nth-child(${i + start})`).addClass(states[i]), i*150);
  }
}

function isGameOver(states) {
  if (states.every(x => x === "correct")) {
    return 1;
  } else if (gridRow >= 6) {
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
