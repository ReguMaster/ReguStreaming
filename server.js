/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use struct'

const Server = {};
const App = require( "./app" );
const util = require( "./util" );
const hook = require( "./hook" );
const Logger = require( "./modules/logger" );
const Client = require( "./client" );
const Tracker = require( "./modules/tracker" );
const Discord = require( "discord.js" );
const apiConfig = require( "./const/config" );

Server.CONN = [ ];
Server.CLIENT = {};
Server.ROOM = {};
Server.QUEUE = {};
Server.MANAGEMENT_CONSOLE = [ ];
Server.DiscordClient = new Discord.Client( );
Server.discordInitialized = false;
Server.discordChannelType = {
    Queue: 0
};
Server.discordChannelList = {
    "center": "474566071941201941",
    "everync": "474608399586426921",
    "24hourjapan": "474608432867967006"
}

Server.emitDiscord = function( channelType, message )
{
    if ( !this.discordInitialized ) return;

    if ( typeof channelType === "string" )
    {
        var channelID = this.discordChannelList[ channelType ];

        if ( channelID )
            this.DiscordClient.channels.get( channelID )
            .send( message );
    }
    else
    {
        if ( channelType === this.discordChannelType.Queue )
            this.DiscordClient.channels.get( "474554785459208195" )
            .send( message );
    }
}

// *TODO : 성능 하락 이슈가 있을 수 있음. (deepCopy)
Server.getRoomDataForClient = function( )
{
    var roomData = util.deepCopy( this.ROOM );
    var queueData = util.deepCopy( this.QUEUE );

    var keys = Object.keys( roomData );
    var keysLength = keys.length;

    for ( var i = 0; i < keysLength; i++ )
    {
        delete roomData[ keys[ i ] ].onConnect;
        delete roomData[ keys[ i ] ].config;

        roomData[ keys[ i ] ].count = this.getRoomClientCount( keys[ i ] );

        if ( !util.isEmpty( queueData[ keys[ i ] ].currentPlayingQueue ) )
            roomData[ keys[ i ] ].currentPlaying = queueData[ keys[ i ] ].currentPlayingQueue.mediaName;
    }

    return roomData;
}

Server.createRoom = function( isOfficial, roomID, title, desc, maxConnectable, onConnect, config )
{
    this.ROOM[ roomID ] = {
        roomID: roomID,
        isOfficial: isOfficial,
        title: title,
        desc: desc,
        maxConnectable: maxConnectable,
        onConnect: onConnect,
        config: config
    };

    this.QUEUE[ roomID ] = {
        queueList: [ ],
        currentPlayingQueue:
        {},
        currentPlayingPos: 0
    };

    this.CLIENT[ roomID ] = [ ];

    App.redisClient.get( "RS.QUEUE." + roomID + ".queueList", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            Server.QUEUE[ roomID ].queueList = JSON.parse( result );
            Logger.write( Logger.LogType.Info, `[Queue] [${ roomID }] queueList overridden from RedisDB.` );
        }
        catch ( exception )
        {
            Logger.write( Logger.LogType.Warning, `[Queue] Failed to fetch [${ roomID }] queueList from RedisDB! (err:${ err })` );
        }
    } );

    App.redisClient.get( "RS.QUEUE." + roomID + ".currentPlayingQueue", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            Server.QUEUE[ roomID ].currentPlayingQueue = JSON.parse( result );
            Logger.write( Logger.LogType.Info, `[Queue] [${ roomID }] currentPlayingQueue overridden from RedisDB.` );
        }
        catch ( exception )
        {
            Logger.write( Logger.LogType.Warning, `[Queue] Failed to fetch [${ roomID }] currentPlayingQueue from RedisDB! (err:${ err })` );
        }
    } );

    App.redisClient.get( "RS.QUEUE." + roomID + ".currentPlayingPos", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            Server.QUEUE[ roomID ].currentPlayingPos = Number( result ) || 0;
            Logger.write( Logger.LogType.Info, `[Queue] [${ roomID }] currentPlayingPos overridden from RedisDB.` );
        }
        catch ( exception )
        {
            Logger.write( Logger.LogType.Warning, `[Queue] Failed to fetch [${ roomID }] currentPlayingPos from RedisDB! (err:${ err })` );
        }
    } );
}

