/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ChatManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );
const ClientManager = require( "../client.js" );
const Logger = require( "./logger.js" );

ChatManager.test = 110;

ClientManager.hooks.push( function( socket, client )
{
	var ipAddress = socket.handshake.address;
	
	socket.on( "chatPost", ( data ) =>
	{
		var chatMessage = data.chatMessage;
		
		// chatMessage = chatMessage.replace(/\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g, "_#XSSDETECTED_");
		
		// if ( chatMessage.indexOf( "_#XSSDETECTED_" ) > -1 )
		// {
			// Main.io.emit( "chatReceive", {
				// name: "시스템",
				// chatMessage: socket.handshake.address + " -> XSS 공격으로 강퇴 처리"
			// } );
			
			// socket.emit( "notification", {
				// message: "XSS 공격으로 차단되었습니다. (SERVER_REJECT_ATTACK)"
			// } );
			// socket.disconnect( );
			
			// console.log( `[Client] Client kicked! -> 'reason: XSS' 'ipAddress: ${ socket.handshake.address }'`.bold.red );
		
			// return;
		// }
		
		
		
		ClientManager.getAll( true ).forEach( function( client2, index2 )
		{
			client2.socket.emit( "chatReceive", {
				name: client.name + "#" + client.userID,
				chatMessage: chatMessage
			} );
		} );
		
		Logger.write( Logger.LogType.Info, `[Chat] ${ client.name }#${ client.userID } ${ ipAddress } : ${ chatMessage }` );
	} );
	
	// socket.on( "chatReceive", ( data ) =>
	// {
		// socket.disconnect( );
	// } );
} );

module.exports = ChatManager;