/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const FileStorage = {};
const fileStream = require( "fs" );
const path = require( "path" );
const Logger = require( "./modules/logger" ); // 로거 위치 바꾸기

FileStorage.config = {
    directory: path.join( __dirname, "fileStorage" )
};

fileStream.access( FileStorage.config.directory, fileStream.constants.F_OK, function( err )
{
    if ( err )
        Logger.write( Logger.LogType.Error, `[FileStorage] FileStorage directory missing! (directory:${ FileStorage.config.directory })` );
} );

FileStorage.save = function( id, type, data )
{
    fileStream.writeFile( path.join( this.config.directory, id + ".db" ), type === "json" ? JSON.stringify( data ) : data, "utf8", function( err )
    {
        if ( err )
        {
            Logger.write( Logger.LogType.Error, `[FileStorage] Failed to save '${ id }'! (err:${ err.stack })` );
        }
        else
        {
            Logger.write( Logger.LogType.Event, `[FileStorage] FileStorage database ${ id } saved.` );
        }
    } );
}

//체크가 필요함;
FileStorage.loadAsync = function( id, type, defaultValue = [ ], callback )
{
    var fileLocation = path.join( this.config.directory, id + ".db" );

    fileStream.access( fileLocation, fileStream.constants.F_OK, function( err )
    {
        if ( err )
        {
            callback( defaultValue );
            Logger.write( Logger.LogType.Warning, `[FileStorage] FileStorage database '${ id }' not exist, will be default value. -> ${ defaultValue }` );
        }
        else
        {
            fileStream.readFile( fileLocation, "utf8", function( err2, data )
            {
                if ( err2 )
                {
                    callback( defaultValue );
                    Logger.write( Logger.LogType.Error, `[FileStorage] Failed to load '${ id }'! (err:${ err2.stack })` );
                }
                else
                {
                    callback( type === "json" ? JSON.parse( data ) : data );
                    Logger.write( Logger.LogType.Event, `[FileStorage] FileStorage database '${ id }' loaded.` );
                }
            } );
        }
    } );
}

// *TODO: 구현
FileStorage.loadSync = function( id, type, defaultValue ) {

}

module.exports = FileStorage;