// Server.getRoomClient = function(roomID)
// {
//     return this.ROOM[roomID].clients;
// }

hook.register( "Initialize", function( )
{
    Server.createRoom( true, "center", "빅 홀 오스", "많은 사람들이 거주하는 마을입니다.", 5000, null,
    {
        video_position_bar_color: "rgba( 0, 255, 231, 0.3 )",
        video_position_bar_full_color: "rgba( 0, 255, 231, 1 )"
    } );
    Server.createRoom( true, "home", "벨 시에로 보육원", "안전하고 신성한 공간.", 15 );
    Server.createRoom( true, "everync", "나이트코어 어비스", "모든 영상이 나이트코어 스타일로 재생됩니다.", 50, null,
    {
        playbackRate: 1.15,
        video_position_bar_color: "rgba( 49, 226, 79, 0.3 )",
        video_position_bar_full_color: "rgba( 49, 226, 79, 1 )"
    } );
    Server.createRoom( true, "24hourjapan", "24시간 일본곡", "24시간 동안 일본 노래가 재생됩니다.", 50, null,
    {
        disallow_queue_request: true,
        video_position_bar_color: "rgba( 247, 247, 150, 0.3 )",
        video_position_bar_full_color: "rgba( 247, 247, 150, 1 )"
    } );

    Server.roomCreated = true;

    hook.run( "OnCreateOfficialRoom", Server.ROOM );
} );

Server.DiscordClient.on( "ready", function( )
{
    Logger.write( Logger.LogType.Info, `[Discord] Logged in as ${ Server.DiscordClient.user.tag }.` );

    hook.run( "PostReadyDiscordClient" );

    Server.discordInitialized = true;
} );

Server.DiscordClient.on( "message", function( message )
{
    if ( !message.guild ) return;
    if ( message.author.id === "474541831867072512" ) return;

    Server.discordChannelList.some( ( v, i ) =>
    {
        if ( v === message.channel.id )
        {
            Server.sendMessage( i, "regu.chat",
            {
                profileImage: message.author.avatarURL,
                name: message.author.username + "#Discord",
                userID: "discord",
                message: message.content
            } );

            return true;
        }
    } )

    hook.run( "PostDiscordMessage", message );
} );

// Server.DiscordClient.login( apiConfig.DISCORD_BOT_TOKEN );

hook.register( "PostClientConnected", function( client, socket )
{
    if ( client.room === "everync" )
    {
        client.emit( "RS.modal",
        {
            title: "채널 안내",
            message: "이 채널에서는 모든 영상이 나이트코어 스타일로 재생됩니다."
        } );
    }
    // else if ( client.room === "karaoke" )
    // {
    //     client.emit( "RS.modal",
    //     {
    //         title: "채널 안내",
    //         message: "이 채널에서는 영상을 신청한 사람이 노래를 부르고 다른 사람이 청취합니다."
    //     } );

    //     Server.executeClientJavascript( client.room, `window.open( "https://discord.gg/FwhwucD" )` );
    // }
} );

Server.getAllClient = function( roomID )
{
    if ( roomID )
    {
        if ( !this.ROOM[ roomID ] )
            return [ ]; // *TODO: 경우에 따라 수정 바람

        return this.CLIENT[ roomID ];
    }
    else
    {
        var result = [ ];

        util.forEach( this.CLIENT, ( client ) =>
        {
            result = result.concat( client );
        } );

        return result;
    }
}

Server.isValidRoom = function( roomID )
{
    if ( !this.ROOM[ roomID ] ) return false;

    return true;
}

Server.getRoom = function( roomID )
{
    return this.ROOM[ roomID ] || null;
}

Server.getClientBySessionID = function( sessionID )
{
    var result;

    util.forEach( this.CLIENT, ( clientList ) =>
    {
        clientList.some( ( client ) =>
        {
            if ( sessionID === client.socket.handshake.sessionID )
            {
                result = client;
                return client;
            }
        } );
    } );

    return result;
}

