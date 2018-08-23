/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = {};

const fileStream = require( "fs" );
const path = require( "path" );
const DateConverter = require( "dateformat" );
const hook = require( "../hook" );

Logger.currentDate = new Date( );
Logger.config = {
    directory: "./logs/regustreaming-log-" + DateConverter( Logger.currentDate, "yyyy-mm-dd" ) + ".log" // *오류: 날짜가 pass 되면 안댐
};

fileStream.access( Logger.config.directory, fileStream.constants.F_OK, function( err )
{
    if ( err )
        console.error( `[Logger] Logger directory missing! (directory:${ Logger.config.directory })` );
} );

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

// setInterval( function( )
// {
//     Logger.write( 0, "test" );
// }, 3000 );

// const AdministratorSocket = App.socketIO.of( "/administrator" );

Logger.LogType = {
    Info: 0,
    Warning: 1,
    Error: 2,
    Event: 3,
    Important: 99
};
Logger.write = function( logLevel, message )
{
    var messageFixed = `${ DateConverter( Logger.currentDate, "yyyy-mm-dd h:MM:ss" ) } (^level^) : ${ message }`;

    switch ( logLevel )
    {
        case Logger.LogType.Info:
            messageFixed = messageFixed.replace( "^level^", "INFO" );
            break;
        case Logger.LogType.Event:
            messageFixed = messageFixed.replace( "^level^", "EVENT" );
            break;
        case Logger.LogType.Warning:
            messageFixed = messageFixed.replace( "^level^", "!   WARNING   !" );
            break;
        case Logger.LogType.Error:
            messageFixed = messageFixed.replace( "^level^", "!    ERROR    !" );
            break;
        case Logger.LogType.Important:
            messageFixed = messageFixed.replace( "^level^", "!    IMPOR    !" );
            break;
    }

    // console.log( Logger.LogTypeKey[ logLevel ] + "^" + messageFixed );

    process.send(
    {
        type: "log",
        logLevel: logLevel,
        message: messageFixed
    } );

    if ( logLevel == Logger.LogType.Important )
    {
        fileStream.appendFile( "./logs/IMPORTANT_regustreaming-log-" + DateConverter( Logger.currentDate, "yyyy-mm-dd" ) + ".log", messageFixed + "\r\n", function( err )
        {
            if ( err )
                console.error( `[Logger] Failed to save LOG! (err:${ err.stack })` );
        } );
    }
    else
    {
        fileStream.appendFile( this.config.directory, messageFixed + "\r\n", function( err )
        {
            if ( err )
                console.error( `[Logger] Failed to save LOG! (err:${ err.stack })` );
        } );
    }

    // hook.run( "OnLog", logLevel, messageFixed );
}

var legacyLog = console.log;
console.log = function( ...message )
{
    legacyLog( ...message );

    process.send(
    {
        type: "log",
        message: message
    } );
}

module.exports = Logger;