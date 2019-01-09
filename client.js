/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ClientManager = {};
const BanManager = require( "./modules/ban" );
const Logger = require( "./modules/logger" );
const hook = require( "./hook" );
const Database = require( "./modules/db" );
const timer = require( "./timer" );

ClientManager.CLIENT_EXTRA_VAR_STOREAGE = {};

module.exports = class Client
{
    constructor( socket )
    {
        this._socket = socket;
        this._config = {};
    }

    initialize( roomID, platform, roomConfig )
    {
        // too long!
        this._passport = this._socket.handshake.session.passport;

        this._userName = this._passport.user.displayName;
        this._userID = this._passport.user.id.toString( );
        this._roomID = roomID;
        this._platform = platform;
        this._rank = this._userID === "76561198011675377" || this._userID === "972122558077198338" ? "admin" : "user";
        this._extraVar = {};
        this._initialized = true;

        if ( !ClientManager.CLIENT_EXTRA_VAR_STOREAGE[ this._userID ] )
            ClientManager.CLIENT_EXTRA_VAR_STOREAGE[ this._userID ] = {};
        else
        {
            var myVar = ClientManager.CLIENT_EXTRA_VAR_STOREAGE[ this._userID ];
            var keys = Object.keys( myVar );
            var keysLength = keys.length;

            for ( var i = 0; i < keysLength; i++ )
            {
                var v = myVar[ keys[ i ] ];

                this.setExtraVar( v.varName, v.value, v.sendToClient, v.shouldStore );
            }
        }

        var self = this;

        self.emit( "RS.initialize",
        {
            userSetting:
            {},
            roomConfig: roomConfig
        } );

        return;
        Database.executeProcedure( "FETCH_USER_SETTING", [ this.userID ], function( status, result, fields ) {

        }, function( )
        {
            self.emit( "RS.initialize",
            {
                userSetting:
                {},
                roomConfig: roomConfig
            } );
        } );
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

    get platform( )
    {
        return this._platform;
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

    emit( eventID, data, ack )
    {
        if ( this._socket )
        {
            if ( ack && typeof ack !== "undefined" )
                this._socket.emit( eventID, data, ack );
            else
                this._socket.emit( eventID, data );
        }
        else
            Logger.error( `[Client] Failed to Socket [${ eventID }] emission! ${ this.information( ) }` );
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
        if ( this._socket )
            this._socket.disconnect( );
    }

    logout( )
    {
        if ( this._socket && this._socket.handshake && this._socket.handshake.session )
            this._socket.handshake.session.destroy( );
    }

    setExtraVar( varName, value, sendToClient = false, shouldStore = false )
    {
        if ( value === VAR_NULL )
        {
            this._extraVar[ varName ] = null;
            delete this._extraVar[ varName ];
        }
        else
        {
            this._extraVar[ varName ] = value;
        }

        if ( sendToClient )
            this.emit( "RS.syncClientExtraVar",
            {
                varName: varName,
                value: value
            } );

        if ( shouldStore )
        {
            if ( !ClientManager.CLIENT_EXTRA_VAR_STOREAGE[ this._userID ] )
                ClientManager.CLIENT_EXTRA_VAR_STOREAGE[ this._userID ] = {};

            ClientManager.CLIENT_EXTRA_VAR_STOREAGE[ this._userID ][ varName ] = {
                varName: varName,
                value: value,
                sendToClient: sendToClient,
                shouldStore: shouldStore
            };
        }

        Logger.info( `[Client] Clients extra var changed. [${ varName }] -> [${ value === VAR_NULL ? "VAR_NULL" : value }] (sendToClient: ${ sendToClient.toString( ) }, shouldStore: ${ shouldStore.toString( ) }) ${ this.information( ) }` );
    }

    getExtraVar( varName, defaultValue )
    {
        var value = this._extraVar[ varName ];

        if ( !this._extraVar.hasOwnProperty( varName ) || typeof value === "undefined" )
            return defaultValue;

        return value;
    }

    toString( )
    {
        return "[Object client]";

        // ^-^
        // return "made in abyss";
    }

    setSetting( )
    {

    }

    pushWarning( )
    {
        var self = this;

        this.setExtraVar( "warn", this.getExtraVar( "warn", 0 ) + 1, false );

        var warn = this.getExtraVar( "warn", 0 );

        if ( warn % 3 === 0 && ( Date.now( ) - this.getExtraVar( "lastWarnModal", 0 ) > 3000 ) )
        {
            this.setExtraVar( "lastWarnModal", Date.now( ) );
            this.sendModal( "경고", "최근 이 계정에서 비정상적인 패킷 활동을 자주 감지했습니다, 귀하의 최근 활동이 관리자에게 보고되었습니다,<br />이러한 보고가 계속 누적되면 <p style='color: red; display: inline-block;'>서비스 약관 위반의 결과로 계정이 정지될 수 있습니다.</p>" );

            Logger.impor( `[Client] Clients warning reached! (warn: ${ warn }) ${ this.information( ) }` );
        }

        if ( !timer.exists( "RS.client." + this.userID + ".popWarning" ) )
        {
            timer.create( "RS.client." + this.userID + ".popWarning", 15000, 0, function( )
            {
                if ( ( warn = self.getExtraVar( "warn", 0 ) ) > 0 )
                {
                    self.setExtraVar( "warn", warn = ( warn - 1 ), false );

                    Logger.impor( `[Client] Clients warning deleted! (warn: ${ warn }) ${ self.information( ) }` );

                    if ( ( warn = self.getExtraVar( "warn", 0 ) ) <= 0 )
                    {
                        self.setExtraVar( "warn", VAR_NULL, false );
                        timer.remove( "RS.client." + self.userID + ".popWarning", "warning is zero." );
                    }
                }
            } );
        }
    }

    popWarning( )
    {

    }

    sendModal( title, body, closeText )
    {
        //data.title, data.body, data.closeText
        this.emit( "RS.modal",
        {
            title: title,
            body: body,
            closeText: closeText
        } );

        Logger.info( `[Client] Modal emissioned. (title: ${ title }, body: ${ body })` );
    }

    // client toString 시 정보 반환 -> success
    // 파일 다시 짜기
}