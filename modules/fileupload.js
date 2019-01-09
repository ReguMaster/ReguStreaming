/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const FileUploadHandler = {};
const Server = require( "../server" );
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
const mime = require( "mime-types" );
const multer = require( "multer" );
const storage = multer.diskStorage(
{
    destination: function( req, file, cb )
    {
        cb( null, "./files" )
    },
    filename: function( req, file, cb )
    {
        var fileName = util.sha1( `${ file.originalname }_${ file.mimetype }_${ Date.now }` );

        file.id = fileName;
        file.extension = mime.extension( file.mimetype );

        cb( null, file.id + "." + file.extension )
    }
} )
const uploadHandler = multer(
{
    limits:
    {
        fileSize: 26214400, // 25Mbytes
        files: 1
    },
    storage: storage,
    fileFilter: function( req, file, callback )
    {
        // return callback( new Error( "wow" ) )
        callback( null, true );
    }
} );

hook.register( "PostSetGlobalVar", function( varName, value )
{
    if ( varName === "FileUploadHandler.FILE_SIZE_LIMIT" )
    {
        uploadHandler.limits = {
            fileSize: value,
            files: 1
        };
    }
} );

/*
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
}*/
FileUploadHandler.fileType = {
    raw: 0,
    image: 1,
    video: 2
}

FileUploadHandler.calculateFileType = function( mimeType )
{
    if ( mimeType.indexOf( "image/" ) > -1 )
        return this.fileType.image;
    else if ( mimeType.indexOf( "video/" ) > -1 )
        return this.fileType.video;
    else
        return this.fileType.raw;
}

FileUploadHandler.checkAdultImage = function( client, fileLocation, callback )
{
    if ( Server.getGlobalVar( "FileUploadHandler.FORCE_NONE_ADULT", false ) )
        return callback( false );

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
            Logger.write( Logger.type.Error, `[FileUpload] Failed to process FileUploadHandler.checkAdultImage (error:${ err.stack }) ${ client.information( ) }` );

            callback( false );
        } );
}

hook.register( "PostClientConnected", function( client, socket )
{
    /*
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

        data.file.type = extension.substring( 1 )
            .toLowerCase( );
        data.file.originalName = data.file.name;
        data.file.name = fileName;
    } );

    // *TODO: 최적화 필요함
    // *TODO: 재구현 필요함
    uploader.on( "saved", async function( event ) // *WARNING: 파일 업로드 성능 저하 원인이 될 수 있음 (async). -> async 임시 제거, Electron 호환성 문제 발생
        {
            var id = util.sha1( event.file.name );
            var size = await imageSize( event.file.pathName );

            if ( size.width > 2048 || size.height > 2048 )
            {
                Logger.write( Logger.type.Warning, `[FileUpload] FileUpload rejected. (error:imageSizeError, width:${ size.width }, height:${ size.height }) ${ client.information( ) }` );
                socket.emit( "RS.fileUploadError", FileUploadHandler.statusCode.imageSizeError );

                return;
            }

            readChunk( event.file.pathName, 0, 4100 )
                .then( function( buffer )
                {
                    var magicNumberFileType = fileType( buffer );

                    // 보안 로그 -> 사용자가 임의로 패킷을 정의했을 가능성이 있음.
                    if ( !magicNumberFileType || FileUploadHandler.allowFileList.indexOf( event.file.type ) === -1 || FileUploadHandler.allowFileList.indexOf( magicNumberFileType.ext ) === -1 )
                    {
                        Logger.write( Logger.type.Important, `[FileUpload] FileUpload rejected. (error:typeNotAllowedError, extension:${ event.file.type }, magicNumber:${ magicNumberFileType ? magicNumberFileType.ext : "unknown" }) ${ client.information( ) }` );
                        socket.emit( "RS.fileUploadError", FileUploadHandler.statusCode.typeNotAllowedError );

                        // *TODO: 파일 확장자가 올바르지 않을 시 업로드 된 파일 삭제 추가
                        return;
                    }

                    // 파일 확장자와 매직넘버 불일치, 사용자가 임의로 확장자를 바꿈 -> 보안 로그는 남기되 업로드는 허가
                    if ( event.file.type !== magicNumberFileType.ext )
                        Logger.write( Logger.type.Important, `[FileUpload] WARNING: File extension and magic number mismatch! (id:${ id }, extension:${ event.file.type }, magicNumber:${ magicNumberFileType.ext }) ${ client.information( ) }` );

                    var onCheck = function( isAdult )
                    {
                        Database.executeProcedure( "REGISTER_USERFILE", [ id, event.file.name, event.file.originalName, event.file.type, isAdult ? "1" : "0" ], function( status, data )
                        {
                            if ( status === "success" )
                            {
                                ChatManager.emitImage( client, id, isAdult );

                                // socket.emit( "RS.fileUploadReceive", true );
                                Logger.write( Logger.type.Event, `[FileUpload] File uploaded. ${ client.information() } -> ${ event.file.name }:${ id }` );
                            }
                            else
                            {
                                // socket.emit( "RS.fileUploadReceive", false );
                            }
                        }, function( err )
                        {
                            // socket.emit( "RS.fileUploadReceive", false );
                            socket.emit( "RS.fileUploadError", FileUploadHandler.statusCode.databaseError );
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
                    Logger.write( Logger.type.Error, `[FileUpload] Failed to upload file. (error:${ err.stack }) ${ client.information( ) }` );
                    socket.emit( "RS.fileUploadError", FileUploadHandler.statusCode.serverError );
                } );
        } );

    uploader.on( "error", function( event )
    {
        socket.emit( "RS.fileUploadError", FileUploadHandler.statusCode.serverError );

        Logger.write( Logger.type.Error, `[FileUpload] Failed to upload file. (error:${ event.error.message }) ${ client.information( ) }` );
    } );

    */

    socket.on( "RS.fileExistCheck", function( data, ack )
    {
        if ( !util.isValidSocketData( data, "string" ) )
        {
            Logger.impor( `[FileUpload] WARNING: Clients requested Socket [RS.fileExistCheck] data structure is not valid!, this is actually Clients manual socket emission. ${ client.information( ) }` );
            client.pushWarning( );
            return;
        }

        if ( !ack || typeof ack === "undefined" )
        {
            Logger.impor( `[FileUpload] WARNING: Clients requested Socket [RS.fileExistCheck] ack parameter missing!, this is actually Clients manual socket emission. ${ client.information( ) }` );
            client.pushWarning( );
            return;
        }

        if ( Server.getGlobalVar( "FileUploadHandler.NOT_ALLOW_UPLOAD", false ) )
            return ack(
            {
                code: 2
            } );

        // *TODO: 이미 업로드된 파일은 새로운 limit size 설정 적용 안됨.

        Database.executeProcedure( "FIND_USERFILE_BY_HASH", [ data ], function( status, data )
        {
            if ( status === "success" && data.length > 0 )
            {
                data = data[ 0 ];

                ChatManager.emitFile( client, data._id, FileUploadHandler.calculateFileType( data._mimeType ), data._isAdult, data._mimeType, data._originalFileName );

                return ack(
                {
                    code: 0,
                    exists: true
                } );
            }
            else
            {
                return ack(
                {
                    code: 0,
                    exists: false
                } );
            }
        }, function( err )
        {
            return ack(
            {
                code: 1
            } );
        } );
    } );
} );

