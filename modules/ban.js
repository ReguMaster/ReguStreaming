/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const BanManager = {};

const FileStorage = require( "../filestorage" );
const hook = require( "../hook" );
const reguUtil = require( "../util" );
const Logger = require( "./logger" );
// const nodeARP = require( "node-arp" );

BanManager._list = [ ];

FileStorage.loadAsync( "ban", "json", [ ], ( data ) => BanManager._list = data );

BanManager.register = function( identifierArray, duration, reason )
{
    if ( this.getData( identifierArray ) )
        BanManager.remove( identifierArray );

    var id = this.generateID( identifierArray[ 0 ] || identifierArray[ 1 ] );

    this._list.push(
    {
        id: id,
        identifier: identifierArray,
        duration: 0,
        reason: reason
    } );

    FileStorage.save( "ban", this._list );

    Logger.write( Logger.LogType.Warning, `[Ban] Ban registered. -> ${ identifierArray } -> ${ duration } -> '${ reason }'` );

    return id;
}

BanManager.generateID = function( identifier )
{
    return "ban-" + reguUtil.md5( "REGUSTREAMING_" + identifier );
}

BanManager.getCount = function( )
{
    return this._list.length;
}

BanManager.getAll = function( )
{
    return this._list;
}

BanManager.remove = function( identifier )
{
    var length = this._list.length;
    var temp = identifier;

    if ( typeof identifier === "object" )
        identifier = identifier[ 0 ] || identifier[ 1 ];

    for ( var i = 0; i < length; i++ )
    {
        if ( this._list[ i ].identifier.length === 2 && ( this._list[ i ].identifier[ 0 ] === identifier || this._list[ i ].identifier[ 1 ] === identifier ) )
        {
            this._list.splice( i, 1 );
            break;
        }
    }

    FileStorage.save( "ban", this._list );

    Logger.write( Logger.LogType.Warning, `[Ban] Ban removed. -> ${ temp }` );
}

BanManager.getDataByID = function( id )
{
    var banData = null;

    this._list.some( function( data )
    {
        if ( data.id === id )
        {
            banData = data;
            return true;
        }
    } );

    return banData ? Object.assign(
        banData,
        {
            isBanned: true
        } ) : banData;
}

BanManager.getData = function( identifier )
{
    var banData = null;

    if ( typeof identifier === "object" )
    {
        this._list.some( function( data )
        {
            if ( data.identifier.length === 2 && ( data.identifier[ 0 ] === identifier[ 0 ] || data.identifier[ 1 ] === identifier[ 1 ] ) )
            {
                banData = data;
                return true;
            }
        } );
    }
    else if ( typeof identifier === "string" )
    {
        if ( identifier.substring( 0, 4 ) === "ban-" )
        {
            this._list.some( function( data )
            {
                if ( data.id === identifier )
                {
                    banData = data;
                    return true;
                }
            } );
        }
        else
        {
            this._list.some( function( data )
            {
                if ( data.identifier.length === 2 && ( data.identifier[ 0 ] === identifier || data.identifier[ 1 ] === identifier ) )
                {
                    banData = data;
                    return true;
                }
            } );
        }
    }

    return banData ? Object.assign(
        banData,
        {
            isBanned: true
        } ) : banData;
}

hook.register( "OnClientConnect", function( ipAddress, userID, roomID )
{
    var banInformation = BanManager.getData( [ userID, ipAddress ] );

    if ( banInformation && banInformation.isBanned )
    {
        return {
            accept: false,
            critical: true,
            id: banInformation.id,
            reason: "귀하의 계정에 서비스 약관 위반 내역이 있습니다. 그 결과로 계정이 정지되었으며 더 이상 서비스를 이용할 수 없습니다. <br />자세한 정보는 다음 <a class='aRegu' target='_blank' href='https://regustreaming.oa.to/ban/" + banInformation.id + "'>페이지</a>를 참고하세요."
        };
    }
} );

hook.register( "CanLoginAccount", function( ipAddress, userID, profile )
{
    var banInformation = BanManager.getData( [ userID, ipAddress ] );

    console.log( userID )

    if ( banInformation && banInformation.isBanned )
    {
        return {
            isBanned: true,
            id: banInformation.id,
            reason: "귀하의 계정에 서비스 약관 위반 내역이 있습니다. 그 결과로 계정이 정지되었으며 더 이상 서비스를 이용할 수 없습니다. <br />자세한 정보는 다음 <a class='aRegu' target='_blank' href='https://regustreaming.oa.to/ban/" + banInformation.id + "'>페이지</a>를 참고하세요."
        };
    }
} );

module.exports = BanManager;