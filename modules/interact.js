/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

// 'use struct'

const Interact = {};

const Server = require( "../server" );
const BanManager = require( "./ban" );
const App = require( "../app" );
const hook = require( "../hook" );
const QueueManager = require( "./queue" ); // 수정바람
const ChatManager = require( "./chat" ); // 수정바람
// const ClientManager = require( "../client" );
const Logger = require( "./logger" );

// import Logger from "./logger";

require( "colors" );

var exitMode = false;

hook.register( "PostDiscordMessage", function( message )
{
    if ( message.channel.id === "474835550675927050" )
        Interact.process( message.content.trim( ) );
} );

Interact.process = function( args )
{
    args = args.split( " " );

    try
    {
        if ( args.length > 0 )
        {
            switch ( args[ 0 ].toString( )
                .toLowerCase( )
                .trim( ) )
            {
                case "/clear":
                    console.reset( );
                    break;
                case "/kick":
                    if ( args[ 1 ] )
                    {
                        var client = Server.getClientByIPAddress( args[ 1 ] );

                        if ( client != null )
                        {
                            client.kick( args.chain( 2 ) );
                        }
                        else
                            console.log( "Client is not valid!".bold.red );
                    }
                    else
                        console.log( "Argument 1 is not valid!".bold.red );

                    break;
                case "/ban":
                    if ( args[ 1 ] )
                    {
                        var client = Server.getClientByIPAddress( args[ 1 ] );

                        if ( client )
                            client.ban( args.chain( 2 ), 0 );
                        else
                            BanManager.register( [ null, args[ 1 ] ], 0, args.chain( 2 ) ); // 아이피밴
                    }

                    break;
                case "/removeban":
                    if ( args[ 1 ] && typeof args[ 1 ] == "string" )
                    {
                        BanManager.remove( args[ 1 ] );
                    }

                    break;
                case "/kickall":
                    if ( args[ 1 ] && args[ 1 ] !== "all" && Server.ROOM[ args[ 1 ] ] )
                    {
                        var reason = args.chain( 2 ) || "서버로부터 강제 퇴장 처리";

                        console.log( "Kick all clients at " + args[ 1 ] );

                        Server.getAllClient( args[ 1 ] )
                            .forEach( ( client ) => client.kick( reason ) );
                    }
                    else
                    {
                        var reason = args.chain( 2 ) || "서버로부터 강제 퇴장 처리";

                        console.log( "Kick all clients at ALL" );

                        Server.getAllClient( )
                            .forEach( ( client ) => client.kick( reason ) );
                    }
                    break;
                case "/queue-directadd":
                    QueueManager.register( QueueManager.videoType.Direct, null, args[ 1 ], args[ 2 ], args[ 2 ], args[ 3 ] || 0, true );
                    break;
                case "/queue-continue":
                    QueueManager.continueQueue( args[ 1 ] );

                    console.log( "Queue continued.".bold );
                    break;
                case "/queue-add":
                    QueueManager.forceAdd( args[ 1 ], args[ 2 ] );

                    console.log( "Queue added.".bold );
                    break;
                    // case "/queue-add":
                case "/queue-clear":
                    QueueManager.clear( args[ 1 ], args[ 2 ] == "true" );

                    console.log( "Queue cleared.".bold );
                    break;
                case "/queue-removeat":
                    if ( args[ 1 ] && args[ 2 ] && typeof Number( args[ 2 ] ) == "number" && !isNaN( Number( args[ 2 ] ) ) )
                    {
                        QueueManager.removeAt( args[ 1 ], Number( args[ 2 ] ) );

                        console.log( args[ 2 ] + " Queue removed.".bold );
                    }
                    else
                        console.log( "Argument 1 is not valid!".bold.red );

                    break;
                case "/video-setpos":
                    if ( args[ 1 ] && typeof Number( args[ 2 ] ) == "number" && !isNaN( Number( args[ 2 ] ) ) )
                    {
                        var pos = Number( args[ 2 ] );

                        QueueManager.setVideoPos( args[ 1 ], pos );

                        console.log( ( "Video setpos -> " + pos )
                            .bold );
                    }
                    else
                        console.log( "Argument 1 is not valid!".bold.red );
                    break;
                case "/notify":
                    if ( args[ 1 ] && args[ 2 ] )
                    {
                        var message = args.chain( 2 );

                        if ( args[ 1 ] === "ALL" )
                            args[ 1 ] = null;

                        ChatManager.saySystem( args[ 1 ], message, "glyphicon glyphicon-comment" );
                    }
                    else
                        console.log( "Argument 1 is not valid!".bold.red );

                    break;
                case "/exit":
                    if ( exitMode )
                    {
                        process.exit( 0 );
                        return;
                    }

                    exitMode = true;
                    setTimeout( function( )
                    {
                        exitMode = false;
                    }, 3000 );

                    console.log( "WARNING: Are you sure? (retype this command)".bold.yellow );
                    break;
                case "/status":
                    console.log( "*SERVER STATUS*".bold );
                    console.log( ( "ReguStreaming Server " + App.config.host )
                        .bold.green );

                    Server.getAllClient( )
                        .forEach( ( client, index ) =>
                        {
                            console.log( ( `${ index } : ${ client.information( ) }` )
                                .bold );
                        } );

                    break;

                case "/register-service-notification":

                    break;
            }

        }
        else
        {
            console.log( ( input + " is Missing command identifiaction!" )
                .bold.red );
        }
    }
    catch ( exception )
    {
        Logger.write( Logger.LogType.Error, `[Interact] Server Error -> 'reason: ${ exception.stack }` );
    }
}



module.exports = Interact;