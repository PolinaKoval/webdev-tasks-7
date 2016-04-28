require('./game.css');
const Snap = require('snapsvg');

var currentAction;
var state = {};
var animations = [];
var s = Snap('#pig');
var recognizer;
var battery;
var speekPlace = document.getElementById('speech');

window.onload = () => {
    loader(false);
    initRecognizer();
    navigator
    .getBattery()
    .then(initBattery);
    setInterval(refresh, 2000);
}

document.getElementById('restart').addEventListener('click', restart);
document.getElementById('pigDiv').addEventListener('click', onClick);

function onClick(e) {
    if (state.action === 'sleep') {
        stopSleep();
    } else {
        startSpeek();
    }
}
window.ondevicelight = function(e) {
    console.log(e.value);
    if (e.value > 10 || state.action === 'sleep') {
        return;
    }
    if (state.energy === 100) {
        say('Включи свет, я бодр!');
    } else {
        startSleep();
    }
};


function startSleep() {
    fetch('/sleep')
    .then(() => setSleepAnimations())
    .catch(err => console.log(err));
}

function stopSleep() {
    fetch('/stopSleep')
    .then(() => {
        say('Я проснулся');
        setNormalAnimations();
    })
}


function initBattery(b) {
    battery = b;
    battery.onchargingchange = updateCharging;
    battery.onchargingchange();
}

function updateCharging() {
    this.charging ?  startEat() : stopEat();
}

function startEat() {
    fetch('./eat')
    .then(refresh)
    .catch(err => console.log(err));
}

function stopEat() {
    if (state.action !== 'eat') {
        return;
    }
    fetch('./stopEat')
    .then(refresh)
    .then(() => say('Было вкусно!'))
    .catch(err => console.log(err));
}

function say(text) {
    speekPlace.innerHTML = text;
    clearSpeech();
}

function initRecognizer() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) {
        return;
    }
    recognizer = new SpeechRecognition();
    recognizer.lang = 'ru-RU';
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.onresult = printResult;
}

function restart(event) {
    clearSpeech(true);
    fetch('/restart')
    .then(() => refresh())
    .catch(err => console.log(err));
}

function loader(display) {
    var loader = document.getElementsByClassName('loading')[0];
    if (display) {
        loader.style.display = 'block';
    } else {
        loader.style.display = 'none';
    }
}

function refresh() {
    return fetch('/getState')
    .then(response => response.json())
    .then(data => {
        state = data;
        updateIndicators();
        if (!state.alive) {
            setDieAnimations();
            return;
        }
        if (currentAction === state.action) {
            return;
        }
        if (state.action === 'none') {
            if (battery.charging) {
                startEat();
            }
        }
        if (state.action === 'sleep') {
            setSleepAnimations();
        }
        if (state.action === 'eat') {
            setEatAnimations();
        }
        loader(false);
        currentAction = state.action;
    })
    .catch(err => console.log(err));
}

function updateIndicators() {
    var energy = document.getElementById('energy-value');
    energy.innerHTML = state.alive ? state.energy : 0;
    var mood = document.getElementById('mood-value');
    mood.innerHTML = state.alive ? state.mood : 0;
    var satiety = document.getElementById('satiety-value');
    satiety.innerHTML = state.alive ? state.satiety : 0;
}

function increaseMood() {
    fetch('/moodInc')
    .then(response => response.json())
    .then(data => {
        state = data;
        if (!state.alive) {
            pigDie();
            return;
        }
        updateIndicators();
    })
    .catch(err => console.log(err));
}

function eyesAnimation() {
    var eyes = s.selectAll(".close");   
    eyes.forEach(elem => elem.animate({ 'fill-opacity': 1 }, 10,
        mina.easein, 
        () => setTimeout(() => 
            elem.animate({ 'fill-opacity': 0 }, 10, mina.easein), 200)
    ));
}

function earsAnimation() {
    var leftEar = s.select('#left_ear');
    leftEar.animate({ transform: 'r45, 290, 206' }, 1000,
        mina.linear,
        () => setTimeout(() => 
            leftEar.animate({ transform: '' }, 1000, mina.easein), 200)
    );
}

function noseAnimation() {
    var nose = s.select('#nose');
    nose.animate({ transform: 'translate(7,6) scale(0.98)' }, 500,
        mina.linear,
        () => setTimeout(() => 
            nose.animate({ transform: '' }, 500, mina.easein), 200)
    );
}

function setNormalAnimations() {
    clearSpeech();
    clearAnimations();
    animations.push(setInterval(eyesAnimation, 4000));
    animations.push(setInterval(earsAnimation, 3000));
    animations.push(setInterval(noseAnimation, 2000));
}

function setSleepAnimations() {
    clearSpeech(true);
    clearAnimations();
    animations.push(setInterval(noseAnimation, 2000));
    var eyes = s.selectAll(".close");   
    eyes.forEach(elem => elem.attr({ 'fill-opacity': 1 }));
}

function setEatAnimations() {
    animations.push(setInterval(eatAnimation, 1500));
    animations.push(setInterval(eyesAnimation, 4000));
    animations.push(setInterval(earsAnimation, 3000));
    animations.push(setInterval(noseAnimation, 2000));
}

function eatAnimation() {
    if (state.satiety === 100) {
        speekPlace.innerHTML = 'Я сыт';
        setNormalAnimations();
    }
    speekPlace.innerHTML = 'Я кушаю, спасибо';
}

function setDieAnimations() {
    clearAnimations();
    speekPlace.innerHTML = "Это был хороший Хрюндель(";
    var leftEye = document.getElementById('left_eye');
    var rightEye = document.getElementById('right_eye');
    leftEye.style.opacity = 0;
    rightEye.style.opacity = 0;
    var dieEyes = document.getElementById('die');
    dieEyes.style.opacity = 1;
}

function clearAnimations() {
    var leftEye = document.getElementById('left_eye');
    var rightEye = document.getElementById('right_eye');
    leftEye.style.opacity = 1;
    rightEye.style.opacity = 1;
    var dieEyes = document.getElementById('die');
    dieEyes.style.opacity = 0;
    animations.forEach(animId =>
        clearInterval(animId));
    animations = [];
}

function startSpeek() {
    if (state.mood === 100) {
        say('Извини, я не хочу с тобой говорить');
        return;
    }
    if (!recognizer) {
        say('Извини, я не могу с тобой говорить');
        return;
    }
    speekPlace.innerHTML = 'Привет, я скучал, чтобы завершить разговор скажи "пока"';
    recognizer.start();
}

function printResult(e) {
    var index = e.resultIndex;
    var result = e.results[index][0].transcript.trim();
    speekPlace.innerHTML = result;
    if (result.toLowerCase() === 'пока') {
        recognizer.stop();
        clearSpeech();
    }
    increaseMood();
    state.mood++;
    if (state.mood === 100) {
        recognizer.stop();
        setTimeout(() => say('я наговорился, пока'), 1000);
    }
}

function clearSpeech(inmoment) {    
    setTimeout(() => {
            document.getElementById('speech').innerHTML = ""
    }, inmoment ? 0 : 2000);
}