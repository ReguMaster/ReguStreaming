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
const uniqid = require( "uniqid" );
const fileStream = require( "fs" );

Server.CONN = [ ];
Server.CLIENT = {};
Server.ROOM = {};
Server.QUEUE = {};
Server.ROOMINFO = {};
Server.MANAGEMENT_CONSOLE = [ ];
Server.RECENT_QUEUE_REQUEST = {};
Server.VARS = {};

Server.DiscordClient = new Discord.Client( );
Server.discordInitialized = false;
Server.discordChannelType = {
    Queue: 0
};
Server.discordChannelIDList = {
    "main": "474566071941201941",
    "ncabyss": "474608399586426921",
    "mfspecial": "505737749131689992",
    "nsfw": "474608432867967006"
}

Server.setGlobalVar = function( varName, value, sendToClient = false )
{
    if ( value === VAR_NULL )
    {
        this.VARS[ varName ] = null;
        delete this.VARS[ varName ];
    }
    else
    {
        this.VARS[ varName ] = value;
    }

    /*
    if ( sendToClient )
        this.emit( "RS.syncGlobalVar",
        {
            varName: varName,
            value: value
        } );*/

    hook.run( "PostSetGlobalVar", varName, value );

    Logger.info( `[Server] Server global var [${ varName }] changed to [${ value }] (sendToClient: ${ sendToClient.toString( ) })` );
}

Server.getGlobalVar = function( varName, defaultValue )
{
    var value = this.VARS[ varName ];

    if ( !this.VARS.hasOwnProperty( varName ) || typeof value === "undefined" )
        return defaultValue;

    return value;
}

// Server.createRoom( true, "main", "메인", "레그 스트리밍에 오신것을 환영합니다.", 3000, null,
//     {
//         video_position_bar_color: "rgba( 0, 255, 231, 0.3 )",
//         video_position_bar_full_color: "rgba( 0, 255, 231, 1 )"
//     } );

//     // Server.createRoom( true, "main2", "메인 2", "레그 스트리밍에 오신것을 환영합니다.", 3000, null,
//     // {
//     //     video_position_bar_color: "rgba( 0, 255, 231, 0.3 )",
//     //     video_position_bar_full_color: "rgba( 0, 255, 231, 1 )"
//     // } );

//     Server.createRoom( true, "everync", "나이트코어 어비스", "모든 영상이 나이트코어 스타일로 재생됩니다.", 50, null,
//     {
//         playbackRate: 1.15, // 1.15
//         video_position_bar_color: "rgba( 49, 226, 79, 0.3 )",
//         video_position_bar_full_color: "rgba( 49, 226, 79, 1 )"
//     } );

//     Server.createRoom( true, "nsfw", "성인", "NSFW(Not Safe For Work) 후방을 조심하세요!!", 10, null,
//     {
//         video_position_bar_color: "rgba( 255, 150, 150, 0.3 )",
//         video_position_bar_full_color: "rgba( 255, 150, 150, 1 )"
//     } );

//     Server.createRoom( true, "admin", "관리자", "관리자 전용 채널입니다.", 0, null,
//     {
//         video_position_bar_color: "rgba( 255, 150, 150, 0.3 )",
//         video_position_bar_full_color: "rgba( 255, 150, 150, 1 )"
//     } );

/*
    *TODO: binary flag

    Flag: ‘binary’

    Specifies whether there is binary data in the emitted data. Increases performance when specified. Can be true or false.

    io.binary(false).emit('an event', { some: 'data' });

    https://socket.io/docs/server-api/#socket-use-fn
*/

