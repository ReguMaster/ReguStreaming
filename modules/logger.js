/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Logger = {};

const fileStream = require( "fs" );
const DateConverter = require( "dateformat" );
// const hook = require( "../hook" );
const dateEvents = require( "date-events" )( );

Logger.config = {
    directory: "./logs/regustreaming-log-" + DateConverter( new Date( ), "yyyy-mm-dd" ) + ".log",
    directoryI: "./logs/IMPORTANT_regustreaming-log-" + DateConverter( new Date( ), "yyyy-mm-dd" ) + ".log"
};

fileStream.access( "./logs", fileStream.constants.F_OK, function( err )
{
    if ( err )
        console.error( `[Logger] Logger directory missing! (directory:${ Logger.config.directory })` );
} );

dateEvents.on( "date", function( )
{
    var currentDate = new Date( );
    Logger.config.directory = "./logs/regustreaming-log-" + DateConverter( currentDate, "yyyy-mm-dd" ) + ".log";
    Logger.config.directoryI = "./logs/IMPORTANT_regustreaming-log-" + DateConverter( currentDate, "yyyy-mm-dd" ) + ".log";
} );

Logger.type = {
    Info: 0,
    Warning: 1,
    Error: 2,
    Event: 3,
    Important: 4
};
Logger.typeKey = Object.keys( Logger.type );
Logger.typeString = [
    "(INFO)",
    "(!   WARNING   !)",
    "(!    ERROR    !)",
    "(EVENT)",
    "(!    IMPOR    !)"
]

Logger.info = ( message ) => Logger.write( Logger.type.Info, message );
Logger.warn = ( message ) => Logger.write( Logger.type.Warning, message );
Logger.error = ( message ) => Logger.write( Logger.type.Error, message );
Logger.event = ( message ) => Logger.write( Logger.type.Event, message );
Logger.impor = ( message ) => Logger.write( Logger.type.Important, message );

Logger.write = function( level, message )
{
    var body = DateConverter( new Date( ), "yyyy-mm-dd h:MM:ss" ) + " ";

    if ( this.type[ this.typeKey[ level ] ] )
        body += this.typeString[ level ];
    else
        body += "(INFO)";

    body += " : " + message;

    process.send(
    {
        type: "log",
        logLevel: level,
        message: body
    } );

    if ( level == Logger.type.Important )
    {
        fileStream.appendFile( this.config.directoryI, body + "\r\n", function( err )
        {
            if ( err )
                console.error( `[Logger] Failed to save LOG! (err:${ err.stack })` );
        } );
    }
    else
    {
        fileStream.appendFile( this.config.directory, body + "\r\n", function( err )
        {
            if ( err )
                console.error( `[Logger] Failed to save LOG! (err:${ err.stack })` );
        } );
    }

    // hook.run( "OnLog", level, body );
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