/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const FileUploadHandler = { };
const path = require( "path" );
const Main = require( "../app.js" );
const Logger = require( "./logger.js" );
const ClientManager = require( "../client.js" );
var SocketIOFileUpload = require('socketio-file-upload');

FileUploadHandler.test = 0;
ClientManager.hooks.push( function( socket, client )
{
	var ipAddress = socket.handshake.address;
	
	var uploader = new SocketIOFileUpload();
    uploader.dir = "./public/userfiles";
    uploader.listen(socket);
	uploader.uploadValidator = function(event, callback){
		// fs.mkdtemp('/tmp/foo-', function(err, folder) {
			// if (err) {
				// callback( false ); // abort
			// }
			// else {
				// uploader.dir = folder;
				// callback( true ); // ready
			// }
		// });
		// console.log(event);
		callback( true );
	};
	
    // Do something when a file is saved:
    uploader.on("saved", function(event){
		// 서버사이드 파일 거부 추가바람
        // console.log(event.file);
		
		ClientManager.getAll( true ).forEach( function( client2, index2 )
		{
			client2.socket.emit( "chatReceive", {
				name: client.name + "#" + client.userID,
				type: "img",
				dir: "/files/" + event.file.name
			} );
		} );
		
		Logger.write( Logger.LogType.Info, `[FileUpload] File uploaded. -> 'name: ${ client.name }', 'userID: ${ client.userID }' 'ipAddress: ${ ipAddress }' -> ${ event.file.name }` );
    });

    // Error handler:
	uploader.on( "error", ( event ) =>
	{
		socket.emit( "notification", {
			message: "죄송합니다, 파일 업로드에 실패했습니다.<br />" + event.error
		} );
		
		Logger.write( Logger.LogType.Error, `[FileUpload] Failed to upload file. -> 'name: ${ client.name }', 'userID: ${ client.userID }' 'ipAddress: ${ ipAddress }'\n${ event.error }` );
	} );
	
	client.registerConfig( "uploader", uploader );
} );

module.exports = FileUploadHandler;