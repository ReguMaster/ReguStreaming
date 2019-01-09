/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const FileStorage = {};
const fileStream = require( "fs" );
const path = require( "path" );
const Logger = require( "./modules/logger" );

FileStorage.config = {
    directory: path.join( __dirname, "fileStorage" )
};

fileStream.access( FileStorage.config.directory, fileStream.constants.F_OK, function( err )
{
    if ( err )
        Logger.error( `[FileStorage] FileStorage store directory is missing! (location: ${ FileStorage.config.directory })` );
} );

FileStorage.save = function( id, type, data )
{
    fileStream.writeFile( path.join( this.config.directory, id + ".db" ), type === "json" ? JSON.stringify( data ) : data, "utf8", function( err )
    {
        if ( err )
            Logger.error( `[FileStorage] Failed to save FileStorage [${ id }:${ type }] database! (err: ${ err.stack })` );
        else
            Logger.event( `[FileStorage] FileStorage [${ id }:${ type }] database successfully saved.` );
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
            Logger.warn( `[FileStorage] FileStorage [${ id }:${ type }] database not exist, so it is set to default to (${ defaultValue }:${ typeof defaultValue }).` );
            callback( defaultValue );
        }
        else
        {
            fileStream.readFile( fileLocation, "utf8", function( err2, data )
            {
                if ( err2 )
                {
                    Logger.error( `[FileStorage] Failed to load FileStorage [${ id }:${ type }] database! (err: ${ err2.stack })` );
                    callback( defaultValue );
                }
                else
                {
                    try
                    {
                        var convert = type === "json" ? JSON.parse( data ) : data;

                        Logger.event( `[FileStorage]  FileStorage [${ id }:${ type }] database successfully loaded.` );
                        callback( convert );
                    }
                    catch ( e )
                    {
                        if ( e instanceof SyntaxError )
                            Logger.error( `[FileStorage] Failed to conversion FileStorage [${ id }:${ type }] database!, so it is set to default to (${ defaultValue }:${ typeof defaultValue }).` );
                        else
                            Logger.error( `[FileStorage] Failed to conversion FileStorage [${ id }:${ type }] database! (err: ${ e.stack })` );
                    }
                }
            } );
        }
    } );
}

// *TODO: 구현
/**
 * @deprecated Do not use sync method.
 */
FileStorage.loadSync = function( id, type, defaultValue ) {

}

module.exports = FileStorage;