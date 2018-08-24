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
const superagent = require( "superagent" );
const fileType = require( "file-type" );
const imageSize = util.promisify( require( "image-size" ) );
const SocketIOFileUpload = require( "socketio-file-upload" );
const apiConfig = require( "../const/config" );

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
    serverError: 2,
    imageSizeError: 3
}

FileUploadHandler.checkAdultImage = function( client, fileLocation, callback )
{
    superagent.post( "https://kapi.kakao.com/v1/vision/adult/detect" )
        .type( "multipart/form-data" )
        .attach( "file", fileLocation )
        .set( "Authorization", "KakaoAK " + apiConfig.Kakao.clientID )
        .then( function( res )
        {
            if ( res.status !== 200 )
                return;

            callback( JSON.parse( res.text )
                .result.adult >= 0.8 );
        } )
        .catch( function( err )
        {
            Logger.write( Logger.LogType.Error, `[FileUpload] Failed to process FileUploadHandler.checkAdultImage (error:${ err.stack }) ${ client.information( ) }` );

            callback( false );
        } );
}

hook.register( "PostClientConnected", function( client, socket )
{
    var uploader = new SocketIOFileUpload( );
    uploader.dir = FileUploadHandler.FileDirectory;
    uploader.listen( socket );

    // *TODO: 서버사이드 파일 거부 추가바람 (by 사이즈)
    uploader.uploadValidator = function( event, callback )
    {
        // console.log( event );
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

    uploader.on( "saved", async function( event ) // *WARNING: 파일 업로드 성능 저하 원인이 될 수 있음 (async). -> async 임시 제거, Electron 호환성 문제 발생
        {
            var id = util.sha1( event.file.name );
            var size = await imageSize( event.file.pathName );

            if ( size.width > 2048 || size.height > 2048 )
            {
                Logger.write( Logger.LogType.Warning, `[FileUpload] FileUpload rejected. (error:imageSizeError, width:${ size.width }, height:${ size.height }) ${ client.information( ) }` );
                socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.imageSizeError );

                return;
            }

            readChunk( event.file.pathName, 0, 4100 )
                .then( function( buffer )
                {
                    var magicNumberFileType = fileType( buffer );

                    // 보안 로그 -> 사용자가 임의로 패킷을 정의했을 가능성이 있음.
                    if ( !magicNumberFileType || FileUploadHandler.allowFileList.indexOf( event.file.type ) === -1 || FileUploadHandler.allowFileList.indexOf( magicNumberFileType.ext ) === -1 )
                    {
                        Logger.write( Logger.LogType.Important, `[FileUpload] FileUpload rejected. (error:typeNotAllowedError, extension:${ event.file.type }, magicNumber:${ magicNumberFileType ? magicNumberFileType.ext : "unknown" }) ${ client.information( ) }` );
                        socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.typeNotAllowedError );

                        // *TODO: 파일 확장자가 올바르지 않을 시 업로드 된 파일 삭제 추가
                        return;
                    }

                    // 파일 확장자와 매직넘버 불일치, 사용자가 임의로 확장자를 바꿈 -> 보안 로그는 남기되 업로드는 허가
                    if ( event.file.type !== magicNumberFileType.ext )
                        Logger.write( Logger.LogType.Important, `[FileUpload] WARNING: File extension and magic number mismatch! (id:${ id }, extension:${ event.file.type }, magicNumber:${ magicNumberFileType.ext }) ${ client.information( ) }` );

                    var onCheck = function( isAdult )
                    {
                        Database.executeProcedure( "REGISTER_USERFILE", [ id, event.file.name, event.file.originalName, event.file.type, isAdult ? "1" : "0" ], function( status, data )
                        {
                            if ( status === "success" )
                            {
                                ChatManager.emitImage( client, id, isAdult );
                                Logger.write( Logger.LogType.Event, `[FileUpload] File uploaded. ${ client.information() } -> ${ event.file.name }:${ id }` );
                            }
                        }, function( err )
                        {
                            socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.databaseError );
                        } );
                    };

                    if ( event.file.type != "gif" )
                    {
                        FileUploadHandler.checkAdultImage( client, event.file.pathName, function( isAdult )
                        {
                            onCheck( isAdult );
                        } );
                    }
                    else
                        onCheck( false );
                } )
                .catch( function( err )
                {
                    Logger.write( Logger.LogType.Error, `[FileUpload] Failed to upload file. (error:${ err.stack }) ${ client.information( ) }` );
                    socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.serverError );
                } );
        } );

    uploader.on( "error", function( event )
    {
        socket.emit( "RS.uploadFileError", FileUploadHandler.statusCode.serverError );

        Logger.write( Logger.LogType.Error, `[FileUpload] Failed to upload file. (error:${ event.error.message }) ${ client.information( ) }` );
    } );

    socket.on( "RS.uploadFile", function( data )
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

        Database.executeProcedure( "FIND_USERFILE", [ util.sha256( path.basename( data.name ) + "_" + data.size ) ], function( status, data )
        {
            if ( status === "success" && data.length > 0 )
            {
                socket.emit( "RS.uploadFileReceive",
                {
                    exists: true
                } );

                ChatManager.emitImage( client, data[ 0 ]._id, data[ 0 ]._adult === 1 );
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

    // client.registerConfig( "uploader", uploader );
} );

module.exports = FileUploadHandler;