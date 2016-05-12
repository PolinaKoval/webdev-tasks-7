'use strict';

const model = require('../models/pigModel');

exports.getCurrState = (req, res) => {
    let currState = model.getCurrentState();
    res.status(200).json(currState);
};

exports.restart = (req, res) => {
    model.restart();
    res.status(200).send({});
};

exports.increaseMood = (req, res) => {
    let currState = model.increaseMood();
    res.status(200).json(currState);
};

exports.startSleep = (req, res) => {
    model.sleep();
    res.status(200).send({});
};

exports.stopSleep = (req, res) => {
    model.stopSleep();
    res.status(200).send({});
};

exports.startEat = (req, res) => {
    model.eat();
    res.status(200).send({});
};

exports.stopEat = (req, res) => {
    model.stopEat();
    res.status(200).send({});
};
