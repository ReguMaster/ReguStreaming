/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ClientManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../app.js" );
const MusicProvider = require( "./musicprovider.js" );
const BanManager = require( "./ban.js" );
const LogManager = require( "./logmanager.js" );

ClientManager.maxConnections = 50;
ClientManager.test = 110;


class Client
{
	constructor( socket )
	{
		this._socket = socket;
	}
	
	initialize( name, userID )
	{
		this._socket.userName = name;
		this._socket.userID = userID;
	}
	
	get name( )
	{
		return this._socket.userName;
	}
	
	get userID( )
	{
		return this._socket.userID;
	}
}

ClientManager.IPList = [ ];
ClientManager.CLIENTS = [ ];
ClientManager.IPBans = [ ];
ClientManager.clientsCount = 0;

ClientManager.preClientConnection = function( socket, ipAddress )
{
	// Reject
	var banInformation = BanManager.isBanned( ipAddress )
	
	if ( banInformation.banned )
	{
		return {
			accept: false,
			why: "접속이 차단되었습니다. (" + banInformation.why + ") (" + banInformation.duration + "일) (SERVER_REJECT_BANNED)"
		};
	}
	
	if ( this.clientsCount >= this.maxConnections )
	{
		return {
			accept: false,
			why: "최대 접속 인원 수를 초과했습니다. (SERVER_REJECT_MAXCLIENT)"
		};
	}
	
	// if ( this.IPList.indexOf( socket.handshake.address ) > -1 )
	// {
		// return {
			// accept: false,
			// why: "다른 세션에서 이미 접속 중입니다. (SERVER_REJECT_SESSION)"
		// };
	// }
	
	return {
		accept: true
	}
}

// *TODO;
// ip address based UserID;
ClientManager.generateUserID = function( ipAddress )
{
	var name = "";
	var possible = "abcdefghijklmnopqrstuvwxyz";
	
	for( var i = 0; i < 10; i++ ) {
		name += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return name;
}

ClientManager.ioEventConnection = function( socket )
{
	var ipAddress = socket.handshake.address;
	// *TODO;
	// 클라이언트 접속 버튼 여러번 누를시 여러번 접속되는 문제 수정바람;
	socket.emit( "welcome", {
		clientsCount: ClientManager.clientsCount
	} );
	
	var reason = ClientManager.preClientConnection( socket, ipAddress );
	
	if ( !reason.accept )
	{
		socket.emit( "connection_reject", true );
		socket.emit( "notification", {
			message: reason.why
		} );
		socket.disconnect( );
		
		console.log( `[Client] Client rejected! -> 'reason: ${ reason.why }' 'ipAddress: ${ ipAddress }'`.bold.red );
		
		LogManager.write( LogManager.LogType.Warning, `[Client] Client rejected! -> 'reason: ${ reason.why }' 'ipAddress: ${ ipAddress }'` );
		return;
	}
	
	var client = new Client( socket );
	
	ClientManager.IPList.push( ipAddress );
	
	socket.on( "join", ( data ) =>
	{
		ClientManager.clientsCount++;
		
		var newArr = Object.assign( { }, MusicProvider.currentMusic );
		newArr.musicPos = MusicProvider.currentMusicPos;
		
		Main.io.emit( "join", ClientManager.clientsCount );
		socket.emit( "music_define", newArr );
		socket.emit( "music_play" );
		
		// under construction;
		socket.emit( "clientDataRefresh", {
			command: "register",
			data: {
				x: Math.floor( Math.random() * 100 ),
				y:  Math.floor( Math.random() * 100 )+50,
				name: "doshigatai"
			}
		} );
		
		client.initialize( data.name, ClientManager.generateUserID( ipAddress ) );
		
		ClientManager.CLIENTS.push( client );
		
		console.log( `[Client] New client connected. -> 'name: ${ client.name }', 'userID: ${ client.userID }' 'ipAddress: ${ ipAddress }'\nTotal Clients: ${ ClientManager.clientsCount - 1 } -> ${ ClientManager.clientsCount }`.bold.green );
	} );
	
	socket.on( "forceDisconnect", ( data ) =>
	{
		socket.disconnect( );
	} );

	socket.on( "disconnect", ( ) =>
	{
		ClientManager.clientsCount = Math.max( ClientManager.clientsCount - 1, 0 );
		ClientManager.IPList.splice( ClientManager.IPList.indexOf( ipAddress ), 1 );
		Main.io.emit( "join", ClientManager.clientsCount );
		
		console.log( `[Client] Client disconnected. -> 'name: ${ client.name }', 'userID: ${ client.userID }' 'ipAddress: ${ ipAddress }'\nTotal Clients: ${ ClientManager.clientsCount + 1 } -> ${ ClientManager.clientsCount }`.bold.green );
	} );
}

Main.io.on( "connection", ClientManager.ioEventConnection );


module.exports = ClientManager;