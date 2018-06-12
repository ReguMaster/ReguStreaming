/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const LogManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );

LogManager.LogType = {
	Info: 0,
	Warning: 1,
	Error: 2
};

LogManager.write = function( logType, message )
{
	console.log(logType);
	
	switch( logType )
	{
		case LogManager.LogType.Info:
		
			break;
		case LogManager.LogType.Warning:
			console.log("lol");
			break;
		case LogManager.LogType.Error:
		
			break;
	}
}

module.exports = LogManager;