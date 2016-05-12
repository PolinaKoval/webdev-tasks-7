require('./game.css');
const Snap = require('snapsvg');
const snap = Snap('#pig');

let currentAction;
let state = {};
let animations = [];
let recognizer;
let battery;
let hidden;
let Notification;
let visibilityChange;
let speekPlace = document.getElementById('speech');
let sayId;

window.onload = () => {
    loader(false);
    initRecognizer();
    initHidden();
    initNotification();
    navigator
    .getBattery()
    .then(initBattery);
    setInterval(refresh, 2000);
};

document.getElementById('restart').addEventListener('click', restart);
document.getElementById('pigDiv').addEventListener('click', onClick);
document.getElementById('incVol').addEventListener('click', increaseVol);
document.getElementById('decVol').addEventListener('click', decreaseVol);


function onClick() {
    if (state.action === 'sleep') {
        stopSleep();
    } else {
        startSpeek();
    }
}

window.ondevicelight = e => {
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
    });
}

function initNotification() {
    Notification = window.Notification || window.webkitNotification;
    if (Notification.permission === "granted") {
        let notification = new Notification("Я буду сообщать тебе о своем состоянии");
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                let notification = new Notification("Я буду сообщать тебе о своем состоянии");
            }
        });
    }
}

function initBattery(b) {
    battery = b;
    battery.onchargingchange = updateCharging;
    battery.onchargingchange();
}

function initHidden() {
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.mozHidden !== "undefined") {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    document.addEventListener(visibilityChange, handleVisibilityChange, false);
}

function updateCharging() {
    this.charging ? startEat() : stopEat();
}

function handleVisibilityChange() {
    document[hidden] ? startSleep() : stopSleep();
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
    clearTimeout(sayId);
    speekPlace.innerHTML = text;
    clearSpeech();
}

function initRecognizer() {
    let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        return;
    }
    recognizer = new SpeechRecognition();
    recognizer.lang = 'ru-RU';
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.onresult = printResult;
}

function restart(event) {
    currentAction = null;
    clearSpeech(true);
    fetch('/restart')
    .then(() => refresh())
    .catch(err => console.log(err));
}

function loader(display) {
    let loader = document.getElementsByClassName('loading')[0];
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
            } else {
                setNormalAnimations();
            }
        }
        if (state.action === 'sleep') {
            setSleepAnimations();
        }
        if (state.action === 'eat') {
            setEatAnimations();
        }
        if (document[hidden]) {
            if (Math.min(state.mood, state.satiety, state.energy) < 90) {
                showWaringMsg();
            }
        }
        loader(false);
        currentAction = state.action;
    })
    .catch(err => console.log(err));
}


function showWaringMsg() {
    let min = 10;
    if (state.mood < min) {
        let notification = new Notification("Развлеки меня!");
    } else if (state.satiety < min) {
        let notification = new Notification("Покорми меня!");
    } else if (state.energy < min) {
        let notification = new Notification("Я хочу спать!");
    }
}

function updateIndicators() {
    let energy = document.getElementById('energy-value');
    energy.innerHTML = state.alive ? state.energy : 0;
    let mood = document.getElementById('mood-value');
    mood.innerHTML = state.alive ? state.mood : 0;
    let satiety = document.getElementById('satiety-value');
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
        if (state.mood === 100) {
            recognizer.stop();
            setTimeout(() => say('я наговорился, пока'), 1000);
        }
        updateIndicators();
    })
    .catch(err => console.log(err));
}

function eyesAnimation() {
    let eyes = snap.selectAll(".close");
    eyes.forEach(elem => elem.animate({ 'fill-opacity': 1 }, 10,
        mina.easein,
        () => setTimeout(() =>
            elem.animate({ 'fill-opacity': 0 }, 10, mina.easein), 200)
    ));
}

function earsAnimation() {
    let leftEar = snap.select('#left_ear');
    leftEar.animate({ transform: 'r45, 290, 206' }, 1000,
        mina.linear,
        () => setTimeout(() =>
            leftEar.animate({ transform: '' }, 1000, mina.easein), 200)
    );
}

function noseAnimation() {
    let nose = snap.select('#nose');
    nose.animate({ transform: 'translate(7,6) scale(0.98)' }, 500,
        mina.linear,
        () => setTimeout(() =>
            nose.animate({ transform: '' }, 500, mina.easein), 200)
    );
}

function decreaseVol() {
    let player = document.getElementById('player');
    let oldVol = player.volume;
    player.volume = Math.max(oldVol -= 0.2, 0);
    say('Я буду говорить с громкость ' + player.volume.toFixed(1));
}

function increaseVol() {
    let player = document.getElementById('player');
    let oldVol = player.volume;
    player.volume = Math.min(oldVol += 0.2, 1);
    say('Я буду говорить с громкость ' + player.volume.toFixed(1));
}

function pigSound() {
    let player = document.getElementById('player');
    player.play();
}

function setNormalAnimations() {
    clearSpeech();
    clearAnimations();
    animations.push(setInterval(pigSound, 8000));
    animations.push(setInterval(eyesAnimation, 4000));
    animations.push(setInterval(earsAnimation, 3000));
    animations.push(setInterval(noseAnimation, 2000));
}

function setSleepAnimations() {
    clearSpeech(true);
    clearAnimations();
    animations.push(setInterval(noseAnimation, 2000));
    let eyes = snap.selectAll(".close");
    eyes.forEach(elem => elem.attr({ 'fill-opacity': 1 }));
}

function setEatAnimations() {
    clearSpeech(true);
    clearAnimations();
    document.getElementById('left_cheek').style.opacity = 1;
    document.getElementById('right_cheek').style.opacity = 1;
    animations.push(setInterval(eatAnimation, 2000));
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
    let left = snap.select('#left_cheek');
    let right = snap.select('#right_cheek');
    left.animate({ transform: 'translate(-137,-180) scale(1.5)' }, 500,
        mina.linear,
        () => setTimeout(() =>
            left.animate({ transform: '' }, 500, mina.easein), 200)
    );
    right.animate({ transform: 'translate(-95,-70) scale(1.2)'}, 500,
        mina.linear,
        () => setTimeout(() =>
            right.animate({ transform: '' }, 500, mina.easein), 200)
    );
}


function speekAnimation() {
    let mouth = snap.select('#mouth');
    mouth.animate({fill: '#fff'}, 1000, mina.linear,
        () => setTimeout(() => mouth.animate({fill: '#ffc0cb'}, 500, mina.linear)));
}

function setDieAnimations() {
    clearAnimations();
    speekPlace.innerHTML = "Это был хороший Хрюндель(";
    let leftEye = document.getElementById('left_eye');
    let rightEye = document.getElementById('right_eye');
    leftEye.style.opacity = 0;
    rightEye.style.opacity = 0;
    let dieEyes = document.getElementById('die');
    dieEyes.style.opacity = 1;
}

function clearAnimations() {
    document.getElementById('left_eye').opacity = 1;
    document.getElementById('right_eye').opacity = 1;
    document.getElementById('left_cheek').style.opacity = 0;
    document.getElementById('right_cheek').style.opacity = 0;
    document.getElementById('die').style.opacity = 0;
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
    let index = e.resultIndex;
    let result = e.results[index][0].transcript.trim();
    speekAnimation();
    say(result);
    if (result.toLowerCase() === 'пока') {
        recognizer.stop();
        return;
    }
    increaseMood();
}

function clearSpeech(inmoment) {
    sayId = setTimeout(() => {
            document.getElementById('speech').innerHTML = "";
        }, inmoment ? 0 : 2000);
}
