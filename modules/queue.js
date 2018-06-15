/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const QueueManager = { };
const path = require( "path" );
const Main = require( "../app.js" );
const ClientManager = require( "../client.js" );
const YoutubeConverter = require( "horizon-youtube-mp3" );
const url = require( "url" );
const querystring = require( "querystring" );
const fileStream = require( "fs" );
const util = require( "util" );
const Logger = require( "./logger.js" );

QueueManager.test = 0;
QueueManager._queueList = [ ];
QueueManager._recentClientList = [ ];
QueueManager.currentQueueData = { };
QueueManager.currentPlayingPos = 0;

QueueManager.config = {
	DELAY: 1000 * 0, // 수정 바람
	MAX_DURATION: 420,
	DIRECTORY: path.join( __dirname, "../public/youtube_sounds" ),
	FILEFORMAT: "yt_%s.mp3"
}

QueueManager.getYoutubeHighQualityResource = function( client, data )
{
	try
	{
		var highQualityValue = 0;
		var highQualityIndexValue;
		
		data.videoFormats.forEach( ( value, index, ar ) =>
		{
			if ( value.quality_label )
			{
				if ( highQualityValue < Number( value.quality_label.replace( "p", "" ) ) )
				{
					highQualityValue = Number( value.quality_label.replace( "p", "" ) );
					highQualityIndexValue = value;
				}
			}
		} );
		
		// *해결*
		// 가끔 url 없어서 터짐..
		// https://www.youtube.com/watch?v=UpxX86eXQtI&list=FLqSiujw1tboyUDWc50UKrkA&t=0s&index=2
		if ( highQualityIndexValue == null )
		{
			highQualityValue = 0;
			
			data.videoFormats.forEach( ( value, index, ar ) =>
			{
				if ( value.resolution )
				{
					if ( highQualityValue < Number( value.resolution.replace( "p", "" ) ) )
					{
						highQualityValue = Number( value.resolution.replace( "p", "" ) );
						highQualityIndexValue = value;
					}
				}
			} );
		}
		
		return {
			videoThumb: data.videoThumbList[ data.videoThumbList.length - 1 ].url,
			videoFile: highQualityIndexValue.url
		}
	}
	catch ( exception )
	{
		Logger.write( Logger.LogType.Error, `[Queue] ERROR: Unknown server process error. -> (Error: ${ exception.stack })'` );
		
		ClientManager.getAll( true ).forEach( ( client2, index2, ar ) =>
		{
			client2.socket.emit( "serverErrorNotify", {
				why: "알 수 없는 서버 처리 오류가 발생했습니다, 관리자에게 보고해주세요.<br />" + exception.stack
			} );
		} );
		
		return {
			videoThumb: "images/nanachi.png",
			videoFile: ""
		}
	}
}

