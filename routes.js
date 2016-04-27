'use strict';

const pig = require('./controllers/pig');
const pages = require('./controllers/pages');

module.exports = function (app) {
    app.get('/', pages.index);
    app.get('/getState', pig.getCurrState);
    app.get('/restart', pig.restart);
    app.get('/moodInc', pig.increaseMood);
    app.get('/sleep', pig.startSleep);
    app.get('/stopSleep', pig.stopSleep);
    app.get('/eat', pig.startEat);
    app.get('/stopEat', pig.stopEat);
    app.all('*', pages.error404);
    app.use((err, req, res) => {
        console.error(err);
        res.sendStatus(500);
    });
};
