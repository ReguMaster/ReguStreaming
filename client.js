/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

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
            Logger.write( Logger.type.Error, `[Client] Failed to emit data! -> ${ this.information( ) }` );
    }

    // emitAll( messageID, data, filterArray )
    // {
    //     if ( this._socket )
    //     {
    //         ClientManager.sendMessageToAll( this.room, messageID, data, filterArray );
    //     }
    //     else
    //         Logger.write( Logger.type.Error, `[Client] Failed to emit data! -> ${ this.information( ) }` );
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
        Logger.write( Logger.type.Warning, `[Client] Client kicked! -> ${ this.information( ) } -> '${ reason }'` );
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
        return "made in abyss";
    }

    // client toString 시 정보 반환
    // 파일 다시 짜기
}