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
const util = require( "../util" );
const timer = require( "../timer" );
const FileStorage = require( "../filestorage" );
const Logger = require( "../modules/logger" );

ServiceManager.notification = [ ];
ServiceManager.serviceStatus = 0;

// *NOTE: guest 포함 불가
ServiceManager.loginDisallowList = [
    // "steam",
    "naver",
    "google",
    "twitter",
    "kakao"
]

ServiceManager.joinDisallowList = [
    "home"
];

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

ServiceManager.isLoginAllowed = function( provider )
{
    return this.loginDisallowList.indexOf( provider ) === -1;
}

ServiceManager.isQueueRegisterAllowed = function( roomID, provider )
{
    return true;

    return "made in abyss";
}

ServiceManager.background = null;
ServiceManager.refreshBackground = function( )
{
    var location = path.join( __dirname, "/../", "background" );

    fileStream.readdir( location, function( err, files )
    {
        if ( err )
        {
            Logger.write( Logger.type.Error, `[Service] ERROR: Failed to refresh background. (error:${ err.stack })` );
            return;
        }

        var newBackground = files[ Math.floor( Math.random( ) * files.length ) ];

        ServiceManager.background = path.join( location, newBackground );

        Logger.write( Logger.type.Info, `[Service] Background refreshed. (newBG:${ newBackground })` );
    } );
}

ServiceManager.registerNotification = function( id, type, title, message )
{
    this.notification.some( ( n, i ) =>
    {
        if ( n.id === id )
        {
            this.notification.splice( i, 1 );
            Logger.write( Logger.type.Warning, "[Service] Removed exists '" + n.id + "' notification!" );
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

    // *TODO: sync 되지 않아서 문제 발생 가능성
    // 2018-09-02 9:11:35 (! ERROR !) : [SERVER] Unhandled Exception: SyntaxError: Unexpected token { in JSON at position 118 at JSON.parse () at D:\NodeJS\ReguStreaming\regustreaming\filestorage.js:61:54 at FSReqWrap.readFileAfterClose [as oncomplete] (fs.js:511:3)
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
        serviceStatus: this.serviceStatus,
        loginDisallowList: this.loginDisallowList
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
                        description: "모든 서비스가 온라인입니다.",
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
}

ServiceManager.setServiceStatus( 0 );
// ServiceManager.registerNotification( "SERVICE_UNAVAILABLE", ServiceManager.notificationType.danger, "서비스 문제", "서비스 업데이트 작업으로 인해 서비스 접근을 비활성화 했습니다, 불편을 드려 죄송합니다." );
ServiceManager.registerNotification( "SNS_LOGIN_WARN", ServiceManager.notificationType.warning, "소셜 계정 로그인", "외부 서비스 접근에 문제가 발생하여 현재 스팀을 통한 로그인을 제외한 모든 소셜 계정 로그인이 불가능 합니다, 불편을 드려 죄송합니다." );
ServiceManager.refreshBackground( );

timer.create( "service.RefreshBackground", 1000 * 180, 0, function( ) // *NOTE: 2 minutes
    {
        ServiceManager.refreshBackground( )
    } );

hook.register( "PreClientConnect", function( ipAddress )
{
    if ( ServiceManager.serviceStatus === 1 && ipAddress !== App.config.host )
    {
        return {
            accept: false,
            reason: "죄송합니다, 현재는 서비스를 이용하실 수 없습니다, 자세한 내용은 공지사항을 확인해주세요."
        }
    }
} );

hook.register( "OnClientConnect", function( ipAddress, userID, roomID )
{
    if ( ServiceManager.joinDisallowList.indexOf( roomID ) !== -1 )
    {
        return {
            accept: false,
            reason: "죄송합니다, 현재는 이 채널을 이용하실 수 없습니다, 자세한 내용은 공지사항을 확인해주세요."
        }
    }

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