Server.emitDiscord = function( channelType, message )
{
    if ( !this.discordInitialized || !this.DiscordClient ) return;

    if ( typeof channelType === "string" )
    {
        var channelID = this.discordChannelIDList[ channelType ];

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

Server.getRoomDataForClient = function( )
{
    return this.ROOMINFO;

    // var roomData = util.deepCopy( this.ROOM );
    // var queueData = util.deepCopy( this.QUEUE );

    // var keys = Object.keys( roomData );
    // var keysLength = keys.length;

    // for ( var i = 0; i < keysLength; i++ )
    // {
    //     delete roomData[ keys[ i ] ].onConnect;
    //     delete roomData[ keys[ i ] ].config;

    //     roomData[ keys[ i ] ].count = this.getRoomClientCount( keys[ i ] );

    //     if ( !util.isEmpty( queueData[ keys[ i ] ].currentPlayingQueue ) )
    //         roomData[ keys[ i ] ].currentPlaying = "NULL"; // queueData[ keys[ i ] ].currentPlayingQueue.mediaName;
    //     // roomData[ keys[ i ] ].currentPlaying = queueData[ keys[ i ] ].currentPlayingQueue.mediaName;
    // }

    // return roomData;
}

// *TODO: destroyRoom 함수 사용시 refresh 필요
Server.AcceptableClientCount = 0;

Server.createRoom = function( isOfficial, roomID, title, desc, iconData, maxConnectable, onConnect, vars )
{
    this.ROOM[ roomID ] = {
        roomID: roomID,
        isOfficial: isOfficial,
        title: title,
        desc: desc,
        iconData: iconData,
        maxConnectable: maxConnectable,
        onConnect: onConnect,
        vars: typeof vars === "object" && vars !== null ? vars :
        {}
    };

    this.QUEUE[ roomID ] = {
        queueList: [ ],
        currentPlayingQueue:
        {},
        currentPlayingPos: 0
    };

    this.ROOMINFO[ roomID ] = {
        roomID: roomID,
        isOfficial: isOfficial,
        title: title,
        desc: desc,
        iconData: iconData,
        maxConnectable: maxConnectable,
        count: 0,
        currentPlaying: null
    };

    this.RECENT_QUEUE_REQUEST[ roomID ] = [ ];
    this.CLIENT[ roomID ] = [ ];

    this.AcceptableClientCount += maxConnectable;

    Logger.info( `[Server] Room created. (roomID:${ roomID }, title:${ title }, maxConnectable:${ maxConnectable })` );

    App.redisClient.get( "RS.QUEUE." + roomID + ".queueList", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            Server.QUEUE[ roomID ].queueList = JSON.parse( result );
            Logger.info( `[Server] [${ roomID }] queueList overridden from RedisDB.` );
        }
        catch ( exception )
        {
            Logger.warn( `[Server] Failed to fetch [${ roomID }] queueList from RedisDB! (err:${ exception.stack })` );
        }
    } );

    App.redisClient.get( "RS.QUEUE." + roomID + ".currentPlayingQueue", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            Server.QUEUE[ roomID ].currentPlayingQueue = JSON.parse( result );

            // *TODO: 최적화 필요;
            Server.ROOMINFO[ roomID ].currentPlaying = Server.QUEUE[ roomID ].currentPlayingQueue.mediaName;
            Logger.info( `[Server] [${ roomID }] currentPlayingQueue overridden from RedisDB.` );
        }
        catch ( exception )
        {
            Logger.warn( `[Server] Failed to fetch [${ roomID }] currentPlayingQueue from RedisDB! (err:${ exception.stack })` );
        }
    } );

    App.redisClient.get( "RS.QUEUE." + roomID + ".currentPlayingPos", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            Server.QUEUE[ roomID ].currentPlayingPos = Number( result ) || 0;
            Logger.info( `[Server] [${ roomID }] currentPlayingPos overridden from RedisDB.` );
        }
        catch ( exception )
        {
            Logger.warn( `[Server] Failed to fetch [${ roomID }] currentPlayingPos from RedisDB! (err:${ exception.stack })` );
        }
    } );

    App.redisClient.get( "RS.QUEUE." + roomID + ".vars", function( err, result )
    {
        if ( err || !result ) return;

        try
        {
            result = JSON.parse( result );

            if ( result instanceof Object )
            {
                if ( typeof vars === "object" && vars !== null )
                {
                    var keys = Object.keys( result );
                    var keyLength = keys.length;

                    for ( var i = 0; i < keyLength; i++ )
                    {
                        var index = keys[ i ];

                        if ( typeof vars[ index ] !== "undefined" )
                        {
                            Server.ROOM[ roomID ].vars[ index ] = result[ index ];

                            Logger.warn( `[Server] [${ roomID }] initialize var '${ keys[ i ] }' overrided to '${ result[ keys[ i ] ] }'` );
                        }
                        else
                        {
                            Server.ROOM[ roomID ].vars[ index ] = result[ index ];

                            Logger.info( `[Server] [${ roomID }] var '${ keys[ i ] }' setting to '${ result[ keys[ i ] ] }'` );
                        }
                    }
                }
                else
                {
                    var keys = Object.keys( result );
                    var keyLength = keys.length;

                    for ( var i = 0; i < keyLength; i++ )
                    {
                        Logger.info( `[Server] [${ roomID }] var '${ keys[ i ] }' setting to '${ result[ keys[ i ] ] }'` );
                    }

                    Server.ROOM[ roomID ].vars = result;

                    Logger.info( `[Server] [${ roomID }] var overridden from RedisDB.` );
                }
            }
        }
        catch ( exception )
        {
            Logger.warn( `[Server] Failed to fetch [${ roomID }] var from RedisDB! (err:${ exception.stack })` );
        }
    } );
}

