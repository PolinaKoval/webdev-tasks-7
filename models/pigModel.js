'use strict';

let currentState = {
    action: 'none',
    satiety: 90,
    energy: 90,
    mood: 90,
    alive: true
};

let speekId;
let eatId;
let sleepId;

let decreaseId = setInterval(function() {
  decreaseIndicators();
}, 10000);

exports.getCurrentState = () => {
    //console.log(currentState);
    return currentState;
}

exports.restart = () => {
    currentState = {
        action: 'none',
        satiety: 2,
        energy: 2,
        mood: 2,
        alive: true
    };
}

exports.increaseMood = () => {
    if (currentState.mood >= 100) {
        stopEat();
        currentState.action = 'none';
        return currentState;
    }
    clearTimeout(speekId);
    currentState.action = 'speek';
    speekId = setTimeout(() => currentState.action = 'none', 4000);
    currentState.mood++;
    return currentState;
}

exports.sleep = () => {
    if (currentState.action === 'eat') {
        stopEat();
    }
    if (currentState.energy >= 100) {
        return stopSleep();
    }
    currentState.action = 'sleep';
    sleepId = setInterval(increaseIndicator, 3000, 'energy');
    return currentState;
}

function stopSleep() {
    currentState.action = 'none';
    clearInterval(sleepId);
    return currentState;
}

exports.stopSleep = stopSleep;

exports.eat = () => {
    if (currentState.action === 'sleep') {
        stopSleep();
    }
    if (currentState.energy >= 100) {
        return currentState;
    }
    currentState.action = 'eat';
    eatId = setInterval(increaseIndicator, 3000, 'satiety');
    return currentState;
}

function stopEat() {
    console.log('stopEat');
    currentState.action = 'none';
    clearInterval(eatId);
    return currentState;
}

exports.stopEat = stopEat;

function increaseIndicator(indicator) {
    if (currentState[indicator] < 100 && currentState.action !== 'none') {
        currentState[indicator]++;
    } else {
        if (indicator === 'energy') {
            clearInterval(sleepId);
        }
        if (indicator === 'satiety') {
            clearInterval(eatId);
        }
    }
}

function decreaseIndicators() {
    let emptyIndicators = 0;
    if (currentState.action !== 'sleep' && currentState.energy >= 0) {
        currentState.energy--;
        if (currentState.energy === 0) {
            emptyIndicators++;
        }
    }
    if (currentState.action !== 'speek' && currentState.mood >= 0) {
        currentState.mood--;
        if (currentState.mood === 0) {
            emptyIndicators++;
        }
    }
    if (currentState.action !== 'eat' && currentState.satiety >= 0) {
        currentState.satiety--;
        if (currentState.satiety === 0) {
            emptyIndicators++;
        }
    }
    if (emptyIndicators >= 2) {
        currentState.alive = false;
    }
}