QueueManager.register = function( client, socket, url, videoID, callback )
{
	var queueData = { };
	var fileName = util.format( QueueManager.config.FILEFORMAT, videoID );
	var fileLocation = path.join( QueueManager.config.DIRECTORY, fileName );
	
	if ( fileStream.existsSync( fileLocation ) ) // file is exists?
	{
		YoutubeConverter.getInfo( url, function( err, data )
		{
			if ( err == null )
			{
				if ( !data.isValid )
				{
					socket.emit( "queueRegisterReceive", {
						success: false,
						why: "영상 큐에 추가할 수 없습니다. (REJECT_SERVER_ERROR)"
					} );
				
					Logger.write( Logger.LogType.Warning, `[Queue] Client queue register request rejected! -> (Not Valid) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
					return;
				}
				
				if ( Number( data.videoTimeSec ) > QueueManager.config.MAX_DURATION )
				{
					socket.emit( "queueRegisterReceive", {
						success: false,
						why: "영상 큐에 추가할 수 없습니다. (REJECT_TIME_OVER)"
					} );
				
					Logger.write( Logger.LogType.Warning, `[Queue] Client queue register request rejected! -> (Overtimed) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
					return;
					
				}
				
				var highQualityResources = QueueManager.getYoutubeHighQualityResource( client, data );
				
				queueData.videoName = data.videoName;
				queueData.videoArtist = "Youtube";
				queueData.videoThumb = highQualityResources.videoThumb, // 큰 이미지
				queueData.videoLength = Number( data.videoTimeSec );
				queueData.videoFile = highQualityResources.videoFile;
				queueData.soundFile = path.join( "youtube_sounds", fileName );
				queueData.owner = client.name + "#" + client.userID;
				
				socket.emit( "queueRegisterReceive", {
					success: true
				} );
				
				// if ( !QueueManager.isEmpty( ) )
				// {
					
				// }
				
				ClientManager.getAll( true ).forEach( ( client2, index2, ar ) =>
				{
					client2.socket.emit( "queueEvent", {
						type: "register",
						videoName: queueData.videoName,
						videoThumb: queueData.videoThumb,
						videoLength: queueData.videoLength,
						owner: queueData.owner
					} );
					
					client2.socket.emit( "chatReceive", {
						message: queueData.videoName + " 영상이 목록에 추가되었습니다. (by " + client.name + "#" + client.userID + ")",
						type: "system",
					} );
				} );
				
				QueueManager._queueList.push( queueData );
				
				Logger.write( Logger.LogType.Event, `[Queue] Queue register. ${ url } -> ${ client.name }#${ client.userID }::${ client.ipAddress }` );
			}
			else
			{
				if ( err == "errorOnGetInfo." )
				{
					socket.emit( "queueRegisterReceive", {
						success: false,
						why: "영상 큐에 추가할 수 없습니다. (REJECT_YOUTUBE_ACCESS_ERROR)"
					} );
				
					Logger.write( Logger.LogType.Error, `[Queue] Client queue register request failed to process! -> (Error: ${ err }) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
				
					return;
				}
				
				socket.emit( "queueRegisterReceive", {
					success: false,
					why: "영상 큐에 추가할 수 없습니다. (REJECT_SERVER_ERROR)"
				} );
				
				Logger.write( Logger.LogType.Error, `[Queue] Client queue register request failed to process! -> (Error: ${ err }) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
			}
		} );
	}
	else
	{
		YoutubeConverter.getInfo( url, function( err, data )
		{
			if ( err == null )
			{
				if ( !data.isValid )
				{
					socket.emit( "queueRegisterReceive", {
						success: false,
						why: "영상 큐에 추가할 수 없습니다. (REJECT_SERVER_ERROR)"
					} );
				
					Logger.write( Logger.LogType.Warning, `[Queue] Client queue register request rejected! -> (Not Valid) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
					return;
				}
				
				if ( Number( data.videoTimeSec ) > QueueManager.config.MAX_DURATION )
				{
					socket.emit( "queueRegisterReceive", {
						success: false,
						why: "영상 큐에 추가할 수 없습니다. (REJECT_TIME_OVER)"
					} );
				
					Logger.write( Logger.LogType.Warning, `[Queue] Client queue register request rejected! -> (Overtimed) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
					return;
				}
				
				var highQualityResources = QueueManager.getYoutubeHighQualityResource( client, data );
					
				queueData.videoName = data.videoName;
				queueData.videoArtist = "Youtube";
				queueData.videoThumb = highQualityResources.videoThumb, // 큰 이미지
				queueData.videoLength = Number( data.videoTimeSec );
				queueData.videoFile = highQualityResources.videoFile;
				queueData.soundFile = path.join( "youtube_sounds", fileName );
				queueData.owner = client.name + "#" + client.userID;
				
				socket.emit( "queueRegisterReceive", {
					success: true
				} );
				
				ClientManager.getAll( true ).forEach( ( client2, index2, ar ) =>
				{
					client2.socket.emit( "queueEvent", {
						type: "register",
						videoName: queueData.videoName,
						videoThumb: queueData.videoThumb,
						videoLength: queueData.videoLength,
						owner: queueData.owner
					} );
					
					client2.socket.emit( "chatReceive", {
						message: queueData.videoName + " 영상이 목록에 추가되었습니다. (by " + client.name + "#" + client.userID + ")",
						type: "system",
					} );
				} );
				
				YoutubeConverter.downloadToLocal( url, QueueManager.config.DIRECTORY, fileName, null, null, function( )
				{
					QueueManager._queueList.push( queueData );
				}, function( percent, timemark, targetSize )
				{
					Logger.write( Logger.LogType.Info, `[Queue] Queue convert process ... ${ url } -> ${ percent }%` );
				} );
				
				Logger.write( Logger.LogType.Event, `[Queue] Queue register. ${ url } -> ${ client.name }#${ client.userID }::${ client.ipAddress }` );
			}
			else
			{
				if ( err == "errorOnGetInfo." )
				{
					socket.emit( "queueRegisterReceive", {
						success: false,
						why: "영상 큐에 추가할 수 없습니다. (REJECT_YOUTUBE_ACCESS_ERROR)"
					} );
				
					Logger.write( Logger.LogType.Error, `[Queue] Client queue register request failed to process! -> (Error: ${ err }) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
				
					return;
				}
				
				socket.emit( "queueRegisterReceive", {
					success: false,
					why: "영상 큐에 추가할 수 없습니다. (REJECT_SERVER_ERROR)"
				} );
				
				Logger.write( Logger.LogType.Error, `[Queue] Client queue register request failed to process! -> (Error: ${ err }) ${ client.name }#${ client.userID }::${ client.ipAddress }` );
			}
		} );
	}
	
	QueueManager.registerTimeDelay( client, QueueManager.config.DELAY );
}

QueueManager.clear = function( )
{
	QueueManager._queueList = [ ];
	
	ClientManager.getAll( true ).forEach( ( client, index, ar ) =>
	{
		client.socket.emit( "queueEvent", {
			type: "dataReq",
			queueList: QueueManager._queueList
		} );
	} );
}

QueueManager.removeAt = function( index )
{
	if ( index >= 0 && index < QueueManager._queueList.length )
	{
		QueueManager._queueList.splice( index, 1 );
		
		ClientManager.getAll( true ).forEach( ( client2, index2, ar ) =>
		{
			client2.socket.emit( "queueEvent", {
				type: "dataReq",
				queueList: QueueManager._queueList
			} );
		} );
	}
}

QueueManager.removeAll = function( )
{
	QueueManager._queueList = [ ];
	
	ClientManager.getAll( true ).forEach( ( client, index, ar ) =>
	{
		client.socket.emit( "queueEvent", {
			type: "dataReq",
			queueList: [ ]
		} );
	} );
}

QueueManager.removeFirst = function( )
{
	if ( QueueManager._queueList.length > 0 ) // 수정 바람
	{
		QueueManager._queueList.splice( 0, 1 );
		
		ClientManager.getAll( true ).forEach( ( client, index, ar ) =>
		{
			client.socket.emit( "queueEvent", {
				type: "removeRecent"
			} );
		} );
	}
}

QueueManager.isEmpty = function( )
{
	return QueueManager._queueList.length == 0;
}

QueueManager.tickTok = function( )
{
	// if ( QueueManager.isEmpty( ) )
	// {
		// console.log("empty!");
		// return;
	// }
	
	
	if ( !QueueManager.isEmpty( ) && !QueueManager.currentQueueData.videoLength )
	{
		QueueManager.play( );
		return;
	}
	else if ( QueueManager.isEmpty( ) && !QueueManager.currentQueueData.videoLength )
	{
		return;
	}
	
	
	// console.log(QueueManager.currentQueueData);
	// console.log( QueueManager.currentPlayingPos + "/" + QueueManager.currentQueueData.videoLength + " -> Tick!");
	
	if ( QueueManager.currentQueueData.videoLength <= QueueManager.currentPlayingPos - 3 ) // 3초 딜레이
	{
		if ( QueueManager.isEmpty( ) )
		{
			QueueManager.currentQueueData = { };
			ClientManager.getAll( true ).forEach( ( client, index, ar ) =>
			{
				client.socket.emit( "music_define", { empty: true } );
			} );
			
			return;
		}
		
		QueueManager.play( );
		return;
	}
	
	QueueManager.currentPlayingPos++;
}

setInterval( QueueManager.tickTok, 1000 );

// var urlParsedObj = url.parse("https://www.youtube.com/watch?v=A8KrxWUnsWo");
// var querystringParsedObj = querystring.parse(urlParsedObj.query);
// console.log(querystringParsedObj);

QueueManager.play = function( )
{
	if ( QueueManager.isEmpty( ) )
	{
		console.log( `[Queue] Failed to play Queue. (is empty!)`.bold.yellow );
		return;
	}
	
	// try
	// {
		
		
	// }
	// catch ( exception )
	// {
		// console.log( `[Queue] Failed to play Queue. (Error: ${ exception })`.bold.red );
	// }
	
	var recentQueue = QueueManager._queueList[ 0 ];
	
	QueueManager.currentQueueData = recentQueue;
	QueueManager.currentPlayingPos = 0;
	
	var newArr = Object.assign( { }, QueueManager.currentQueueData );
	newArr.musicPos = QueueManager.currentPlayingPos;
	
	ClientManager.getAll( true ).forEach( ( client, index, ar ) =>
	{
		client.socket.emit( "music_define", newArr );
		client.socket.emit( "music_play" );
		
		client.socket.emit( "chatReceive", {
			message: QueueManager.currentQueueData.videoName + " 음악을 재생합니다.",
			type: "system",
		} );
	} );
	
	Logger.write( Logger.LogType.Event, `[Queue] Queue played. ${ recentQueue.owner } -> ${ recentQueue.videoName }` );
	
	QueueManager.removeFirst( );
}

QueueManager.registerTimeDelay = function( client, delay )
{
	QueueManager.removeTimeDelay( client ); // 이미 있는 경우 처리
	
	QueueManager._recentClientList.push( {
		identification: client.ipAddress,
		delay: Date.now( ) + delay,
		lastQueueRequest: null // TODO;
	} );
}

QueueManager.isOnTimeDelay = function( client, checkDelay )
{
	for ( var i = 0; i < QueueManager._recentClientList.length; i++ )
	{
		if ( QueueManager._recentClientList[ i ].identification == client.ipAddress )
		{
			if ( checkDelay )
			{
				if ( Date.now( ) >= QueueManager._recentClientList[ i ].delay ) return false;
				else return true;
			}
			else
				return true;
		}
	}
	
	return false;
}

QueueManager.removeTimeDelay = function( client )
{
	for ( var i = 0; i < QueueManager._recentClientList.length; i++ )
	{
		if ( QueueManager._recentClientList[ i ].identification == client.ipAddress )
		{
			QueueManager._recentClientList.splice( i, 1 );
			break;
		}
	}
}

QueueManager.preQueueRegister = function( socket, client, data )
{
	if ( !QueueManager.isEmpty( ) && QueueManager.isOnTimeDelay( client, true ) )
	{
		return {
			accept: false,
			why: "영상 큐에 추가할 수 없습니다. (REJECT_DELAY_ERROR)"
		};
	}
	
	if ( data.url.trim( ).length <= 0 )
	{
		return {
			accept: false,
			why: "영상 큐에 추가할 수 없습니다. (REJECT_DATA_STRUCT_ERROR)"
		};
	}
	
	try
	{
		var urlParsed = url.parse( data.url );
		
		if ( urlParsed != null )
		{
			var query = querystring.parse( urlParsed.query );
			
			if ( query != null )
			{
				return {
					accept: true,
					newURL: "https://www.youtube.com/watch?v=" + query.v,
					videoID: query.v
				};
			}
			else
			{
				return {
					accept: false,
					why: "영상 큐에 추가할 수 없습니다. (REJECT_URL_STRUCT_ERROR)"
				};
			}
		}
		else
		{
			return {
				accept: false,
				why: "영상 큐에 추가할 수 없습니다. (REJECT_URL_STRUCT_ERROR)"
			};
		}
	}
	catch ( exception )
	{
		console.log( `[Queue] ERROR: Unknown server process error. -> (Error: ${ exception.stack })'`.bold.red );
		
		ClientManager.getAll( true ).forEach( ( client2, index2, ar ) =>
		{
			client2.socket.emit( "serverErrorNotify", {
				why: "알 수 없는 서버 처리 오류가 발생했습니다, 관리자에게 보고해주세요.<br />" + exception.stack
			} );
		} );
		
		return {
			accept: false,
			why: "영상 큐에 추가할 수 없습니다. (REJECT_URL_STRUCT_ERROR)"
		};
	}
	
	// if ( url.host == "www.youtube.com"
	// url.parse( url )
}

//QueueManager.ioEventConnection
ClientManager.hooks.push( function( socket, client )
{
	socket.emit( "queueEvent", {
		type: "dataReq",
		queueList: QueueManager._queueList
	} );
	
	var newArr = Object.assign( { }, QueueManager.currentQueueData );
	newArr.musicPos = QueueManager.currentPlayingPos;
	
	if ( QueueManager.currentQueueData.videoLength == null )
	{
		newArr.empty = true;
		socket.emit( "music_define", newArr );
	}
	else
	{
		socket.emit( "music_define", newArr );
		socket.emit( "music_play" );
	}
	
	
	socket.on( "queueRegister", function( data )
	{
		data.url = data.url.trim( );
		
		var reason = QueueManager.preQueueRegister( socket, client, data );
		
		if ( !reason.accept )
		{
			socket.emit( "queueRegisterReceive", {
				success: false,
				why: reason.why
			} );
			
			console.log( `[Queue] Client queue register request rejected! -> 'reason: ${ reason.why }' ${ client.name }#${ client.userID }::${ client.ipAddress }`.bold.yellow );
			return;
		}
		
		QueueManager.register( client, socket, reason.newURL, reason.videoID );
	} );
	
	socket.on( "queueDataRequest", function( data )
	{
		socket.emit( "queueEvent", {
			type: "dataReq"
			
		} );
	} );
} );

module.exports = QueueManager;