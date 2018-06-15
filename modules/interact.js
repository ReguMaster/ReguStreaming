/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const path = require( "path" );
const Interact = { };
const Main = require( "../app.js" );
const QueueManager = require( "./queue.js" ); // 수정바람
const ClientManager = require( "../client.js" );

const consoleColor = require( "colors" );

var mcMode = false; // mc mode?
var mlMode = false; // ml mode?
var queueDeleteMode = false;
var queueDeleteAllMode = false;
var notiMode = false; // noti mode?

var exitMode = false;

//https://stackoverflow.com/questions/8128578/reading-value-from-console-interactively
process.stdin.addListener( "data", function( data )
{
	var input = data.toString( ).trim( );
	var args = input.split( " " );
	
	// console.log(args);
	
	if ( args.length > 0 )
	{
		switch ( args[ 0 ] )
		{
			case "/kick":
				if ( args[ 1 ] )
				{
					var client = ClientManager.findByIP( args[ 1 ] );
					
					if ( client != null )
					{
						ClientManager.kick( client, args.chain( " ", 2 ) || "관리자에게 문의하세요." );
					}
					else
						console.log ( "Client is not valid!".bold.red );
				}
				else
					console.log ( "Argument 1 is not valid!".bold.red );
				
				break;
			case "/ban":
				if ( args[ 1 ] )
				{
					var client = ClientManager.findByIP( args[ 1 ] );
					
					if ( client != null )
					{
						ClientManager.ban( client, args.chain( " ", 2 ) || "관리자에게 문의하세요." );
					}
					else
						console.log ( "Client is not valid!".bold.red );
				}
				else
					console.log ( "Argument 1 is not valid!".bold.red );
				
				break;
			case "/queue-continue":
				QueueManager.play( );
				
				console.log( "Queue continued.".bold );
				break;
			case "/queue-clear":
				QueueManager.clear( );
				
				if ( args[ 1 ] )
					QueueManager.currentPlayingPos = 10000000; // 무식해;
				
				console.log( "Queue cleared.".bold );
				break;
			case "/queue-removeAt":
				if ( args[ 1 ] && typeof Number( args[ 1 ] ) == "number" && !isNaN( Number( args[ 1 ] ) ) )
				{
					QueueManager.removeAt( Number( args[ 1 ] ) );
				
					console.log( args[ 1 ] + " Queue removed.".bold );
				}
				else
					console.log ( "Argument 1 is not valid!".bold.red );
				
				break;
			case "/video-setpos":
				if ( args[ 1 ] && typeof Number( args[ 1 ] ) == "number" && !isNaN( Number( args[ 1 ] ) ) )
				{
					QueueManager.currentPlayingPos = Number( args[ 1 ] );
				
					console.log( ( "Video setpos -> " + Number( args[ 1 ] ) ).bold );
					
					Main.io.emit( "music_setpos", QueueManager.currentPlayingPos );
				}
				else
					console.log ( "Argument 1 is not valid!".bold.red );
				break;
			case "/notify":
				if ( args[ 1 ] )
				{
					var message = args[ 1 ];
					
					ClientManager.getAll( true ).forEach( function( client, index )
					{
						client.socket.emit( "serverNotification", {
							message: message
						} );
						
						client.socket.emit( "chatReceive", {
							message: "공지 사항 : " + message,
							type: "system",
						} );
					} );
				}
				else
					console.log ( "Argument 1 is not valid!".bold.red );
				
				break;
			case "/exit":
				if ( exitMode )
				{
					process.exit( 0 );
					return;
				}
				
				exitMode = true;
				setTimeout( function( )
				{
					exitMode = false;
				}, 3000 );
				
				console.log( "WARNING: Are you sure? (retype this command)".bold.yellow );
				break;
			case "status":
				console.log( "*SERVER STATUS*".bold );
				console.log( ( "ReguStreaming Server " + Main.config.host + ":" + Main.config.port + " (" + ClientManager.getCount( ) + "/" + ClientManager.maxConnections + ")" ).bold.green );
				
				ClientManager.getAll( ).forEach( function( client, index )
				{
					console.log( ( `${ index } : ${ client.name || "UNKNOWN" } (#${ client.userID || "UNKNOWN" }) ${ client.ipAddress }` ).bold );
				} );
				
				break;
		}
		
	}
	else
	{
		console.log( ( input + " is Missing command identifiaction!" ).bold.red );
	}
	
	// if ( queueDeleteMode )
	// {
		// var index = Number( data.toString( ).trim( ) );
		
		// QueueManager.removeAt( index );
		// console.log( `"${ index } 위치의 큐를 제거했습니다."` );
		// queueDeleteMode = false;
		// return;
	// }
	
	// if ( mlMode )
	// {
		// var loc = Number( data.toString( ).trim( ) );
		// QueueManager.currentPlayingPos = loc;
		// console.log( `"뮤직 Location 완료. ${ loc }"` );
		// mlMode = false;
		
		// Main.io.emit( "music_setpos", QueueManager.currentPlayingPos );
		
		// return;
	// }
	
	// if ( notiMode )
	// {
		// var message = data.toString( ).trim( );
		
		// Main.io.emit( "serverNotification", {
			// message: message
		// } );
		
		// console.log( `"메세지 전송 완료. ${ message }"` );
		// notiMode = false;
		// return;
	// }
	
	// switch( data.toString( ).trim( ) )
	// {
		// case "mc":
			// console.log( "이제 새로운 음악 인덱스를 입력하세요.");
			// mcMode = true;
			// break;
		// case "msl":
			// console.log( "이제 설정할 음악의 위치(초)를 설정하세요.");
			// mlMode = true;
			// break;
		// case "noti":
			// console.log( "이제 알림 메세지를 입력하세요." );
			// notiMode = true;
			// break;
		// case "queueDel":
			// console.log( "이제 제거할 큐의 인덱스를 입력하세요." );
			// queueDeleteMode = true;
			// break;
		// case "queueDelAll":
			// QueueManager.removeAll( );
			// console.log( "모든 큐를 제거했습니다." );
			// break;
		// case "kick":
			// QueueManager.removeAll( );
			// console.log( "모든 큐를 제거했습니다." );
			// break;
		// case "status":
			// console.log( "*SERVER STATUS*".bold );
			// console.log( ( "ReguStreaming Server " + Main.config.host + ":" + Main.config.port + " (" + ClientManager.getCount( ) + "/" + ClientManager.maxConnections + ")" ).bold.green );
			
			// ClientManager.getAll( ).forEach( function( client, index )
			// {
				// console.log( ( `${ index } : ${ client.name || "UNKNOWN" } (#${ client.userID || "UNKNOWN" }) ${ client.ipAddress }` ).bold );
			// } );
			
			// break;
	// }
} );

module.exports = Interact;