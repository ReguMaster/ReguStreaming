/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ServiceManager = {};

const App = require( "../app" );
const Server = require( "../server" );
const path = require( "path" );
const fileStream = require( "fs" );
const hook = require( "../hook" );
const reguUtil = require( "../util" );
const FileStorage = require( "../filestorage" );
const Logger = require( "../modules/logger" );

ServiceManager.notification = [ ];
ServiceManager.serviceStatus = 0;

FileStorage.loadAsync( "serviceNotification", "json", [ ], ( data ) =>
{
    ServiceManager.notification = data;
} );
FileStorage.loadAsync( "serviceStatus", "text", 0, ( data ) =>
{
    ServiceManager.serviceStatus = Number( data || 0 );
} );

ServiceManager.liveCode = {
    server: [ ],
    client: [ ]
};
ServiceManager.notificationType = {
    info: 0,
    warning: 1,
    danger: 2
};

ServiceManager.background = null;
ServiceManager.refreshBackground = function( )
{
    var location = path.join( __dirname, "/../", "background" );

    fileStream.readdir( location, function( err, files )
    {
        if ( err )
        {
            Logger.write( Logger.LogType.Error, `[Service] ERROR: Failed to refresh background. (error:${ err.stack })` );
            return;
        }

        var newBackground = files[ Math.floor( Math.random( ) * files.length ) ];

        ServiceManager.background = path.join( location, newBackground );

        Logger.write( Logger.LogType.Info, `[Service] Background refreshed. (newBG:${ newBackground })` );
    } );
}

ServiceManager.registerNotification = function( id, type, title, message )
{
    this.notification.some( ( n, i ) =>
    {
        if ( n.id === id )
        {
            this.notification.splice( i, 1 );
            Logger.write( Logger.LogType.Warning, "[Service] Removed exists '" + n.id + "' notification!" );
            return true;
        }
    } );

    this.notification.push(
    {
        id: id,
        type: type,
        title: title,
        message: message
    } );

    FileStorage.save( "serviceNotification", "json", this.notification );
}

ServiceManager.registerServersideLiveCode = function( id, url )
{
    this.liveCode.server.push(
    {
        id: id,
        url: url
    } );
}

ServiceManager.getClientAjaxData = function( )
{
    return {
        notification: this.notification,
        serviceStatus: this.serviceStatus
    }
}

ServiceManager.setServiceStatus = function( status )
{
    this.serviceStatus = status

    FileStorage.save( "serviceStatus", "text", this.serviceStatus );
}

ServiceManager.done = function( )
{
    var channel = Server.DiscordClient.channels.get( "474557133405552642" );

    channel.fetchMessages(
        {
            limit: 99
        } )
        .then( function( messages )
        {
            channel.bulkDelete( messages );

            // https://github.com/izy521/discord.io/blob/master/docs/colors.md
            var colorString = [
                3447003,
                15105570,
                15158332
            ]

            if ( ServiceManager.notification.length === 0 )
            {
                channel.send(
                {
                    embed:
                    {
                        color: colorString[ 0 ],
                        description: "모든 서비스가 온라인입니다!",
                        author:
                        {
                            name: "서비스 정상"
                        },
                        url: "https://regustreaming.oa.to",
                        timestamp: new Date( ),
                        footer:
                        {
                            text: "© ReguStreaming"
                        }
                    }
                } );
            }
            else
            {
                ServiceManager.notification.forEach( ( v ) =>
                {
                    channel.send(
                    {
                        embed:
                        {
                            color: colorString[ v.type ],
                            description: v.message,
                            author:
                            {
                                name: v.title
                            },
                            timestamp: new Date( ),
                            footer:
                            {
                                text: "© ReguStreaming"
                            }
                        }
                    } );
                } );
            }
        } );
    // msg.channel.bulkDelete( fetched );
}

ServiceManager.blockRoom = [
    "home"
];

// ServiceManager.registerNotification( "TEST", ServiceManager.notificationType.info, "Service Error", "We are aware of issues causing account transfers to intermittently fail, and are working on a fix." );
// ServiceManager.registerNotification( ServiceManager.notificationType.danger, "Service Error", "We are aware of an issue with dash abilities and are currently working on a fix." );

ServiceManager.registerNotification( "SERVICE_UPDATE_KO", ServiceManager.notificationType.warning, "서비스 업데이트", "현재 서비스 업데이트 작업 중입니다, 일부 서비스를 이용하실 수 없으며 불편을 드려 죄송합니다." );
ServiceManager.registerNotification( "SERVICE_UPDATE_EN", ServiceManager.notificationType.warning, "Service Update", "We are currently working on a service update, some services are not available and we apologize for any inconvenience." );


// ServiceManager.registerNotification( "WOW", ServiceManager.notificationType.warning, "채널 접속 차단", "현재 일부 채널에서 문제가 발생하여 채널 접속을 차단했습니다, 불편을 드려 죄송합니다." );
// ServiceManager.registerNotification( ServiceManager.notificationType.danger, "채널 금지", "현재 일부 채널에서 서비스 지연 문제가 발생하여 일부 채널 접속을 차단했습니다, 불편을 드려 죄송합니다." );

ServiceManager.refreshBackground( );

setInterval( function( )
{
    ServiceManager.refreshBackground( )
}, 1000 * 60 );

hook.register( "OnPreClientConnect", function( ipAddress )
{
    if ( ServiceManager.serviceStatus === 1 && ipAddress !== App.config.host )
    {
        return {
            accept: false,
            reason: "죄송합니다, 현재는 서비스를 이용하실 수 없습니다, 자세한 내용은 공지사항을 확인해주세요."
        }
    }
} );

hook.register( "OnClientConnect", function( ipAddress, userID )
{
    if ( ServiceManager.serviceStatus === 1 && ipAddress !== App.config.host )
    {
        return {
            accept: false,
            reason: "죄송합니다, 현재는 서비스를 이용하실 수 없습니다, 자세한 내용은 공지사항을 확인해주세요."
        }
    }
} );

hook.register( "PostAdministratorConnected", function( socket ) {

} );

hook.register( "PostReadyDiscordClient", function( )
{
    ServiceManager.done( );

    var consoleChannel = Server.DiscordClient.channels.get( "474835550675927050" );

    hook.register( "OnLog", function( logLevel, log )
    {
        consoleChannel.send( log );
    } );
} );

module.exports = ServiceManager;