var upload = uploadHandler.single( "file" );

hook.register( "OnRouter", function( router )
{
    router.post( "/upload", function( req, res )
    {
        if ( !req.isAuthenticated( ) )
        {
            res.status( 403 )
                .render( "error",
                {
                    code: 403
                } );
            return;
        }

        var client = Server.getClientBySessionID( req.sessionID );

        if ( client && client.initialized )
        {
            upload( req, res, function( err )
            {
                if ( err )
                {
                    Logger.error( `[FileUpload] ERROR: Failed to upload file! (error: ${ err.stack }) ${ client.information( ) }` );

                    res.status( 500 )
                        .send( err.message );
                    return;
                }

                // console.log( err );
                // console.log( req.file );
                console.log( req.file );

                var file = req.file;
                var onCheck = function( hash, isAdult )
                {
                    console.log( hash );

                    //*NOTE: Field information: _id, _originalFileName, _extension, _mimeType, _adult, _hash, _virus
                    Database.executeProcedure( "REGISTER_USERFILE", [
                        file.id, file.originalname, file.extension, file.mimetype, isAdult ? "1" : "0", hash, "0"
                    ], function( status, data )
                    {
                        if ( status === "success" )
                        {
                            ChatManager.emitFile( client, file.id, FileUploadHandler.calculateFileType( file.mimetype ), isAdult, file.mimetype, file.originalname );
                            Logger.event( `[FileUpload] File uploaded. ${ client.information( ) } -> ${ file.id }` );

                            res.status( 200 )
                                .send( "success" );
                        }
                        else
                        {
                            Logger.error( `[FileUpload] ERROR: REGISTER_USERFILE procedure failed to execute! (id: ${ file.id }, file: ${ file.path }) ${ client.information( ) }` );

                            res.status( 500 )
                                .send( "DB status error: " + status );
                        }
                    }, function( err )
                    {
                        console.log( err );
                        res.status( 500 )
                            .send( err.message );
                    } );
                };

                util.fileHash( file.path, function( hash )
                {
                    if ( hash === null )
                    {
                        fileStream.unlink( file.path, function( err )
                        {
                            if ( err )
                            {
                                Logger.impor( `[FileUpload] ERROR: Failed to unlinking file!, This file required manual delete! (err: ${ err.stack }, file: ${ file.path }) ${ client.information( ) }` );
                                return;
                            }

                            Logger.impor( `[FileUpload] File unlinking successful. (file: ${ file.path }) ${ client.information( ) }` );
                        } );

                        Logger.error( `[FileUpload] ERROR: Failed to calculate file hash! unlinking ... (file: ${ file.path }) ${ client.information( ) }` );

                        res.status( 500 )
                            .send( err.message );
                        return;
                    }

                    console.log( hash );

                    // 이미지 파일
                    if ( file.mimetype.indexOf( "image/" ) > -1 && file.mimetype !== "image/gif" )
                    {
                        FileUploadHandler.checkAdultImage( client, file.path, function( isAdult )
                        {
                            onCheck( hash, isAdult );
                        } );
                    }
                    else
                    {
                        return onCheck( hash, false );
                    }
                } );
            } );
        }
        else
        {
            res.status( 403 )
                .render( "error",
                {
                    code: 403
                } );
            return;
        }
    } );
} );

module.exports = FileUploadHandler;