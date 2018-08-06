/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const UserManagement = {};

const Server = require( "../server" );
const App = require( "../app" );
const path = require( "path" );
const FileStorage = require( "../filestorage" );
const hook = require( "../hook" );
const reguUtil = require( "../util" );
const Logger = require( "./logger" );
const Interact = require( "./interact" );

App.socketIO.of( "/administrator" )
    .on( "connect", function( socket )
    {
        if ( socket.handshake.headers.referer === "https://regustreaming.oa.to/admin" )
        {
            Logger.write( Logger.LogType.Important, `[Client] Administrator joined management console. ${ socket.handshake.address }` );

            Server.MANAGEMENT_CONSOLE.push( socket );
        }
        else
        {
            socket.disconnect( );
            Logger.write( Logger.LogType.Important, `[Client] ERROR: Administrator rejected from management console. ${ socket.handshake.address }` );

            return;
        }

        socket.on( "RS.administrator.executeCommand", function( data )
        {
            Interact.process( data.command );

            Logger.write( Logger.LogType.Important, `[Client] Administrator executed command. (${ data.command }) ${ socket.handshake.address }` );
        } );

        socket.on( "disconnect", function( )
        {
            Server.MANAGEMENT_CONSOLE.splice( Server.MANAGEMENT_CONSOLE.indexOf( socket ), 1 );
            Logger.write( Logger.LogType.Important, `[Client] Administrator leaved from management console. ${ socket.handshake.address }` );
        } )

        hook.run( "PostAdministratorConnected", socket );
    } );


let AdministratorSocket = App.socketIO.of( "/administrator" );
hook.register( "OnLog", function( logLevel, log )
{
    if ( Server.MANAGEMENT_CONSOLE.length !== 0 )
    {
        AdministratorSocket.emit( "RS.administrator.logEmit",
        {
            level: logLevel,
            log: log
        } );
    }
} );

module.exports = UserManagement;