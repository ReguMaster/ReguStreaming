/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

// const ClientManager = {};
const BanManager = require( "./modules/ban" );
const Logger = require( "./modules/logger" );
const hook = require( "./hook" );

module.exports = class Client
{
    constructor( socket )
    {
        this._socket = socket;
        this._config = {};
    }

    initialize( roomID, roomConfig )
    {
        // too long!
        this._passport = this._socket.handshake.session.passport;

        this._userName = this._passport.user.displayName;
        this._userID = this._passport.user.id.toString( );
        this._roomID = roomID;
        this._rank = "guest";

        // console.log( this._passport );
        // console.log( this._socket );

        this._initialized = true;

        if ( roomConfig )
        {
            this.emit( "RS.initialize",
            {
                roomConfig: roomConfig
            } );
        }
    }

    getPassportField( field, defaultValue )
    {
        if ( !this._passport || !this._passport.user ) return defaultValue;

        try
        {
            if ( typeof this._passport.user[ field ] === "undefined" )
                return defaultValue;

            return this._passport.user[ field ];
        }
        catch ( exception )
        {
            return defaultValue;
        }
    }

    getPassportRawField( field, defaultValue )
    {
        if ( !this._passport || !this._passport.user ) return defaultValue;

        try
        {
            if ( typeof this._passport.user._json[ field ] === "undefined" )
                return defaultValue;

            return this._passport.user._json[ field ];
        }
        catch ( exception )
        {
            return defaultValue;
        }
    }

    get name( )
    {
        return this._userName;
    }

    get userID( )
    {
        return this._userID;
    }

    get ipAddress( )
    {
        return this._socket.handshake.address;
    }

    get session( )
    {
        return this._socket.handshake.session;
    }

    get sessionID( )
    {
        return this._socket.handshake.sessionID;
    }

    get rank( )
    {
        return this._rank;
    }

    get provider( )
    {
        return this._passport.user.provider;
    }

    // 이거 좀 바꾸기
    // args 에 필요한 field 적으면 알아서 배열로 리턴해주게 바꾸기
    informationStruct( containRoomID = false )
    {

    }

    information( containRoomID = true )
    {
        if ( containRoomID )
            return `${ this._userName }#${ this._userID }::${ this._socket.handshake.address } [${ this._roomID }]`;
        else
            return `${ this._userName }#${ this._userID }::${ this._socket.handshake.address }`;
    }

    get initialized( )
    {
        return this._initialized;
    }

    get socket( )
    {
        return this._socket;
    }

    // set room( roomID )
    // {
    // this._socket.room = roomID;
    // }

    get room( )
    {
        return this._roomID;
    }

    emit( messageID, data )
    {
        if ( this._socket )
        {
            this._socket.emit( messageID, data );
        }
        else
            Logger.write( Logger.LogType.Error, `[Client] Failed to emit data! -> ${ this.information( ) }` );
    }

    // emitAll( messageID, data, filterArray )
    // {
    //     if ( this._socket )
    //     {
    //         ClientManager.sendMessageToAll( this.room, messageID, data, filterArray );
    //     }
    //     else
    //         Logger.write( Logger.LogType.Error, `[Client] Failed to emit data! -> ${ this.information( ) }` );
    // }

    sendError( code, extra )
    {
        if ( extra )
            this.emit( "RS.sendError",
            {
                code: code,
                extra: extra
            } );
        else
            this.emit( "RS.sendError",
            {
                code: code
            } );
    }

    kick( reason )
    {
        if ( !reason )
            reason = "서비스 약관 위반";

        this.sendError( 400,
        {
            reason: reason
        } );
        this.disconnect( );

        hook.run( "OnKicked", this );
        Logger.write( Logger.LogType.Warning, `[Client] Client kicked! -> ${ this.information( ) } -> '${ reason }'` );
    }

    ban( reason, duration )
    {
        if ( !reason )
            reason = "서비스 약관 위반";

        var banID = BanManager.register( [ this.userID, this.ipAddress ], duration, reason ); // 계정밴 & 아이피밴

        this.sendError( 401,
        {
            banID: banID,
            reason: reason
        } );
        this.disconnect( );
        this.logout( );

        hook.run( "OnBanned", this );


    }

    disconnect( )
    {
        this._socket.disconnect( );
    }

    logout( )
    {
        if ( this._socket.handshake.session )
            this._socket.handshake.session.destroy( );
    }

    // config 개발하기
    // 접속에 interval 제한 넣기!
    registerConfig( configName, value )
    {
        this._config[ configName ] = value;

        this._socket.emit( "regu.client.configChanged",
        {
            configName: configName,
            configValue: value
        } );
    }

    getConfig( configName, defaultValue )
    {
        var value = this._config[ configName ]

        if ( typeof value == "undefined" )
            return defaultValue;

        return value;
    }

    toString( )
    {
        return "fucker";
    }

    // client toString 시 정보 반환
    // 파일 다시 짜기
}

