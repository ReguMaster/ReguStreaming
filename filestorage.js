/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const FileStorage = {};
const fileStream = require( "fs" );
const path = require( "path" );
const Logger = require( "./modules/logger" ); // 로거 위치 바꾸기

FileStorage.config = {};
FileStorage.config.StoreDirectory = path.join( __dirname, "fileStorage" );

FileStorage.save = function( id, type, data )
{
    fileStream.writeFile( path.join( FileStorage.config.StoreDirectory, id + ".db" ), type === "json" ? JSON.stringify( data ) : data, "utf8", function( error )
    {
        if ( error )
        {
            Logger.write( Logger.LogType.Error, `[FileStorage] Failed to save '${ id }'!` );
        }
        else
        {
            Logger.write( Logger.LogType.Event, `[FileStorage] FileStorage file ${ id } saved.` );
        }
    } );
}

//체크가 필요함;
FileStorage.loadAsync = function( id, type, defaultValue = [ ], callback )
{
    var fileLocation = path.join( FileStorage.config.StoreDirectory, id + ".db" );

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
                    Logger.write( Logger.LogType.Error, `[FileStorage] Failed to load '${ id }'! (error:${ err2.stack })` );
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

FileStorage.loadSync = function( id, type, defaultValue ) {

}

module.exports = FileStorage;