Server.getClientByUserID = function( userID )
{
    var result;

    util.forEach( this.CLIENT, ( clientList ) =>
    {
        clientList.some( ( client ) =>
        {
            if ( userID === client.userID )
            {
                result = client;
                return client;
            }
        } );
    } );

    return result;
}

Server.getClientByIPAddress = function( ipAddress )
{
    var result;

    util.forEach( this.CLIENT, ( clientList ) =>
    {
        clientList.some( ( client ) =>
        {
            if ( ipAddress === client.ipAddress )
            {
                result = client;
                return client;
            }
        } );
    } );

    return result;
}

Server.getClientByProperty = function( property, propertyValue )
{
    var result;

    util.forEach( this.CLIENT, ( clientList ) =>
    {
        clientList.some( ( client ) =>
        {
            if ( propertyValue === client[ property ] )
            {
                result = client;
                return client;
            }
        } );
    } );

    return result;
}

Server.getRoomConfig = function( roomID, configName, defaultValue )
{
    if ( !this.ROOM[ roomID ] ) return defaultValue;
    var configs = this.ROOM[ roomID ].config;

    if ( !configs ) return defaultValue;

    return configs[ configName ] !== undefined ? configs[ configName ] : defaultValue;
}

Server.isAlreadyConnected = function( passportID, sessionID, ipAddress )
{
    var length = this.CONN.length;

    for ( var i = 0; i < length; i++ )
    {
        var data = this.CONN[ i ];

        if ( data.sessionID === sessionID || data.passport.user.id === passportID || data.ipAddress === ipAddress )
            return true;
    }

    return false;
}

Server.sendMessage = function( roomID, id, data )
{
    if ( roomID === null || roomID === undefined ) // 전부 전송
    {
        var keys = Object.keys( this.CLIENT );
        var keysLength = keys.length;

        for ( var i = 0; i < keysLength; i++ )
            this.CLIENT[ keys[ i ] ].forEach( ( client ) => client.emit( id, data ) );
    }
    else
    {
        if ( !this.CLIENT[ roomID ] ) return;

        this.CLIENT[ roomID ].forEach( ( client ) => client.emit( id, data ) );
    }
}

Server.registerConnList = function( socket )
{
    this.CONN.push(
    {
        passport: socket.handshake.session.passport,
        sessionID: socket.handshake.sessionID,
        ipAddress: socket.handshake.address
    } );
}

Server.removeAtConnList = function( client )
{
    var length = this.CONN.length;
    var sessionID = client.socket.handshake.sessionID;
    var passportID = client.getPassportField( "id" );
    // var ipAddress = client.getPassportField( "id" ); // 아이피는 중복될 수 있으므로 하지 않음.

    for ( var i = 0; i < length; i++ )
    {
        var data = this.CONN[ i ];

        if ( data.sessionID === sessionID || data.passport.user.id === passportID )
        {
            this.CONN.splice( i, 1 );
            return;
        }
    }
}

Server.getAllCount = function( )
{
    var keys = Object.keys( this.ROOM );
    var keysLength = keys.length;
    var sum = 0;

    for ( var i = 0; i < keysLength; i++ )
        sum += this.CLIENT[ keys[ i ] ].length;

    return sum;
}

Server.executeClientJavascript = function( roomID, code )
{
    this.sendMessage( roomID, "regu.executeJavascript", code );
}

Server.getRoomClientCount = function( roomID )
{
    return this.CLIENT[ roomID ] ? this.CLIENT[ roomID ].length : 0;
}

