const express = require('express');
const path = require('path');
const router = express.Router();

router.get( "/api", (req, res) => {
	res.send( "Under construction;" );
});

router.get( "/", (req, res) => {
	res.sendFile( path.join(__dirname, '/../', 'views','index.html') );
});

router.get( "/streaming", (req, res) => {
	res.sendFile( path.join(__dirname, '/../', 'views','index.html') );
});

module.exports = router;