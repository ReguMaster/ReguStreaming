/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ClientManager = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "./app.js" );
// const FileUploadHandler = require( "./modules/fileupload.js" );
// const QueueManager = require( "./queue.js" );
const BanManager = require( "./modules/ban.js" );
const Logger = require( "./modules/logger.js" );
// const ChatManager = 
const VoteManager = require( "./modules/vote.js" );

ClientManager.maxConnections = 50;

class Client
{
	constructor( socket )
	{
		this._socket = socket;
		this._config = { };
	}
	
	initialize( name, userID )
	{
		this._socket.userName = name;
		this._socket.userID = userID;
		
		this._initialized = true;
	}
	
	get name( )
	{
		return this._socket.userName;
	}
	
	get userID( )
	{
		return this._socket.userID;
	}
	
	get ipAddress( )
	{
		return this._socket.handshake.address;
	}
	
	get initialized( )
	{
		return this._initialized;
	}
	
	get socket( )
	{
		return this._socket;
	}
	
	registerConfig( configName, value )
	{
		this._config[ configName ] = value;
		
	}
	
	getConfig( configName, defaultValue )
	{
		var value = this._config[ configName ]
		
		if ( typeof value == "undefined" )
			return defaultValue;
		
		return value;
	}
}

ClientManager.IPList = [ ];
ClientManager.CLIENTS = [ ];
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
	
	// 혼자있고싶어.. :)
	// if ( ipAddress != "1.224.53.166" )
	// {
		// return {
			// accept: false,
			// why: "접속이 차단되었습니다. (SERVER_REJECT_UNKNOWN)"
		// };
	// }
	
	if ( this.clientsCount >= this.maxConnections )
	{
		return {
			accept: false,
			why: "최대 접속 인원 수를 초과했습니다. (SERVER_REJECT_MAXCLIENT)"
		};
	}
	
	// *TODO;
	// 세션 종료해도 안 사라지는 오류 수정바람.
	if ( this.IPList.indexOf( socket.handshake.address ) > -1 )
	{
		return {
			accept: false,
			why: "다른 세션에서 이미 접속 중입니다. (SERVER_REJECT_SESSION)"
		};
	}
	
	return {
		accept: true
	}
}

// *TODO;
// ip address based UserID;
ClientManager.generateUserID = function( ipAddress )
{
	return Math.floor( 1000 + Math.random( ) * 9000 );
	// var name = "";
	// var possible = "abcdefghijklmnopqrstuvwxyz";
	
	// for( var i = 0; i < 10; i++ ) {
		// name += possible.charAt(Math.floor(Math.random() * possible.length));
	// }

	// return name;
}

ClientManager.findByIP = function( ipAddress, onlyInitialized = true )
{
	if ( onlyInitialized )
	{
		var result = null;
		
		ClientManager.getAll( true ).some( function( client )
		{
			if ( client.ipAddress == ipAddress )
			{
				result = client;
				
				return true;
			}
		} );
		
		return result;
	}
	else
	{
		for ( var i = 0; i < ClientManager.CLIENTS.length; i++ )
		{
			if ( ClientManager.CLIENTS[i].ipAddress == ipAddress ) return ClientManager.CLIENTS[i];
		}
	}
	
	return null;
}

ClientManager.getAll = function( onlyInitialized )
{
	if ( onlyInitialized )
	{
		var clients = [ ], length = ClientManager.CLIENTS.length;
		
		for ( var i = 0; i < length; i++ )
		{
			if ( ClientManager.CLIENTS[ i ].initialized )
				clients.push( ClientManager.CLIENTS[ i ] );
		}
		
		return clients;
	}
	else
		return ClientManager.CLIENTS;
}

ClientManager.kick = function( client, reason )
{
	client.socket.emit( "kickResult", {
		message: "서버로부터 강제 퇴장되었습니다. (사유 : " + reason + ")"
	} );
	
	Logger.write( Logger.LogType.Warning, `[Client] Client kicked! -> ${ client.name }#${ client.userID }::${ client.ipAddress } -> 'reason: ${ reason }'` );
	client.socket.disconnect( );
}