Server.isConnectable = function( roomID, sessionID, userID, ipAddress, countryCode )
{
    var onConnect = hook.run( "OnClientConnect", ipAddress, userID, roomID );

    if ( onConnect && onConnect.accept === false )
    {
        return {
            accept: false,
            critical: true,
            reason: onConnect.reason
        };
    }

    if ( this.isAlreadyConnected( userID, sessionID, ipAddress ) )
    {
        return {
            accept: false,
            reason: "다른 계정 또는 세션에서 이미 접속 중입니다."
        };
    }

    if ( !this.ROOM[ roomID ] )
    {
        return {
            accept: false,
            reason: "올바른 채널을 선택하지 않았습니다."
        };
    }
    else
    {
        // if ( ServiceManager.blockRoom.indexOf( roomID ) > -1 )
        // {
        //     return {
        //         accept: false,
        //         reason: "현재 일시적으로 해당 채널에 접속할 수 없습니다."
        //     };
        // }

        var onRoomConnect = this.ROOM[ roomID ].onConnect;

        if ( onRoomConnect )
        {
            var result = onRoomConnect( ipAddress );

            if ( typeof result === "boolean" && !result )
            {
                return {
                    accept: false,
                    reason: "해당 채널을 접속할 수 있는 권한이 없습니다."
                };
            }
            else if ( typeof result === "object" && !result.access )
            {
                return {
                    accept: false,
                    reason: result.reason || "해당 채널을 접속할 수 있는 권한이 없습니다."
                };
            }
        }
    }

    if ( this.CLIENT[ roomID ].length >= this.ROOM[ roomID ].maxConnectable )
    {
        return {
            accept: false,
            reason: "해당 채널을 수용할 수 있는 최대 접속 인원 수를 초과했습니다."
        };
    }

    // if ( countryCode === "ERROR" ) // 데이터베이스 관련 오류로인해 일단 허용할경우.
    // {
    //     Logger.write( Logger.LogType.Important, `[Client] Client login request -> Countrycode is error, but allow. ${ ipAddress } ${ countryCode }` );
    //     // socket.emit( "regu.notification",
    //     // {
    //     //     type: 1,
    //     //     title: "데이터베이스 오류 :",
    //     //     time: 2000,
    //     //     message: "데이터베이스 오류가 발생했습니다, 이 문제가 관리자에게 보고되었습니다."
    //     // } );
    // }
    // else
    // {
    //     if ( countryCode !== "KR" )
    //     {
    //         return {
    //             accept: false,
    //             reason: "이 지역에서는 접속하실 수 없습니다."
    //         };
    //     }
    // }

    return {
        accept: true
    }
}

Server.onConnect = function( socket )
{
    // *TODO: 여기에 룸 체크 다시하기 -> 필요 없을 수 있음.
    var roomID = socket.handshake.session.roomID;

    if ( !Server.roomCreated )
    {
        console.log( "WARNING!" );
        socket.disconnect( );
        return;
    }

    if ( !this.ROOM[ roomID ] ) // *오류: 가끔 room Initialize 보다 먼저 클라이언트가 들어올 시 룸 데이터가 없으므로 오류가 발생함.
    {
        console.log( "WARNING!" );
        socket.disconnect( );
        return;
    }

    var client = new Client( socket );
    client.initialize( roomID, this.ROOM[ roomID ].config );

    this.CLIENT[ roomID ].push( client );
    this.registerConnList( socket );

    // *TODO: 최적화 필요. clientCountUpdate
    this.sendMessage( client.room, "regu.clientCountUpdate",
    {
        count: this.getRoomClientCount( roomID ),
        roomTitle: this.ROOM[ roomID ].title
    } );

    socket.reguClient = client;
    socket.emit( "RS.joinResult" );

    hook.run( "PostClientConnected", client, socket );

    var allClientCount = this.getAllCount( );
    var roomClientCount = this.getRoomClientCount( client.room );

    Logger.write( Logger.LogType.Event, `[Client] New client connected to '${ client.room }' -> ${ client.information( false ) } ->>> room: ${ roomClientCount - 1 } -> ${ roomClientCount } all: ${ allClientCount }` );

    return client;
}

Server.onDisconnect = function( client )
{
    if ( client )
    {
        var roomID = client.room;

        this.removeAtConnList( client );
        this.CLIENT[ roomID ].splice( this.CLIENT[ roomID ].indexOf( client ), 1 );
        // this.CLIENT.splice( this.CLIENT.indexOf( client ), 1 );

        // *TODO: 최적화 필요. clientCountUpdate
        this.sendMessage( client.room, "regu.clientCountUpdate",
        {
            count: this.getRoomClientCount( roomID ),
            roomTitle: this.ROOM[ roomID ].title
        } );

        hook.run( "ClientDisconnected", client );

        var allClientCount = this.getAllCount( );
        var roomClientCount = this.getRoomClientCount( roomID );

        Logger.write( Logger.LogType.Event, `[Client] Client disconnected from '${ client.room }' ${ client.information( false ) } ->>> room: ${ roomClientCount + 1 } -> ${ roomClientCount } all: ${ allClientCount }` );
    }
}

