/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const Database = {};
const pg = require( "pg" );
const hook = require( "../hook" );
const Logger = require( "./logger" );
const MySQL = require( "mysql" );
const DBInfo = require( "../db.json" );

Database._connection = null
Database._connected = false;

Database.onConnect = function( err )
{
    if ( err )
    {
        Database._connected = false;

        setTimeout( function( )
        {
            Logger.write( Logger.LogType.Warning, `[MySQL] Reconnecting ...` );
            Database.connect( );
        }, 3000 );

        Logger.write( Logger.LogType.Error, `[MySQL] Failed to connect to MySQL! : ${ err.message }` );
        hook.run( "MySQLConnected", err );
        return;
    }

    Database._connected = true;
    Logger.write( Logger.LogType.Info, `[MySQL] MySQL connected to ${ DBInfo.user }@${ DBInfo.host }.` );
    hook.run( "MySQLConnected" );
}

Database.connect = function( )
{
    Database._connection = MySQL.createConnection( DBInfo );
    Database._connection.connect( Database.onConnect );
    Database._connection.on( "error", function( err )
    {
        Logger.write( Logger.LogType.Error, `[MySQL] ERROR! : ${ err.message }` );

        setTimeout( function( )
        {
            Logger.write( Logger.LogType.Warning, `[MySQL] Reconnecting ...` );
            Database.connect( );
        }, 3000 );
    } );
}

Database.query = function( sql, onResult, onError )
{
    this._connection.query( sql, function( err, result, fields )
    {
        if ( err )
        {
            if ( onError )
                onError( err );

            Logger.write( Logger.LogType.Error, `[MySQL] Failed to process query!\n${ sql }\n-> ${ err }` );
            return;
        }

        if ( onResult ) // 여기에 query success 관련 파라매터 넘겨주기
            onResult( result );

        Logger.write( Logger.LogType.Info, `[MySQL] Query executed. ${ sql }` );
    } );
}

Database.queryWithEscape = function( sql, escape, onResult, onError )
{
    this._connection.query( sql, escape, function( err, result, fields )
    {
        if ( err )
        {
            if ( onError )
                onError( err );

            Logger.write( Logger.LogType.Error, `[MySQL] Failed to process query!\n${ sql }\n-> ${ err }` );
            return;
        }


        if ( onResult ) // 여기에 query success 관련 파라매터 넘겨주기
            onResult( result );

        Logger.write( Logger.LogType.Info, `[MySQL] Query executed. ${ sql } with ${ escape }` );
    } );
}

Database._storedProcedure = {};

Database.registerProcedure = function( id, sql )
{
    this._storedProcedure[ id ] = {
        sql: sql
    };
}

Database.executeProcedure = function( id, args, onResult, onError )
{
    if ( args )
    {
        Database.queryWithEscape( this._storedProcedure[ id ].sql, args, onResult, onError );
    }
    else
    {
        Database.query( this._storedProcedure[ id ].sql, onResult, onError );
    }
}

Database.registerProcedure( "FIND_USER_BY_IPADDRESS", `SELECT * FROM user WHERE _ipAddress = ?` );
Database.registerProcedure( "REGISTER_GUEST", `INSERT IGNORE INTO user ( _provider, _name, _tag, _ipAddress ) VALUES ( ?, ?, ?, ? )` );

// Database.build = function( )
// {
//     return new Database.QueryBuilder( );
// }

// Database.QueryBuilder = function( )
// {
//     this.select = "";
//     this.from = "";
//     this.where = "";
// }

// Database.QueryBuilder.prototype = {
//     constructor: Database.QueryBuilder,
//     select: function( selectTarget )
//     {
//         this.mode = "select";

//         return this;
//     },
//     from: function( fromTable )
//     {
//         this.from = fromTable;
//         return this;
//     },
//     insert: function( )
//     {
//         this.mode = "insert";

//         return this;
//     },
//     where: function( where )
//     {
//         this.where = where;
//         return this;
//     },
//     onError: function( err )
//     {
//         this.onError
//     },
//     execute: function( )
//     {
//         var sql =
//             console.log( "executed.", this.mode );
//     }
// }

Database.connect( );

module.exports = Database;