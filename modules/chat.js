/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ChatManager = {};

const Server = require( "../server" );
const reguUtil = require( "../util" );
const Logger = require( "./logger" );
const hook = require( "../hook" );

const filterXSS = require( "xss" ); // https://www.npmjs.com/package/xss

ChatManager.color = {
    normal: 0,
    red: 1,
    green: 2,
    blue: 3
}
ChatManager.statusCode = {
    success: 0,
    lengthError: 1,
    xssError: 2,
    isGuestError: 3,
    dataError: 4
}

ChatManager.saySystem = function( roomID, message, icon, noDiscord )
{
    Server.sendMessage( roomID, "regu.chat",
    {
        message: message,
        type: "system",
        icon: icon
    } );

    if ( !noDiscord )
    {
        Server.emitDiscord( roomID,
        {
            embed:
            {
                color: 10181046,
                description: message,
                author:
                {
                    name: "시스템"
                },
                url: "https://regustreaming.oa.to",
                timestamp: new Date( ),
                footer:
                {
                    text: "시스템 메세지"
                }
            }
        } );
    }
}

// 이미지에 관리자 스타일 적용안댐
ChatManager.emitImage = function( client, fileID )
{
    Server.sendMessage( client.roomID, "RS.chat",
    {
        type: "img",
        profileImage: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ), // 최적화 필요함.
        name: client.name,
        userID: client.userID,
        fileID: fileID
    } );

    Logger.write( Logger.LogType.Info, `[Chat] ${ client.information( ) } : <IMAGE> ${ fileID }` );
}

ChatManager.sayGlobal = function( message )
{
    Server.sendMessage( null, "regu.chat",
    {
        message: message,
        type: "system",
    } );
}

ChatManager.preChat = function( client, chatMessage )
{
    // var PreChat = hook.run( "PreChat", client, chatMessage );

    if ( client.provider === "guest" )
        return this.statusCode.isGuestError;

    if ( chatMessage.length <= 0 || chatMessage.length > 200 )
        return this.statusCode.lengthError;

    if ( filterXSS( chatMessage ) !== chatMessage )
        return this.statusCode.xssError;

    return this.statusCode.success;
}

hook.register( "PostClientConnected", function( client, socket )
{
    socket.on( "RS.chat", function( data )
    {
        if ( !reguUtil.isValidSocketData( data, "string" ) )
        {
            Logger.write( Logger.LogType.Important, `[Chat] Chat rejected. (code:dataError) ${ client.information( ) }` );
            return;
        }

        var chatMessage = data.trim( );
        var preChat = ChatManager.preChat( client, chatMessage );

        if ( preChat !== ChatManager.statusCode.success )
        {
            socket.emit( "RS.chatResult", preChat );

            if ( preChat !== ChatManager.statusCode.xssError )
                Logger.write( Logger.LogType.Warning, `[Chat] Chat rejected. (code:${ ( Object.keys( ChatManager.statusCode )[ preChat ] || "unknown" ) }) -> ${ client.information( ) } : ${ chatMessage }` );
            else
                Logger.write( Logger.LogType.Important, `[Chat] WARNING! : XSS attack detected! -> ${ client.information( ) } : ${ chatMessage }` );

            return;
        }

        Server.sendMessage( client.room, "RS.chat",
        {
            profileImage: client.getPassportField( "avatar", "/images/icon/user_64.png" ),
            name: client.name,
            userID: client.userID,
            rank: client.rank,
            message: chatMessage
        } );

        Server.emitDiscord( client.room, client.name + " : " + chatMessage );

        Logger.write( Logger.LogType.Info, `[Chat] ${ client.information( ) } : ${ chatMessage }` );
    } );
} );

hook.register( "PostClientConnected", function( client )
{
    ChatManager.saySystem( client.room, `${ client.name }님이 접속하셨습니다.`, "glyphicon glyphicon-user" );
} );

hook.register( "ClientDisconnected", function( client )
{
    ChatManager.saySystem( client.room, `${ client.name }님이 접속을 종료하셨습니다.`, "glyphicon glyphicon-user" );
} );

hook.register( "OnKicked", function( client )
{
    ChatManager.saySystem( client.room, client.name + "님이 서비스 약관 위반의 결과로 접속이 종료되었습니다.", "glyphicon glyphicon-ban-circle" );
} );

hook.register( "OnBanned", function( client )
{
    ChatManager.saySystem( client.room, client.name + "님이 서비스 약관 위반의 결과로 접속이 종료되었습니다.", "glyphicon glyphicon-ban-circle" );
} );

module.exports = ChatManager;