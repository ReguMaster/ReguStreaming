/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const FileUploadHandler = {};
const path = require( "path" );
const fileStream = require( "fs" );
const Main = require( "../app" );
const Logger = require( "./logger" );
const Database = require( "./db" );
const ClientManager = require( "../client" );
const ChatManager = require( "./chat" );
const hook = require( "../hook" );
const reguUtil = require( "../util" );
const util = require( "util" );

var SocketIOFileUpload = require( "socketio-file-upload" );

FileUploadHandler.test = 0;
FileUploadHandler.FileNameFormat = "uf_%s";
FileUploadHandler.FileDirectory = "./userfiles";

hook.register( "PostClientConnected", function( client, socket )
{
    var ipAddress = socket.handshake.address;

    var uploader = new SocketIOFileUpload( );
    uploader.dir = FileUploadHandler.FileDirectory;
    uploader.listen( socket );
    uploader.uploadValidator = function( event, callback )
    {
        callback( true );
    };

    uploader.on( "start", function( data )
    {
        // 경우에따라 파일 내용으로 수정해야함.
        var extension = path.extname( data.file.name );
        var fileName = reguUtil.sha256( path.basename( data.file.name ) + "_" + data.file.size ) + extension;

        data.file.type = extension.substring( 1 );
        data.file.originalName = data.file.name;
        data.file.name = fileName;
    } );

    uploader.on( "saved", function( event )
    {
        // 서버사이드 파일 거부 추가바람
        var id = reguUtil.sha1( event.file.name );

        Database.queryWithEscape( `INSERT IGNORE INTO userfile ( _id, _file, _originalFileName, _type ) VALUES ( ?, ?, ?, ? )`, [ id, event.file.name, event.file.originalName, event.file.type ], function( result )
        {
            if ( result && result.affectedRows === 1 )
            {
                ChatManager.emitImage( client, id );
                Logger.write( Logger.LogType.Event, `[FileUpload] File uploaded. ${ client.information() } -> ${ event.file.name }:${ id }` );
            }
        }, function( err )
        {
            socket.emit( "notification",
            {
                message: "죄송합니다, 파일 업로드에 실패했습니다. 데이터베이스 오류입니다."
            } );
        } );
    } );

    // Error handler:
    uploader.on( "error", ( event ) =>
    {
        socket.emit( "notification",
        {
            message: "죄송합니다, 파일 업로드에 실패했습니다. " + event.error.message
        } );

        Logger.write( Logger.LogType.Error, `[FileUpload] Failed to upload file. ${ client.information( ) }\n${ event.error.message }` );
    } );

    // socket.on( "imageEmit", ( data ) =>
    // {
    //     if ( fileStream.existsSync( path.join( FileUploadHandler.FileDirectory, fileName + path.extname( data.fileName ) ) ) )
    //         ChatManager.emitImage( client.room, client, data.fileName );
    // } );

    socket.on( "regu.uploadFile", ( data ) =>
    {
        if ( !reguUtil.isValidSocketData( data,
            {
                name: "string",
                size: "number",
                lastModified: "number"
            } ) )
        {
            Logger.write( Logger.LogType.Important, `[FileUpload] FileUpload rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }

        var fileName = reguUtil.sha256( path.basename( data.name ) + "_" + data.size );

        Database.queryWithEscape( `SELECT _id from userfile WHERE _file = ?`, [ fileName ], function( result )
        {
            if ( result && result.length === 1 )
            {
                socket.emit( "regu.uploadFileReceive",
                {
                    exists: true
                } );

                ChatManager.emitImage( client, result[ 0 ]._id );
            }
            else
            {
                socket.emit( "regu.uploadFileReceive",
                {
                    exists: false
                } );
            }
        }, function( err )
        {
            socket.emit( "notification",
            {
                message: "죄송합니다, 파일 업로드에 실패했습니다. 데이터베이스 오류입니다."
            } );
        } );

        // fileStream.stat( total, function( err, stat )
        // {
        //     console.log( stat );
        //     if ( err === null )
        //     {
        //         socket.emit( "regu.uploadFileReceive",
        //         {
        //             exists: true
        //         } );

        //         ChatManager.emitImage( client.room, client, fileName + path.extname( data.name ) );
        //     }
        //     else
        //         socket.emit( "regu.uploadFileReceive",
        //         {
        //             exists: false
        //         } );
        // } );
    } );

    client.registerConfig( "uploader", uploader );


} );

module.exports = FileUploadHandler;