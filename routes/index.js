const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/test', (req, res) => {
	res.send('test');
});

router.get('/music', (req, res) => {
	res.sendFile( path.join(__dirname, '/../', 'views','index.html') );
});

module.exports = router;