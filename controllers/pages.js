exports.index = (req, res) => {
	res.render('game/game');
};

exports.error404 = (req, res) => {
    res.sendStatus(404);
};