// ClientManager._sessions = [ ];
// ClientManager.CLIENTS = [ ];
// ClientManager._clientsCount = [ ];

// ClientManager.config = {};
// ClientManager.config.nicknameRegexExpression = /^[ㄱ-ㅎ|가-힣|a-z|A-Z\*]+$/;
// ClientManager.config.blockCharacter = [ ];
/*

hook.register( "RoomInitialized", function( rooms )
{
    var length = rooms.length;

    for ( var i = 0; i < length; i++ )
    {
        var roomID = rooms[ i ].roomID;

        ClientManager._clientsCount[ roomID ] = 0;
    }
} );


ClientManager.sendMessageToAll = function( roomID, messageID, data, filterArray )
{
    var clients = ClientManager.getAll( true );
    var length = clients.length;

    if ( roomID != null )
    {
        if ( filterArray )
        {
            if ( filterArray.length ) // length 가 있으면 배열
            {
                var length2 = filterArray.length;

                for ( var i = 0; i < length; i++ )
                {
                    for ( var i2 = 0; i2 < length2; i2++ )
                    {
                        if ( filterArray[ i2 ] === clients[ i ] )
                        {
                            console.log( "continue!" );
                            continue;
                        }

                        if ( clients[ i ].room === roomID && clients[ i ].socket != null )
                            clients[ i ].socket.emit( messageID, data );
                    }

                }
            }
            else
            {
                for ( var i = 0; i < length; i++ )
                {
                    if ( filterArray === clients[ i ] )
                    {
                        console.log( "continue!" );
                        continue;
                    }

                    if ( clients[ i ].room === roomID && clients[ i ].socket != null )
                        clients[ i ].socket.emit( messageID, data );
                }
            }
        }
        else
        {
            for ( var i = 0; i < length; i++ )
            {
                if ( clients[ i ].room === roomID && clients[ i ].socket != null )
                    clients[ i ].socket.emit( messageID, data );
            }
        }
    }
    else
    {
        if ( filterArray )
        {
            if ( filterArray.length ) // length 가 있으면 배열
            {
                var length2 = filterArray.length;

                for ( var i = 0; i < length; i++ )
                {
                    for ( var i2 = 0; i2 < length2; i2++ )
                    {
                        if ( filterArray[ i2 ] === clients[ i ] )
                        {
                            console.log( "continue!" );
                            continue;
                        }

                        if ( clients[ i ].socket != null )
                            clients[ i ].socket.emit( messageID, data );
                    }

                }
            }
            else
            {
                for ( var i = 0; i < length; i++ )
                {
                    if ( filterArray === clients[ i ] )
                    {
                        console.log( "continue!" );
                        continue;
                    }

                    if ( clients[ i ].socket != null )
                        clients[ i ].socket.emit( messageID, data );
                }
            }
        }
        else
        {
            for ( var i = 0; i < length; i++ )
            {
                if ( clients[ i ].socket != null )
                    clients[ i ].socket.emit( messageID, data );
            }
        }
    }
}

// ClientManager.sendFileStreamToAll = function( roomID, messageID, file, data )
// {
//     if ( roomID != null )
//     {
//         var stream = ss.createStream( );

//         ClientManager.getAll( true )
//             .forEach( function( client )
//             {
//                 if ( client.room == roomID )
//                 {
//                     ss( client.socket )
//                         .emit( "audio-stream", stream, data );
//                     fileStream.createReadStream( file )
//                         .pipe( stream );
//                 }
//             } );
//     }
// }

// ClientManager.sendFileStream = function( client, messageID, file, data )
// {
//     var stream = ss.createStream( );
//     ss( client.socket )
//         .emit( "audio-stream", stream, data );
//     fileStream.createReadStream( file )
//         .pipe( stream );
// }

ClientManager.isAlreadyConnected = function( passportID, sessionID )
{
    var length = this._sessions.length;

    for ( var i = 0; i < length; i++ )
    {
        var data = this._sessions[ i ];

        if ( data.sessionID === sessionID || data.passport.user.id === passportID )
            return true;
    }

    return false;
}

ClientManager.getSessionIndexByPassportAndSessionID = function( passportID, sessionID )
{
    var length = this._sessions.length;

    for ( var i = 0; i < length; i++ )
    {
        var data = this._sessions[ i ];

        if ( data.sessionID === sessionID || data.passport.user.id === passportID )
            return i;
    }

    return null;
}

ClientManager.preClientConnection = function( roomID, sessionID, userID, ipAddress, countryCode )
{
    var canClientConnect = hook.run( "CanClientConnect", ipAddress, userID );

    if ( canClientConnect && canClientConnect.accept === false )
    {
        return {
            accept: false,
            critical: true,
            reason: canClientConnect.reason
        };
    }

    if ( !RoomManager.isExists( roomID ) )
    {
        return {
            accept: false,
            reason: "올바른 채널을 선택하지 않았습니다."
        };
    }

    if ( countryCode === "ERROR" ) // 데이터베이스 관련 오류로인해 일단 허용할경우.
    {
        Logger.write( Logger.LogType.Important, `[Client] Client login request -> Countrycode is error, but allow. ${ ipAddress } ${ countryCode }` );
        // socket.emit( "regu.notification",
        // {
        //     type: 1,
        //     title: "데이터베이스 오류 :",
        //     time: 2000,
        //     message: "데이터베이스 오류가 발생했습니다, 이 문제가 관리자에게 보고되었습니다."
        // } );
    }
    else
    {
        if ( countryCode !== "KR" )
        {
            return {
                accept: false,
                reason: "이 지역에서는 접속하실 수 없습니다."
            };
        }
    }

    if ( this.isAlreadyConnected( userID, sessionID ) )
    {
        return {
            accept: false,
            reason: "다른 계정 또는 세션에서 이미 접속 중입니다."
        };
    }

    var preConnect = RoomManager.getDataByID( roomID )
        .preConnect;

    if ( preConnect != null )
    {
        var access = preConnect( ipAddress );

        if ( typeof access === "boolean" && !access )
        {
            return {
                accept: false,
                reason: "해당 채널을 접속할 수 있는 권한이 없습니다."
            };
        }
        else if ( typeof access === "object" && !access.access )
        {
            return {
                accept: false,
                reason: access.reason || "해당 채널을 접속할 수 있는 권한이 없습니다."
            };
        }
    }

    if ( this.getCount( roomID ) >= RoomManager.getMaxConnectable( roomID ) )
    {
        return {
            accept: false,
            reason: "해당 채널이 수용할 수 있는 최대 접속 인원 수를 초과했습니다."
        };
    }

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

ClientManager.getAll = function( onlyInitialized, roomID )
{
    if ( onlyInitialized )
    {
        var clients = [ ],
            length = this.CLIENTS.length;

        for ( var i = 0; i < length; i++ )
        {
            if ( this.CLIENTS[ i ].initialized )
                clients.push( this.CLIENTS[ i ] );
        }

        return clients;
    }
    else
        return this.CLIENTS;
}

// *TODO;
// ip address based UserID;
ClientManager.generateUserID = function( ipAddress )
{
    var ipArray = ipAddress.split( "." );
    var i = 0;

    ipArray.forEach( function( ipSplit, index )
    {
        ipArray[ index ] = Number( ipSplit );

        i += ipArray[ index ];
    } );

    // console.log( ipArray );
    // console.log( i / 100 );

    return Math.floor( 1000 + Math.random( ) * 9000 );
    // var name = "";
    // var possible = "abcdefghijklmnopqrstuvwxyz";

    // for( var i = 0; i < 10; i++ ) {
    // name += possible.charAt(Math.floor(Math.random() * possible.length));
    // }

    // return name;
}

ClientManager.findByUserID = function( userID, roomID )
{
    var result = null;

    ClientManager.getAll( true, roomID )
        .some( function( client )
        {
            if ( client.userID == userID )
            {
                result = client;

                return true;
            }
        } );

    return result;
}

ClientManager.findByIP = function( ipAddress, onlyInitialized = true )
{
    if ( onlyInitialized )
    {
        var result = null;

        ClientManager.getAll( true )
            .some( function( client )
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
            if ( ClientManager.CLIENTS[ i ].ipAddress == ipAddress ) return ClientManager.CLIENTS[ i ];
        }
    }

    return null;
}

ClientManager.kick = function( client, reason ) {

}

ClientManager.ban = function( client, duration, reason ) {

}

ClientManager.onDisconnect = function( client, socket )
{
    if ( client != null && client.initialized )
    {
        var sessionIndex = this.getSessionIndexByPassportAndSessionID( client.getPassportField( "id" ), socket.handshake.sessionID );

        if ( sessionIndex != null )
            this._sessions.splice( sessionIndex, 1 );

        this.CLIENTS.splice( this.CLIENTS.indexOf( client ), 1 );

        // this.refreshCount( );
        this.sendMessageToAll( client.room, "regu.clientCountUpdate",
        {
            count: this.getCount( client.room ),
            roomTitle: RoomManager.getDataByID( client.room )
                .title
        } );

        hook.run( "ClientPostDisconnected", socket, client );

        var allClientCount = this.getCount( );
        var roomClientCount = this.getCount( client.room );

        Logger.write( Logger.LogType.Event, `[Client] Client disconnected from '${ client.room }' ${ client.information( false ) } ->>> room: ${ roomClientCount + 1 } -> ${ roomClientCount } all: ${ allClientCount }` );
    }
}

// ClientManager.canUseNickname = function( text )
// {
//     if ( text.length < 3 || text.length > 10 )
//         return false;

//     if ( !this.config.nicknameRegexExpression.test( text ) )
//         return false;

//     text = text.toLowerCase( );

//     return !this.config.blockCharacter.some( function( blockedCharacter )
//     {
//         if ( text.indexOf( blockedCharacter.toLowerCase( ) ) > -1 )
//             return true;
//     } );
// }

ClientManager.getCount = function( roomID )
{
    var count = 0;
    var length = ClientManager.CLIENTS.length;

    if ( roomID )
    {
        for ( var i = 0; i < length; i++ )
        {
            if ( ClientManager.CLIENTS[ i ].initialized && ClientManager.CLIENTS[ i ].room === roomID )
                count++;
        }
    }
    else
    {
        for ( var i = 0; i < length; i++ )
        {
            if ( ClientManager.CLIENTS[ i ].initialized )
                count++;
        }
    }

    return count;
}

// ClientManager.refreshCount = function( )
// {
//     var count = [ ];
//     var length = ClientManager.CLIENTS.length;

//     for ( var i = 0; i < length; i++ )
//     {
//         if ( ClientManager.CLIENTS[ i ].initialized && ClientManager.CLIENTS[ i ].room )
//         {
//             var room = ClientManager.CLIENTS[ i ].room;

//             if ( !count[ room ] )
//                 count[ room ] = 0;

//             if ( ClientManager._clientsCount[ room ] != null )
//             {
//                 count[ room ]++;
//             }
//             else
//             {
//                 Logger.write( Logger.LogType.Warning, `[Client] WARNING: Unexpected warning process at ClientManager.refreshCount : Unknown ${ room } roomID found.` );
//             }
//         }
//     }

//     var keys = Object.keys( count );
//     length = keys.length;

//     for ( var i = 0; i < length; i++ )
//     {
//         var keyValue = keys[ i ];

//         ClientManager._clientsCount[ keyValue ] = count[ keyValue ];
//     }
// }

// ClientManager.ioEventHandler = [];

// socket 에 변수 하나 넣은 후 클라 초기화됫는지 확인 바람;
// client init 확인문 넣기
// 사용가능한 닉인지 따로 함수 만들기;

/*

// ClientManager loop 만들기
hook.register( "TickTok", function( )
{
    //this._sessions.splice( this._sessions.indexOf( ipAddress ), 1 );
    //   this.CLIENTS.splice( this.CLIENTS.indexOf( client ), 1 );
    // console.log( ClientManager.CLIENTS );
} );

ClientManager.isAuthenticatedSession = function( socket, callback )
{
    // console.log( socket.handshake.session );
    // console.log( "isAuthed : " + ( socket.request.session.passport.user !== undefined ) )
    socket.handshake.session.reload( function( )
    {
        try
        {
            callback( socket.handshake.session.passport.user !== undefined );
            // return socket.request.session.passport.user !== undefined;
        }
        catch ( exception )
        {
            callback( false );
        }
    } );
}


hook.register( "ClientPostConnected", function( socket, client )
{
    socket.on( "regu.requestUserInfo", function( data )
    {
        if ( !reguUtil.isValidSocketData( data,
            {
                userID: "string"
            } ) )
        {
            Logger.write( Logger.LogType.Important, `[Client] UserInfo request rejected! -> (#DataIsNotValid) ${ client.information() }` );
            return;
        }

        var targetClient = ClientManager.findByUserID( data.userID, client.room );

        if ( targetClient && targetClient.initialized )
        {
            if ( targetClient.room !== client.room )
            {
                Logger.write( Logger.LogType.Important, `[Client] WARNING! : UserInfo request -> (#TargetClientRoomAndClientRoomMismatch) ${ client.information( ) }` );
            }

            console.log( targetClient.provider );

            socket.emit( "regu.receiveUserInfo",
            {
                success: true,
                name: targetClient.name,
                ipAddress: reguUtil.censorshipIP( targetClient.ipAddress ),
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

ClientManager.getAllSockets = function( )
{
    return Main.ioSSL.sockets.sockets;
}

ClientManager.getSocketBySessionID = function( sessionID )
{
    var sockets = Main.ioSSL.sockets.sockets;

    var keys = Object.keys( sockets );
    var length = keys.length;
    var socketsResult = [ ];

    for ( var i = 0; i < length; i++ )
    {
        if ( sockets[ keys[ i ] ].handshake.sessionID === sessionID )
            socketsResult.push( sockets[ keys[ i ] ] );
    }

    return socketsResult.length != 0 ? socketsResult : null;
}

ClientManager.getClientBySessionID = function( sessionID )
{
    var clients = this.CLIENTS;
    var length = clients.length;

    for ( var i = 0; i < length; i++ )
    {
        if ( clients[ i ]._socket.handshake.sessionID === sessionID )
            return clients[ i ];
    }

    return null;
}

ClientManager.join = function( roomID, req, res, ipAddress )
{
    var preClientConnect = hook.run( "CanPreClientConnect", ipAddress );

    req.session.touch( );

    if ( preClientConnect && preClientConnect.accept === false )
    {
        res.redirect( "/?error=" + preClientConnect.reason );
        Logger.write( Logger.LogType.Warning, `[Client] Client pre rejected! -> (#${ preClientConnect.reason }) ${ ipAddress }` );
        return;
    }

    Tracker.getCountryCode( ipAddress, function( countryCode )
    {
        var preClientConnection = ClientManager.preClientConnection( roomID, req.sessionID, req.user.id, ipAddress, countryCode );

        if ( !preClientConnection.accept )
        {
            res.redirect( "/?error=" + preClientConnection.reason );
            Logger.write( Logger.LogType.Warning, `[Client] Client rejected! -> (#${ preClientConnection.reason }) ${ ipAddress }` );
            return;
        }

        res.render( "player",
        {
            roomID: roomID
        } );
    } );
}

/*
ClientManager.ioEventConnection = function( socket )
{
    var client;

    socket.on( "disconnect", ( ) =>
    {
        console.log( "onDisconnect" );
        ClientManager.onDisconnect( client, socket );
    } );

    socket.on( "regu.join", function( data )
    {
        var roomID = socket.handshake.session.roomID;

        console.log( socket.handshake.session );
        console.log( roomID );

        hook.run( "ClientPreConnected" );

        client = new Client( socket );

        client.initialize( roomID );

        ClientManager.CLIENTS.push( client );
        ClientManager._sessions.push(
        {
            passport: socket.handshake.session.passport,
            sessionID: socket.handshake.session.sessionID
        } );

        // ClientManager.refreshCount( );
        // 이거 좀 최적화하기.. clientCountUpdate
        ClientManager.sendMessageToAll( client.room, "regu.clientCountUpdate",
        {
            count: ClientManager.getCount( client.room ),
            roomTitle: RoomManager.getDataByID( client.room )
                .title
        } );

        socket.reguClient = client;

        hook.run( "ClientPostConnected", socket, client );

        socket.emit( "regu.joinResult" );

        var allClientCount = ClientManager.getCount( );
        var roomClientCount = ClientManager.getCount( client.room );

        Logger.write( Logger.LogType.Event, `[Client] New client connected to '${ client.room }' -> ${ client.information( false ) } ->>> room: ${ roomClientCount - 1 } -> ${ roomClientCount } all: ${ allClientCount }` );
    } );
}

Main.ioSSL.on( "connection", ClientManager.ioEventConnection );

Main.ioSSL.set( "authorization", function( handshakeData, next )
{
    //use handshakeData to authorize this connection
    //Node.js style "cb". ie: if auth is not successful, then cb('Not Successful');
    //else cb(null, true); //2nd param "true" matters, i guess!!
    next( null, true );
} );
*/
// module.exports = ClientManager;