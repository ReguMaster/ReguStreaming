/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = {};

const App = require( "../app" );
// const Server = require( "../server" );
const path = require( "path" );
const consoleColor = require( "colors" );
const FileStream = require( "fs" );
const DateConverter = require( "dateformat" );
const hook = require( "../hook" );

Logger.currentDate = new Date( );
Logger.directory = "./logs/regustreaming-log-" + DateConverter( Logger.currentDate, "yyyy-mm-dd" ) + ".log"; // 버그있어요. (다음날 되면 안댐)
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
}
Logger.write = function( logLevel, message )
{
    var messageFixed = `${ DateConverter( Logger.currentDate, "yyyy-mm-dd h:MM:ss" ) } (^level^) : ${ message }`;

    switch ( logLevel )
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

            console.log( messageFixed.bgRed.bold.white );
            break;
        case Logger.LogType.Important:
            messageFixed = messageFixed.replace( "^level^", "!    IMPOR    !" );

            console.log( messageFixed.bgBlue.bold.white );
            break;
    }

    if ( logLevel == Logger.LogType.Important )
    {
        FileStream.appendFile( "./logs/IMPORTANT_regustreaming-log-" + DateConverter( Logger.currentDate, "yyyy-mm-dd" ) + ".log", messageFixed + "\r\n", function( error )
        {
            if ( error )
                console.log( error );
        } );
    }
    else
    {
        FileStream.appendFile( Logger.directory, messageFixed + "\r\n", function( error )
        {
            if ( error )
                console.log( error );
        } );
    }

    hook.run( "OnLog", logLevel, messageFixed );
}

// var legacyLog = console.log;
// console.log = function( ...message )
// {
//     legacyLog( ...message );
//     hook.run( "OnLog", 0, message );
// }

module.exports = Logger;