/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const FileUploadHandler = {};
const path = require( "path" );
const fileStream = require( "fs" );
const Logger = require( "./logger" );
const Database = require( "./db" );
const ChatManager = require( "./chat" );
const hook = require( "../hook" );
const util = require( "../util" );
const readChunk = require( "read-chunk" );
const fileType = require( "file-type" );
const SocketIOFileUpload = require( "socketio-file-upload" );

FileUploadHandler.FileNameFormat = "uf_%s";
FileUploadHandler.FileDirectory = "./userfiles";
FileUploadHandler.allowFileList = [
    "png",
    "gif",
    "jpg",
    "jpeg"
];
FileUploadHandler.statusCode = {
    typeNotAllowedError: 0,
    databaseError: 1,
    serverError: 2
}

hook.register( "PostClientConnected", function( client, socket )
{
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
        var fileName = util.sha256( path.basename( data.file.name ) + "_" + data.file.size ) + extension;

        data.file.type = extension.substring( 1 );
        data.file.originalName = data.file.name;
        data.file.name = fileName;
    } );

    uploader.on( "saved", function( event )
    {
        // *TODO: 서버사이드 파일 거부 추가바람 (by 사이즈)
        var id = util.sha1( event.file.name );

        // console.log( event );

        readChunk( event.file.pathName, 0, 4100 )
            .then( function( buffer )
            {
                var magicNumberFileType = fileType( buffer );

                if ( !magicNumberFileType || FileUploadHandler.allowFileList.indexOf( event.file.type ) === -1 || FileUploadHandler.allowFileList.indexOf( magicNumberFileType.ext ) === -1 )
                {
                    Logger.write( Logger.LogType.Warning, `[FileUpload] FileUpload rejected. (error:typeNotAllowedError, extension:${ event.file.type }, magicNumber:${ magicNumberFileType ? magicNumberFileType.ext : "unknown" }) ${ client.information( ) }` );
                    socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.typeNotAllowedError );

                    return;
                }

                // 파일 확장자와 매직넘버 불일치, 사용자가 임의로 확장자를 바꿈 -> 보안 로그는 남기되 업로드는 허가
                if ( event.file.type !== magicNumberFileType.ext )
                {
                    Logger.write( Logger.LogType.Important, `[FileUpload] WARNING: File extension and magic number mismatch! (id:${ id }, extension:${ event.file.type }, magicNumber:${ magicNumberFileType.ext }) ${ client.information( ) }` );
                }

                Database.queryWithEscape( `INSERT IGNORE INTO userfile ( _id, _file, _originalFileName, _type ) VALUES ( ?, ?, ?, ? )`, [ id, event.file.name, event.file.originalName, event.file.type ], function( result )
                {
                    if ( result && result.affectedRows === 1 )
                    {
                        ChatManager.emitImage( client, id );
                        Logger.write( Logger.LogType.Event, `[FileUpload] File uploaded. ${ client.information() } -> ${ event.file.name }:${ id }` );
                    }
                }, function( err )
                {
                    socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.databaseError );
                } );
            } )
            .catch( function( err )
            {
                Logger.write( Logger.LogType.Error, `[FileUpload] Failed to upload file. (error:${ err.stack }) ${ client.information( ) }` );
                socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.serverError );
            } );
    } );

    uploader.on( "error", ( event ) =>
    {
        socket.emit( "notification",
        {
            message: "죄송합니다, 파일 업로드에 실패했습니다. " + event.error.message
        } );

        Logger.write( Logger.LogType.Error, `[FileUpload] Failed to upload file. ${ client.information( ) }\n${ event.error.message }` );
    } );

    socket.on( "RS.uploadFile", ( data ) =>
    {
        if ( !util.isValidSocketData( data,
            {
                name: "string",
                size: "number",
                lastModified: "number"
            } ) )
        {
            Logger.write( Logger.LogType.Important, `[FileUpload] FileUpload rejected. (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }

        var fileName = util.sha256( path.basename( data.name ) + "_" + data.size );

        Database.queryWithEscape( `SELECT _id from userfile WHERE _file = ?`, [ fileName ], function( result )
        {
            if ( result && result.length === 1 )
            {
                socket.emit( "RS.uploadFileReceive",
                {
                    exists: true
                } );

                ChatManager.emitImage( client, result[ 0 ]._id );
            }
            else
            {
                socket.emit( "RS.uploadFileReceive",
                {
                    exists: false
                } );
            }
        }, function( err )
        {
            socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.databaseError );
        } );
    } );

    client.registerConfig( "uploader", uploader );


} );

module.exports = FileUploadHandler;