Server.joinRoom = function( roomID, req, res, ipAddress )
{
    var preClientConnect = hook.run( "PreClientConnect", ipAddress );

    req.session.touch( );

    if ( preClientConnect && preClientConnect.accept === false )
    {
        res.redirect( "/?error=" + preClientConnect.reason );
        Logger.write( Logger.LogType.Warning, `[Client] Client pre rejected! -> (#${ preClientConnect.reason }) ${ ipAddress }` );
        return;
    }

    Tracker.getCountryCode( ipAddress, function( countryCode )
    {
        var isConnectable = Server.isConnectable( roomID, req.sessionID, req.user.id, ipAddress, countryCode );

        if ( !isConnectable.accept )
        {
            res.redirect( "/?error=" + isConnectable.reason );
            Logger.write( Logger.LogType.Warning, `[Client] Client rejected! -> (#${ isConnectable.reason }) ${ ipAddress }` );
            return;
        }

        res.render( "player",
        {
            roomID: roomID
        } );
    } );
}

Server.commandProcess = function( commandFullBody )
{
    var commandList = commandFullBody.split( " " );

    if ( commandList.length <= 0 ) return;

    var command = commandList[ 0 ].toString( )
        .trim( )
        .toLowerCase( )

    if ( Server.COMMAND[ command ] )
    {
        var result = Server.COMMAND[ command ]( commandList );

        if ( result && typeof result === "string" )
        {
            process.send(
            {
                type: "commandResultAlert",
                command: command,
                message: result
            } );
        }
    }
    else
        console.log( `[Server] Unknown command '${ command }'` );
}

App.socketIO.on( "connect", function( socket )
{
    var client;

    socket.on( "RS.join", function( data )
    {
        client = Server.onConnect( socket );
    } );

    socket.on( "disconnect", function( data )
    {
        Server.onDisconnect( client );
    } );

    socket.on( "forceDisconnect", function( data )
    {
        socket.disconnect( );
    } );

    socket.on( "RS.requestClientCount", function( data )
    {
        // console.log( "ping pong" );
        // Server.sendMessage( client.room, "regu.clientCountUpdate",
        // {
        //     count: Server.getRoomClientCount( roomID ),
        //     roomTitle: Server.ROOM[ roomID ].title
        // } );
    } );

    socket.on( "regu.requestUserInfo", function( data )
    {
        if ( !util.isValidSocketData( data,
            {
                userID: "string"
            } ) )
        {
            Logger.write( Logger.LogType.Important, `[Client] UserInfo request rejected! -> (#DataIsNotValid) ${ client.information() }` );
            return;
        }

        var targetClient = Server.getClientByUserID( data.userID, client.room );

        if ( targetClient && targetClient.initialized )
        {
            if ( targetClient.room !== client.room )
            {
                Logger.write( Logger.LogType.Important, `[Client] WARNING! : UserInfo request -> (#TargetClientRoomAndClientRoomMismatch) ${ client.information( ) }` );
            }

            Logger.write( Logger.LogType.Info, `[Client] Client requested another Client information. ${ client.information( ) } ---> ${ targetClient.information( ) }` );

            socket.emit( "regu.receiveUserInfo",
            {
                success: true,
                name: targetClient.name,
                ipAddress: util.censorshipIP( targetClient.ipAddress ),
                avatar: targetClient.getPassportField( "avatarFull", "/images/avatar/guest_184.png" ), // *TODO: 네이버 아이디 지원바람;
                rank: targetClient.rank,
                provider: targetClient.provider
            } );
        }
        else
        {
            socket.emit( "regu.receiveUserInfo",
            {
                success: false
            } );
        }
    } );
} );

