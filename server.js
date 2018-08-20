/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use struct'

const App = require( "./app" );
const util = require( "./util" );
const hook = require( "./hook" );
const Logger = require( "./modules/logger" );
var Client = require( "./client" );

const Tracker = require( "./modules/tracker" );
const Discord = require( "discord.js" );
const config = require( "./const/config" );

const Server = {};

Server.CONN = [ ];
Server.CLIENT = {};
Server.ROOM = {};
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

// const ServiceManager = require( "./modules/service" );
// Server.QUEUE = [ ];

Server.getRoomDataForClient = function( )
{
    var roomData = util.deepCopy( this.ROOM );

    var keys = Object.keys( roomData );
    var keysLength = keys.length;

    for ( var i = 0; i < keysLength; i++ )
    {
        delete roomData[ keys[ i ] ].onConnect;
        delete roomData[ keys[ i ] ].queueList;

        roomData[ keys[ i ] ].count = this.getRoomClientCount( keys[ i ] );

        if ( !util.isEmpty( roomData[ keys[ i ] ].currentPlayingQueue ) )
            roomData[ keys[ i ] ].currentPlaying = roomData[ keys[ i ] ].currentPlayingQueue.mediaName;

        delete roomData[ keys[ i ] ].currentPlayingQueue;
        delete roomData[ keys[ i ] ].config;
        delete roomData[ keys[ i ] ].currentPlayingPos;
        // delete roomData[ keys[ i ] ].clients;
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
        config: config,
        // clients: [ ],
        queueList: [ ],
        currentPlayingQueue:
        {},
        currentPlayingPos: 0
    }

    this.CLIENT[ roomID ] = [ ];
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

// Server.DiscordClient.login( config.DISCORD_BOT_TOKEN );

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
        {
            Logger.write( Logger.LogType.Error, `[Server] Failed to process Server.getAllClient -> roomID is not valid!` );
            return;
        }

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

    // if ( !this.canUseNickname( data.name ) )
    // {
    //     return {
    //         accept: false,
    //         reason: "사용할 수 없는 닉네임을 설정했습니다. (영어, 한글, 숫자 3 ~ 10자, 특수문자 불가, 일부 특정 단어 불가)"
    //     };
    // }

    return {
        accept: true
    }
}

// room 접속했을 때 socket 초기화 작업
Server.onConnect = function( socket )
{
    // 여기에 룸 체크 다시하기
    var roomID = socket.handshake.session.roomID;

    if ( !this.ROOM[ roomID ] ) // wow fucking doge
    {
        console.log( "WARNING!" );
        return;
    }

    var client = new Client( socket );
    client.initialize( roomID, this.ROOM[ roomID ].config );

    this.CLIENT[ roomID ].push( client );
    this.registerConnList( socket );

    // ClientManager.refreshCount( );
    // 이거 좀 최적화하기.. clientCountUpdate
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

        // this.refreshCount( );
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

require( "./util" );
require( "./modules/queue" );
require( "./modules/dns" );
require( "./modules/db" );
require( "./filestorage" );
// require( "./datastream" );

require( "./modules/chat" );
require( "./modules/service" );
require( "./modules/interact" );
require( "./modules/vote" );
require( "./modules/fileupload" );
require( "./modules/tracker" );
require( "./modules/admin" );

hook.run( "Initialize" );
Logger.write( Logger.LogType.Info, "Server initialized." );