Server.destroyRoom = function( roomID )
{
    if ( !this.ROOM[ roomID ] ) return;

    QueueManager.clear( roomID, true );

    this.getAllClient( roomID )
        .forEach( function( v, i )
        {
            if ( v && v.initialized )
                v.kick( "채널이 닫혔습니다." );
        } );

    delete this.ROOM[ roomID ];
    delete this.ROOMINFO[ roomID ];
    delete this.QUEUE[ roomID ];
    delete this.RECENT_QUEUE_REQUEST[ roomID ];
    delete this.CLIENT[ roomID ];

    App.redisClient.keys( "RS.QUEUE." + roomID + ".*", function( err, result )
    {
        if ( err || !result ) return;

        console.log( result );

        App.redisClient.del( result, function( err )
        {
            if ( err )
                Logger.error( `[Server] Failed to delete [${ roomID }] redis DB! (err:${ err.stack })` );
        } );
    } );

    Logger.event( `[Server] [${ roomID }] room remove successful.` );
}

Server.moveUsersToRoom = function( roomID, targetRoomID )
{
    if ( !this.ROOM[ roomID ] || this.ROOM[ targetRoomID ] ) return;

    this.executeClientSideJavascript( roomID, `location.href = "/?room=${ targetRoomID }";` );
}

// Server.getRoomClient = function(roomID)
// {
//     return this.ROOM[roomID].clients;
// }

/**
 * @description Sync function
 */
Server.initializeVar = function( )
{
    try
    {
        let configCode = fileStream.readFileSync( "./service/config.cfg", "utf8" );
        let SERVER = require( "./server" );
        eval( configCode );
        Logger.event( `[Server] Execute server.cfg code successful.` );
    }
    catch ( e )
    {
        Logger.error( `[Server] Failed to execute server.cfg code! (exception:${ e.stack })` );
    }
}

hook.register( "PostSetGlobalVar", function( varName, value )
{
    // *NOTE: Doesn't work!
    /*
    if ( varName === "SERVER.DISCORD_SYNC" )
    {
        console.log( "this" );
        console.log( Server.DiscordClient );
        if ( value )
        {
            if ( Server.DiscordClient === null )
            {
                Server.DiscordClient = new Discord.Client( );
                Server.DiscordClient.login( apiConfig.DISCORD_BOT_TOKEN )
                    .then( console.log )
                    .catch( console.error );

                console.log( Server.DiscordClient );
            }
        }
        else
        {
            if ( Server.DiscordClient !== null )
            {
                Server.DiscordClient.destroy( )
                    .then( function( )
                    {
                        Logger.info( `[Discord] Disconnecting Discord client successful.` );
                        Server.DiscordClient = null;
                    } )
                    .catch( function( reason )
                    {
                        Logger.error( `[Discord] ERROR: Failed to disconnect Discord client! ${ reason }` );
                    } );
            }
        }
    }*/
} );

hook.register( "Initialize", function( )
{
    // *NOTE: Sync function
    Server.initializeVar( );

    Server.createRoom( true, "main", "메인", "레그 스트리밍에 오신 것을 환영합니다.",
    {
        image: "/images/room/main.png",
        shadow: "0px 0px 6px #191919"
    }, 3000, null,
    {
        video_position_bar_style: "random"
    } );

    Server.createRoom( true, "ncabyss", "나이트코어 어비스", "깊고 다크한 어비스, 나이트코어 어비스입니다.",
    {
        image: "/images/room/ncabyss.png",
        shadow: "0px 0px 6px #2c5287"
    }, 50, null,
    {
        video_position_bar_style: "random",
        playbackRate: 1.08
    } );

    Server.createRoom( true, "mfspecial", "마후마후 스페셜", "24시간 동안 마후마후 곡이 재생됩니다.",
    {
        image: "/images/room/mfspecial.png",
        shadow: "0px 0px 6px #ffffff"
    }, 50, null,
    {
        disallow_queue_request: true,
        video_position_bar_style: "random",
        autoQueueEnable: true,
        playlist: [
            "https://www.youtube.com/playlist?list=PLgTeCdyjCZc20pGMHjWsT9IBFJtdLCaGi"
        ]
    } );

    Server.createRoom( true, "nsfw", "성인", "NSFW(Not Safe For Work) 후방을 조심하세요!",
    {
        image: "/images/room/nsfw.png",
        shadow: "0px 0px 6px #c9bd9a"
    }, 50, null,
    {
        video_position_bar_style: "random"
    } );

    // Server.createRoom( true, "admin", "관리자", "관리자 전용 채널입니다.",
    // {
    //     image: "/images/room/main.png",
    //     shadow: "0px 0px 6px #191919"
    // }, 10, null,
    // {
    //     chatDisable: true
    // } );

    // Server.createRoom( true, "hos", "혼돈 어비스", "레그의 엉덩이 구멍도 어비스입니다만?",
    // {
    //     image: "/images/room/hos.png",
    //     shadow: "0px 0px 6px #191919"
    // }, 1, null,
    // {
    //     video_position_bar_style: "random",
    //     playbackRate: 2
    // } );

    Server.roomCreated = true;

    process.send(
    {
        type: "getAcceptableClients",
        count: Server.AcceptableClientCount
    } );

    if ( Server.getGlobalVar( "SERVER.DISCORD_SYNC", false ) )
        Server.DiscordClient.login( apiConfig.DISCORD_BOT_TOKEN );

    hook.run( "OnCreateOfficialRoom", Server.ROOM );
} );

