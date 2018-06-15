/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );
const FileStream = require( "fs" );
const DateConverter = require( "dateformat" );



Logger.currentDate = new Date( );
Logger.directory = "./logs/regustreaming-log-" + DateConverter( Logger.currentDate, "yyyy-mm-dd" ) + ".log";
// Logger.LogStream = FileStream.openSync( Logger.directory, "a+", 666 );

// 버그이쪄염;;
// Logger.datePassedChecker = function( )
// {
	// console.log(  Logger.currentDate.getDate( ), new Date( Date( ).now ).getDate( ) );
	// if ( Logger.currentDate.getDate( ) != new Date( Date( ).now ).getDate( ) )
	// {
		// Logger.currentDate = new Date( Date( ).now );
		// Logger.directory = "./logs/regustreaming-log-" + DateConverter( Logger.currentDate, "yyyy-mm-dd" ) + ".log";
		
		// console.log("Date CHANGED!");
	// }
	// else
	// {
		// console.log("SAME!");
	// }
// }

// setInterval( Logger.datePassedChecker, 3000 );

Logger.LogType =
{
	Info: 0,
	Warning: 1,
	Error: 2,
	Event: 3
}
Logger.write = function( logLevel, message )
{
	var messageFixed = `${ DateConverter( Logger.currentDate, "yyyy-mm-dd h:MM:ss" ) } (^level^) : ${ message }`;
	
	switch( logLevel )
	{
		case Logger.LogType.Info:
			messageFixed = messageFixed.replace( "^level^", "INFO" );
			
			console.log( messageFixed.bold );
			break;
		case Logger.LogType.Event:
			messageFixed = messageFixed.replace( "^level^", "EVENT" );
			
			console.log( messageFixed.bold.cyan );
			break;
		case Logger.LogType.Warning:
			messageFixed = messageFixed.replace( "^level^", "!   WARNING   !" );
			
			console.log( messageFixed.bold.yellow );
			break;
		case Logger.LogType.Error:
			messageFixed = messageFixed.replace( "^level^", "!    ERROR    !" );
			
			console.log( messageFixed.bold.red );
			break;
	}
	
	FileStream.appendFile( Logger.directory, messageFixed + "\r\n" );
}

module.exports = Logger;