ClientManager.ban = function( client, reason )
{
	client.socket.emit( "kickResult", {
		message: "서버로부터 접속 차단 처리되었습니다. (사유 : " + reason + ")"
	} );
	
	BanManager.register( client.ipAddress );
	
	Logger.write( Logger.LogType.Warning, `[Client] Client banned! -> ${ client.name }#${ client.userID }::${ client.ipAddress } -> 'reason: ${ reason }'` );
	client.socket.disconnect( );
}

ClientManager.onDisconnect = function( client, socket )
{
	var ipAddress = socket.handshake.address;
	
	ClientManager.IPList.splice( ClientManager.IPList.indexOf( ipAddress ), 1 );
	
	if ( client.initialized )
	{
		ClientManager.clientsCount = Math.max( ClientManager.clientsCount - 1, 0 );
		
		ClientManager.CLIENTS.splice( ClientManager.CLIENTS.indexOf( client ), 1 );
		
		Main.io.emit( "join", ClientManager.clientsCount );
		
		Logger.write( Logger.LogType.Event, `[Client] Client disconnected. -> ${ client.name }#${ client.userID }::${ ipAddress } ->>> Total Clients: ${ ClientManager.clientsCount + 1 } -> ${ ClientManager.clientsCount }` );
	}
	
	console.log(ClientManager.IPList);
	console.log(ClientManager.CLIENTS);
}

ClientManager.getCount = function( )
{
	return ClientManager.CLIENTS.length;
}

// ClientManager.ioEventHandler = [];

// socket 에 변수 하나 넣은 후 클라 초기화됫는지 확인 바람;
// client init 확인문 넣기
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
		
		Logger.write( Logger.LogType.Warning, `[Client] Client rejected! -> 'reason: ${ reason.why }' ${ ipAddress }` );
		
		return;
	}
	
	var client = new Client( socket );
	
	ClientManager.IPList.push( ipAddress );
	
	socket.on( "join", ( data ) =>
	{
		if ( data.name == null ) return; // 변경 바람
		
		data.name = data.name.trim( );
		
		var nickNameNoSpace = data.name.replace( " ", "" );
		if ( data.name.length <= 0 || nickNameNoSpace.length < 4 || nickNameNoSpace.length > 10 )
		{
			socket.emit( "loginResult", {
				success: false,
				why: "사용할 수 없는 닉네임을 설정했습니다. (SERVER_REJECT_NICK)"
			} );
			
			Logger.write( Logger.LogType.Warning, `[Client] Client rejected! -> 'reason: NickNameNotValid' 'requested Nick: ${ data.name }' ${ ipAddress }'` );
			
			return;
		}
		
		ClientManager.clientsCount = ClientManager.CLIENTS.length + 1;
		
		Main.io.emit( "join", ClientManager.clientsCount );
		
		
		// under construction;
		// socket.emit( "clientDataRefresh", {
			// command: "register",
			// data: {
				// x: Math.floor( Math.random() * 100 ),
				// y:  Math.floor( Math.random() * 100 )+50,
				// name: "doshigatai"
			// }
		// } );
		
		socket.emit( "loginResult", {
			success: true
		} );
		
		// socket.emit( "music_define", newArr );
		// socket.emit( "music_play" );
		
		client.initialize( data.name, ClientManager.generateUserID( ipAddress ) );
		
		ClientManager.CLIENTS.push( client );
		
		for ( var i = 0; i < ClientManager.hooks.length; i++ )
		{
			ClientManager.hooks[ i ]( socket, client );
		}
		
		// ChatManager.ioEventConnection( socket, client );
		// VoteManager.ioEventConnection( socket, client );
		// FileUploadHandler.ioEventConnection( socket, client );
		// QueueManager.ioEventConnection( socket, client );
		
		Logger.write( Logger.LogType.Event, `[Client] New client connected. -> ${ client.name }#${ client.userID }::${ client.ipAddress } ->>> Total Clients: ${ ClientManager.clientsCount - 1 } -> ${ ClientManager.clientsCount }` );
	} );
	
	// console.log( `[Client] WARNING: Unauthorized client request detected, than rejected. -> 'ipAddress: ${ client.ipAddress }'`.bold.yellow );
	
	// socket.on( "forceDisconnect", ( data ) =>
	// {
		// socket.disconnect( );
	// } );

	socket.on( "disconnect", ( ) =>
	{
		ClientManager.onDisconnect( client, socket );
	} );
}


Main.io.on( "connection", ClientManager.ioEventConnection );

ClientManager.hooks = [ ];

module.exports = ClientManager;