Server.DiscordClient.on( "ready", function( )
{
    Logger.event( `[Discord] Logged in as ${ Server.DiscordClient.user.tag }.` );

    hook.run( "PostReadyDiscordClient" );

    Server.discordInitialized = true;
} );

Server.DiscordClient.on( "error", function( err )
{
    Logger.error( `[Discord] ERROR: Discord client Error ${ err.stack }` );

    Server.discordInitialized = false;
} );

Server.DiscordClient.on( "disconnect", function( e )
{
    Logger.warn( `[Discord] Discord client disconnect from Server.` );

    Server.DiscordClient = null;
    Server.discordInitialized = false;
} );

Server.DiscordClient.on( "reconnect", function( )
{
    Logger.warn( `[Discord] Discord client reconnecting to Server.` );
} );

Server.DiscordClient.on( "message", function( message )
{
    if ( !message.guild ) return;
    if ( message.author.id === apiConfig.DISCORD_BOT_ID ) return;

    util.some( Server.discordChannelIDList, ( v, i ) =>
    {
        if ( v === message.channel.id )
        {
            Logger.info( `[Chat] ${ message.author.tag }(${ message.author.id }) [-DISCORD-] : ${ message.content }` );

            Server.sendMessage( i, "RS.chat",
            {
                type: "discord",
                avatar: message.author.avatarURL,
                name: message.author.username,
                message: message.content
            } );

            return true;
        }
    } )

    hook.run( "PostDiscordMessage", message );
} );

//

