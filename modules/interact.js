/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const path = require( "path" );
const Interact = { };
var global = require( "../app.js" );
const musicProvider = require( "./musicprovider.js" );

var mcMode = false; // mc mode?
var mlMode = false; // ml mode?
var notiMode = false; // noti mode?

Interact.test = 0;
//https://stackoverflow.com/questions/8128578/reading-value-from-console-interactively
Interact.main = process.openStdin( ).addListener( "data", function( data )
{
	if ( mcMode )
	{
		musicProvider.currentMusic = musicProvider.musicList[ Number( data.toString( ).trim( ) ) ];
		console.log( `"현재 뮤직 설정 완료. ${ musicProvider.currentMusic.musicName }"` );
		mcMode = false;
		
		musicProvider.MusicPlay( );
		
		return;
	}
	
	if ( mlMode )
	{
		var loc = Number( data.toString( ).trim( ) );
		musicProvider.currentMusicPos = loc;
		console.log( `"뮤직 Location 완료. ${ loc }"` );
		mlMode = false;
		
		global.io.emit( "music_setpos", musicProvider.currentMusicPos );
		
		return;
	}
	
	if ( notiMode )
	{
		var message = data.toString( ).trim( );
		
		global.io.emit( "serverNotification", {
			message: message
		} );
		
		console.log( `"메세지 전송 완료. ${ message }"` );
		notiMode = false;
		return;
	}
		
	switch( data.toString( ).trim( ) )
	{
		case "mc":
			console.log( "이제 새로운 음악 인덱스를 입력하세요.");
			mcMode = true;
			break;
		case "mfp":
			musicProvider.MusicPlay( );
			break;
		case "msl":
			console.log( "이제 설정할 음악의 위치(초)를 설정하세요.");
			mlMode = true;
			break;
		case "noti":
			console.log( "이제 알림 메세지를 입력하세요." );
			notiMode = true;
			break;
	}
} );

module.exports = Interact;