App.socketIO.set( "authorization", function( handshakeData, next )
{
    //use handshakeData to authorize this connection
    //Node.js style "cb". ie: if auth is not successful, then cb('Not Successful');
    //else cb(null, true); //2nd param "true" matters, i guess!!
    next( null, true );
} );

module.exports = Server;

// const util = require( "./util" );

const QueueManager = require( "./modules/queue" );
require( "./modules/dns" );
require( "./modules/db" );
require( "./filestorage" );

require( "./modules/chat" );
require( "./modules/service" );
require( "./modules/vote" );
require( "./modules/fileupload" );
// require( "./modules/tracker" );
require( "./modules/admin" );

hook.run( "Initialize" );
Logger.write( Logger.LogType.Info, "Server initialized." );

// *NOTE: 명령어 추가시 주의 사항 - args[ 0 ] 은 명령어가 들어있으므로 사용하지 않는다. (인수는 1번 인덱스부터 있음.)
// *TODO: 명령어가 실행하는 함수에 성공/실패 리턴 값 구현
Server.COMMAND = {
    "/queue-register": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] )
            return "Argument[2] 영상 주소를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        var data = {
            url: args[ 2 ],
            start: Number( args[ 3 ] || 0 )
        };
        var isAllowRegister = QueueManager.isAllowRegister( null, args[ 1 ], data );

        if ( isAllowRegister.code !== QueueManager.statusCode.success )
            return util.getCodeID( QueueManager.statusCode, isAllowRegister.code ) + " 코드가 반환되었습니다.";

        QueueManager.register( isAllowRegister.type, null, args[ 1 ], isAllowRegister.newURL, isAllowRegister.videoID, data.start, true );
    },
    "/queue-register-direct": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] )
            return "Argument[2] 영상 주소를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.register( QueueManager.providerType.Direct, null, args[ 1 ], args[ 2 ], args[ 2 ], Number( args[ 3 ] || 0 ), true );
    },
    "/kick": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 아이피 주소를 입력하세요.";

        var client = Server.getClientByIPAddress( args[ 1 ] );

        if ( client != null )
            client.kick( args.chain( 2 ) );
        else
            return "Argument[2] 해당 아이피 주소의 사용자를 찾을 수 없습니다.";
    },
    "/kickall": function( args )
    {
        var reason = args.chain( 2 ) || "서버로부터 강제 퇴장 처리";

        Server.getAllClient( args[ 1 ] !== "all" ? args[ 1 ] : null )
            .forEach( ( client ) => client.kick( reason ) );
    },
    "/ban": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 아이피 주소를 입력하세요.";

        var client = Server.getClientByIPAddress( args[ 1 ] );

        if ( client ) // *NOTE: 접속 중인 클라이언트 일 경우 (킥&밴) 아닐 경우 밴 처리만
            client.ban( args.chain( 2 ), 0 );
        else
            BanManager.register( [ null, args[ 1 ] ], 0, args.chain( 2 ) );
    },
    "/removeban": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 아이피 주소를 입력하세요.";

        BanManager.remove( args[ 1 ] );
    },
    "/queue-continue": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.continueQueue( args[ 1 ] );
    },
    "/server-status": function( )
    {
        Server.getAllClient( )
            .forEach( ( client, index ) =>
            {
                console.log( `${ index } : ${ client.information( ) }` );
            } );
    },
    "/queue-removeat": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] || isNaN( Number( args[ 2 ] ) ) )
            return "Argument[2] 제거할 위치를 입력하시거나 올바르게 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.removeAt( args[ 1 ], Number( args[ 2 ] ) );
    },
    "/queue-clear": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.clear( args[ 1 ], args[ 2 ] === "true" );
    },
    "/video-setpos": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] || isNaN( Number( args[ 2 ] ) ) )
            return "Argument[2] 재생 위치를 입력하시거나 올바르게 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.setVideoPos( args[ 1 ], Number( args[ 2 ] ) );
    }
};

process.on( "message", function( body )
{
    if ( body.type === "command" )
        Server.commandProcess( body.command );
} );

hook.register( "PostDiscordMessage", function( message )
{
    if ( message.channel.id === "474835550675927050" )
        Server.commandProcess( message.content );
} );