hook.register( "PostClientConnected", function( client, socket )
{
    if ( client.room === "main" )
    {
        if ( !client.getExtraVar( "welcomeModalDisplayed", false ) )
        {
            client.setExtraVar( "welcomeModalDisplayed", true, false, true );
            client.sendModal( "채널 안내", "레그 스트리밍에 오신 것을 환영합니다. <p style='color: red; display: inline-block;'>다른 사람들에게 불쾌감을 유발할 수 있는 영상은 제재될 수 있습니다</p>, 자세한 내용은 운영정책을 참고하세요." );
        }
    }
    else if ( client.room === "ncabyss" )
    {
        client.sendModal( "채널 안내", "이 채널에서는 모든 영상이 <a href='//en.wikipedia.org/wiki/Nightcore' target='_blank'>나이트코어(Nightcore)</a> 스타일로 재생됩니다." );
    }
    else if ( client.room === "nsfw" )
    {
        client.sendModal( "채널 안내", "이 채널에서는 적절한 수위의 영상은 허용되지만 <p style='color: red; display: inline-block;'>다른 사람들에게 불쾌감을 유발할 수 있는 영상은 제재될 수 있습니다</p>, 자세한 내용은 운영정책을 참고하세요." );
    }
    else if ( client.room === "admin" )
    {
        if ( client.rank !== "admin" )
            client.kick( "이 채널에 <p style='color: red; display: inline-block;'>접근할 수 있는 권한이 없습니다</p>, 다른 채널을 이용해주세요." );
    }
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

Server.setRoomVar = function( roomID, varName, value )
{
    if ( !this.ROOM[ roomID ] ) return;

    var vars = this.ROOM[ roomID ].vars;

    vars[ varName ] = value;

    App.redisClient.set( "RS.QUEUE." + roomID + ".vars", JSON.stringify( Server.ROOM[ roomID ].vars ) );
}

Server.getRoomVar = function( roomID, varName, defaultValue )
{
    if ( !this.ROOM[ roomID ] ) return defaultValue;
    var vars = this.ROOM[ roomID ].vars;

    if ( !vars || !vars.hasOwnProperty( varName ) ) return defaultValue;

    return vars[ varName ] !== undefined ? vars[ varName ] : defaultValue;
}

/**
 * @deprecated
 */
Server.getRoomVars = function( roomID, varNameArray, defaultValueArray ) {

}

Server.getRoomAllVars = function( roomID )
{
    if ( !this.ROOM[ roomID ] ) return {};

    return this.ROOM[ roomID ].vars ||
    {};
}

Server.isAlreadyConnected = function( passportID, sessionID, ipAddress )
{
    var length = this.CONN.length;

    for ( var i = 0; i < length; i++ )
    {
        var data = this.CONN[ i ];

        if ( data.sessionID === sessionID || data.passport.user.id === passportID )
            return true;
    }

    return false;
}

Server.sendMessage = function( roomID, id, data, except )
{
    if ( roomID === null || roomID === undefined ) // 전부 전송
    {
        var keys = Object.keys( this.CLIENT );
        var keysLength = keys.length;

        for ( var i = 0; i < keysLength; i++ )
            this.CLIENT[ keys[ i ] ].forEach( ( client ) =>
            {
                if ( except && client === except ) return;

                client.emit( id, data );
            } );
    }
    else
    {
        if ( !this.CLIENT[ roomID ] ) return;

        this.CLIENT[ roomID ].forEach( ( client ) =>
        {
            if ( except && client === except ) return;

            client.emit( id, data );
        } );
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
    var ipAddress = client.ipAddress;

    for ( var i = 0; i < length; i++ )
    {
        var data = this.CONN[ i ];

        if ( data.sessionID === sessionID || data.passport.user.id === passportID || data.ipAddress === ipAddress )
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

Server.executeClientSideJavascript = function( roomIDOrClient, code, hidden = true )
{
    // 설정한 룸 안에 클라이언트에게 전송
    if ( typeof roomIDOrClient === "string" )
    {
        this.sendMessage( roomIDOrClient, "RS.executeJS",
        {
            code: code,
            hidden: hidden
        } );
    }
    // 설정한 클라이언트에게만 전송
    else if ( roomIDOrClient instanceof Client && roomIDOrClient.initialized )
    {
        roomIDOrClient.emit( "RS.executeJS",
        {
            code: code,
            hidden: hidden
        } );
    }
    // 모든 룸의 클라이언트에게 전송
    else if ( roomIDOrClient === null )
    {
        this.sendMessage( null, "RS.executeJS",
        {
            code: code,
            hidden: hidden
        } );
    }
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

    if ( this.getRoomClientCount( roomID ) >= this.ROOM[ roomID ].maxConnectable )
    {
        return {
            accept: false,
            reason: "해당 채널을 수용할 수 있는 최대 접속 인원 수를 초과했습니다."
        };
    }

    // if ( countryCode === "ERROR" ) // 데이터베이스 관련 오류로인해 일단 허용할경우.
    // {
    //     Logger.write( Logger.type.Important, `[Client] Client login request -> Countrycode is error, but allow. ${ ipAddress } ${ countryCode }` );
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

Server.onConnect = function( socket, platform )
{
    // *TODO: 여기에 룸 체크 다시하기 -> 필요 없을 수 있음.
    // socket.disconnect( true );

    // return;

    // redis delete .*

    if ( !Server.roomCreated )
    {
        console.log( "WARNING! - room not created!" );
        socket.disconnect( true );
        return;
    }

    if ( platform == "web" )
    {
        var roomID = socket.handshake.session.roomID;

        if ( !socket.handshake.session )
        {
            console.log( "WARNING! - session not valid" );
            socket.disconnect( true );
            return;
        }

        if ( !this.ROOM[ roomID ] ) // *오류: 가끔 room Initialize 보다 먼저 클라이언트가 들어올 시 룸 데이터가 없으므로 오류가 발생함.
        {
            console.log( "WARNING! - room is not exists!" );
            socket.disconnect( true );
            return;
        }

        Logger.conn( `[Client] New client connecting to '${ roomID }' -> ${ socket.handshake.session.passport.user.id }` );

        var client = new Client( socket );
        client.initialize( roomID, platform, this.getRoomAllVars( roomID ) );

        this.CLIENT[ roomID ].push( client );
        this.registerConnList( socket );

        socket.reguClient = client;
        socket.emit( "RS.joinResult",
        {
            name: client.name,
            userID: client.userID,
            rank: client.rank,
            avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
            roomTitle: this.ROOM[ roomID ].title,
            roomID: roomID // *NOTE: for android client
        } );

        socket.emit( "RS.clientDataEvent",
        {
            type: "initialize",
            allClientData: this.getAnotherClientData( client )
        } );

        var allClientCount = this.getAllCount( );
        var roomClientCount = this.getRoomClientCount( roomID );

        this.ROOMINFO[ roomID ].count = roomClientCount;

        this.sendMessage( roomID, "RS.clientDataEvent",
        {
            type: "new",
            targetClientData: this.getTargetClientData( client )
        }, client );

        process.send(
        {
            type: "updateClientCount",
            count: allClientCount
        } );

        Logger.conn( `[Client] New client connected to '${ roomID }' -> ${ client.information( false ) } ->>> room: ${ roomClientCount - 1 } -> ${ roomClientCount } all: ${ allClientCount }` );

        return client;
    }
    else if ( platform == "android" )
    {
        var roomID = socket.handshake.query.roomID;

        if ( !this.ROOM[ roomID ] ) // *오류: 가끔 room Initialize 보다 먼저 클라이언트가 들어올 시 룸 데이터가 없으므로 오류가 발생함.
        {
            console.log( "WARNING! - room is not exists!" );
            socket.disconnect( true );
            return;
        }

        Logger.conn( `[Client] New client connecting to '${ roomID }' -> ${ "Android" }` );

        var un = uniqid( );
        var displayName = "AndroidClient#" + un;
        var hash = util.md5( displayName.trim( ) );

        socket.handshake.session.passport = {};
        socket.handshake.session.passport.user = {
            id: un,
            displayName: displayName,
            avatar: `https://gravatar.com/avatar/${ hash }.png?d=retro&s=64`,
            avatarFull: `https://gravatar.com/avatar/${ hash }.png?d=retro&s=184`,
            provider: "guest"
        }

        var client = new Client( socket );
        client.initialize( roomID, platform, this.getRoomAllVars( roomID ) );

        this.CLIENT[ roomID ].push( client );
        this.registerConnList( socket );

        socket.reguClient = client;
        socket.emit( "RS.joinResult",
        {
            name: client.name,
            userID: client.userID,
            rank: client.rank,
            avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
            roomTitle: this.ROOM[ roomID ].title,
            roomID: roomID // *NOTE: for android client
        } );

        socket.emit( "RS.clientDataEvent",
        {
            type: "initialize",
            allClientData: this.getAnotherClientData( client )
        } );

        var allClientCount = this.getAllCount( );
        var roomClientCount = this.getRoomClientCount( roomID );

        this.ROOMINFO[ roomID ].count = roomClientCount;

        process.send(
        {
            type: "updateClientCount",
            count: allClientCount
        } );

        this.sendMessage( roomID, "RS.clientDataEvent",
        {
            type: "new",
            targetClientData: this.getTargetClientData( client )
        }, client );

        Logger.conn( `[Client] New client connected to '${ roomID }' -> ${ client.information( false ) } ->>> room: ${ roomClientCount - 1 } -> ${ roomClientCount } all: ${ allClientCount }` );

        return client;
    }
}

Server.getAnotherClientData = function( client )
{
    var clients = this.getAllClient( client.room );
    var data = {};

    clients.forEach( function( v, index )
    {
        if ( v === client ) return;

        data[ v.userID ] = {
            name: v.name,
            userID: v.userID,
            avatar: v.getPassportField( "avatar", "/images/avatar/guest_64.png" )
        };
    } );

    return data;
}

Server.getTargetClientData = function( client )
{
    return {
        name: client.name,
        userID: client.userID,
        avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" )
    };
}

Server.onDisconnect = function( client )
{
    if ( !client ) return null;

    var roomID = client.room;

    this.removeAtConnList( client );
    this.CLIENT[ roomID ].splice( this.CLIENT[ roomID ].indexOf( client ), 1 );
    // this.CLIENT.splice( this.CLIENT.indexOf( client ), 1 );

    this.sendMessage( roomID, "RS.clientDataEvent",
    {
        type: "remove",
        id: client.userID
    }, client );

    hook.run( "ClientDisconnected", client );

    var allClientCount = this.getAllCount( );
    var roomClientCount = this.getRoomClientCount( roomID );

    this.ROOMINFO[ roomID ].count = roomClientCount;

    process.send(
    {
        type: "updateClientCount",
        count: allClientCount
    } );

    Logger.disconn( `[Client] Client disconnected from '${ roomID }' ${ client.information( false ) } ->>> room: ${ roomClientCount + 1 } -> ${ roomClientCount } all: ${ allClientCount }` );

    return null;
}

Server.joinRoom = function( roomID, req, res, ipAddress )
{
    var preClientConnect = hook.run( "PreClientConnect", ipAddress );

    req.session.touch( );

    if ( preClientConnect && preClientConnect.accept === false )
    {
        res.redirect( "/?error=" + preClientConnect.reason );
        Logger.write( Logger.type.Warning, `[Client] Client pre rejected! -> (#${ preClientConnect.reason }) ${ ipAddress }` );
        return;
    }

    Tracker.getCountryCode( ipAddress, function( countryCode )
    {
        var isConnectable = Server.isConnectable( roomID, req.sessionID, req.user.id, ipAddress, countryCode ); // req.user.id

        if ( !isConnectable.accept )
        {
            res.redirect( "/?error=" + isConnectable.reason );
            Logger.write( Logger.type.Warning, `[Client] Client rejected! -> (#${ isConnectable.reason }) ${ ipAddress }` );
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
        client = Server.onConnect( socket, socket.handshake.query.platform || "web" );

        hook.run( "PostClientConnected", client, socket );
    } );

    socket.on( "disconnect", function( data )
    {
        if ( client )
            client = Server.onDisconnect( client );
    } );

    socket.on( "disconnecting", function( data )
    {
        client = Server.onDisconnect( client );
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

    socket.on( "RS.admin.kickRequest", function( data )
    {
        if ( !client )
        {
            Logger.write( Logger.type.Important, `[Client] Kick request rejected! -> (#ClientIsNotValid) ${ socket.handshake.address }` );
            socket.vi.disconnect( true );
            return;
        }

        if ( !util.isValidSocketData( data,
            {
                userID: "string"
            } ) )
        {
            Logger.write( Logger.type.Important, `[Client] Kick request rejected! -> (#DataIsNotValid) ${ client.information() }` );
            return;
        }

        if ( client.rank === "admin" )
        {
            var user = Server.getClientByUserID( data.userID );

            if ( user )
                user.kick( );
        }
        else
        {

        }
    } );

    socket.on( "RS.requestUserInformation", function( data, ack )
    {
        if ( !util.isValidSocketData( data, "string" ) )
        {
            Logger.impor( `[Client] 'RS.requestUserInformation' request has rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return ack(
            {
                code: 2
            } );
        }

        var targetClient = Server.getClientByUserID( data );

        if ( targetClient && targetClient.initialized )
        {
            if ( targetClient.room !== client.room )
                Logger.impor( `[Client] WARNING!: 'RS.requestUserInformation' request warning! -> (#TargetClientRoomAndClientRoomMismatch) ${ client.information( ) }` );

            Logger.info( `[Client] Client requested Client information. ${ client.information( ) } ---> ${ targetClient.information( ) }` );

            return ack(
            {
                code: 0,
                name: targetClient.name,
                ipAddress: util.censorshipIP( targetClient.ipAddress ),
                avatar: targetClient.getPassportField( "avatarFull", "/images/avatar/guest_184.png" ), // *TODO: 네이버 아이디 지원바람;
                rank: targetClient.rank,
                userID: targetClient.userID,
                provider: targetClient.provider
            } );
        }
        else
            return ack(
            {
                code: 1
            } );
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
const ChatManager = require( "./modules/chat" );

const ServiceManager = require( "./modules/service" );
const DatabaseCache = require( "./modules/dbcache" );
require( "./modules/vote" );
require( "./modules/fileupload" );
// require( "./modules/tracker" );
require( "./modules/admin" );

hook.run( "Initialize" );
Logger.write( Logger.type.Info, "Server initialized." );

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
        var isAllowRegister = QueueManager.isAllowRegister( null, args[ 1 ], data, true );

        if ( isAllowRegister.code !== QueueManager.statusCode.success )
            return util.getCodeID( QueueManager.statusCode, isAllowRegister.code ) + " 코드가 반환되었습니다.";

        QueueManager.register( isAllowRegister.type, null, args[ 1 ], isAllowRegister.newURL, isAllowRegister.videoID, data.start, true, args[ 4 ] );
    },
    "/queue-register-direct": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] )
            return "Argument[2] 영상 주소를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.register( QueueManager.providerType.Direct, null, args[ 1 ], args[ 2 ], args[ 2 ], Number( args[ 3 ] || 0 ), true, args[ 4 ] );
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
    "/execute-javascript": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] )
            return "Argument[2] 코드를 입력하세요.";

        Server.executeClientSideJavascript( args[ 1 ] !== "all" ? args[ 1 ] : null, args.chain( 2 ) );
    },
    "/execute-javascript-target": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] )
            return "Argument[2] 타겟 아이피 주소를 입력하세요.";

        var client = Server.getClientByIPAddress( args[ 2 ] );

        if ( !client )
            return "Argument[2] 올바른 타겟 아이피 주소를 입력하세요.";

        if ( !args[ 3 ] )
            return "Argument[3] 코드를 입력하세요.";

        Server.executeClientSideJavascript( client, args.chain( 3 ) );
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

        if ( !args[ 2 ] || !Number.isInteger( Number( args[ 2 ] ) ) )
            return "Argument[2] 제거할 위치를 입력하시거나 올바르게 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.removeAt( args[ 1 ], Number( args[ 2 ] ) );
    },
    "/queue-clear": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( args[ 1 ] !== "all" && !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.clear( args[ 1 ] !== "all" ? args[ 1 ] : null, args[ 2 ] === "true" );
    },
    "/queue-loopstatus": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        Server.setRoomVar( args[ 1 ], "queue_loop", !Server.getRoomVar( args[ 1 ], "queue_loop", false ) );

        if ( Server.getRoomVar( args[ 1 ], "queue_loop", false ) )
        {
            ChatManager.saySystem( args[ 1 ], "관리자에 의해 채널에 현재 영상을 반복합니다.", "glyphicon glyphicon-repeat" );
        }
        else
        {
            ChatManager.saySystem( args[ 1 ], "관리자에 의해 채널에 현재 영상을 반복하지 않습니다.", "glyphicon glyphicon-remove-circle" );
        }
    },
    "/video-setpos": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] || !Number.isInteger( Number( args[ 2 ] ) ) )
            return "Argument[2] 재생 위치를 입력하시거나 올바르게 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.setVideoPos( args[ 1 ], Number( args[ 2 ] ) );
    },
    "/service-refreshbg": function( args )
    {
        ServiceManager.refreshBackground( );
    },
    "/service-status-reload-request": function( args )
    {
        Server.getAllClient( )
            .forEach( ( client, index ) =>
            {
                client.emit( "RS.refreshServiceStatus" );
            } );
    },
    // "/service-live-reload": function( args )
    // {
    //     ServiceManager.reloadLiveCode( );
    // },
    "/service-ipfilter-reload": function( args )
    {
        ServiceManager.reloadIPFilter( );
    },
    "/server-cfg-reload": function( args )
    {
        fileStream.readFile( "./service/config.cfg", "utf8", function( err, data )
        {
            if ( err )
            {
                Logger.error( `[Server] Failed to load config.cfg! (err:${ err })` );
                return;
            }

            try
            {
                let SERVER = require( "./server" );
                eval( data );
                Logger.event( `[Server] Execute server.cfg code successful.` );
            }
            catch ( e )
            {
                Logger.error( `[Server] Failed to execute server.cfg code! (exception:${ e.stack })` );
            }
        } );
    },
    // "/server-room-playback": function( args )
    // {
    //     if ( !args[ 1 ] )
    //         return "Argument[1] 아이디를 입력하세요.";

    //     if ( !Server.ROOM[ args[ 1 ] ] )
    //         return "Argument[1] 올바르지 않은 채널입니다.";
    // },
    "/queue-moveto": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] || !Number.isInteger( Number( args[ 2 ] ) ) || !args[ 3 ] || !Number.isInteger( Number( args[ 3 ] ) ) )
            return "Argument[2 or 3] 이동할 위치에서 이동시킬 위치를 입력하거나 숫자로 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        QueueManager.moveTo( args[ 1 ], Number( args[ 2 ] ), Number( args[ 3 ] ) );
    },
    "/queue-generate": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !Server.ROOM[ args[ 1 ] ] )
            return "Argument[1] 올바르지 않은 채널입니다.";

        if ( !args[ 2 ] )
            return "Argument[2] 플레이리스트 주소를 입력하세요.";

        // *TODO: 하드코딩 수정 필요
        // if ( args[ 1 ] != "alwaysjapan" )
        //     return "Argument[1] 자동 재생 채널이 아닙니다.";

        QueueManager.generate( args[ 1 ], args[ 2 ], Number( args[ 3 ] ) );
    },
    "/notify": function( args )
    {
        if ( !args[ 1 ] )
            return "Argument[1] 채널 아이디를 입력하세요.";

        if ( !args[ 2 ] )
            return "Argument[2] 제목을 입력하세요.";

        if ( !args[ 3 ] )
            return "Argument[3] 내용을 입력하세요.";

        ChatManager.saySystem( args[ 1 ] !== "all" ? args[ 1 ] : null, args.chain( 3 ), "glyphicon glyphicon-comment" );
        Server.getAllClient( args[ 1 ] !== "all" ? args[ 1 ] : null )
            .forEach( ( client, index ) =>
            {
                client.emit( "RS.notification",
                {
                    title: args[ 2 ],
                    body: args.chain( 3 )
                } );
            } );
    },
    "/cache-flushall": function( args )
    {
        DatabaseCache.removeAll( );
    },
    "/exit": function( args )
    {
        process.send(
        {
            type: "exit"
        } );
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