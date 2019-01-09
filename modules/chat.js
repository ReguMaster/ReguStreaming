/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const ChatManager = {};

const Server = require( "../server" );
const util = require( "../util" );
const Logger = require( "./logger" );
const hook = require( "../hook" );
const filterXSS = require( "xss" ); // https://www.npmjs.com/package/xss

/*
ChatManager.color = {
    normal: 0,
    red: 1,
    green: 2,
    blue: 3
}
*/
ChatManager.statusCode = {
    success: 0,
    lengthError: 1,
    xssError: 2,
    isGuestError: 3,
    globalVarError: 4,
    roomVarError: 5
}

ChatManager.saySystem = function( roomID, message, icon, noDiscord )
{
    Server.sendMessage( roomID, "RS.chat",
    {
        message: message,
        type: "system",
        icon: icon
    } );

    // *TODO: roomID 체크 바람..
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
ChatManager.emitImage = function( client, fileID, isAdult )
{
    Server.sendMessage( client.roomID, "RS.chat",
    {
        type: "img",
        userID: client.userID,
        fileID: fileID,
        isAdult: isAdult
    } );

    Logger.info( `[Chat] ${ client.information( ) } : <IMAGE> ${ fileID }` );
}

// *TODO: 메소드 params 관련 다시 구현 바람
// *NOTE: client, fileID, fileType, [isAdult] (for image file), [mimeType] (for video file), [fileName] (for raw file)
ChatManager.emitFile = function( client, fileID, fileType, isAdult, mimeType, fileName )
{
    Server.sendMessage( client.roomID, "RS.chat",
    {
        type: "file",
        userID: client.userID,
        fileID: fileID,
        fileType: fileType,


        mimeType: mimeType,
        fileName: fileName,
        isAdult: isAdult
    } );

    Logger.info( `[Chat] ${ client.information( ) } : <FILE> ${ fileID }` );
}

ChatManager.preChat = function( roomID, chatMessage )
{
    // var PreChat = hook.run( "PreChat", client, chatMessage );

    // if ( client.provider === "guest" )
    //     return this.statusCode.isGuestError;

    if ( Server.getGlobalVar( "Chat.NOT_ALLOW", false ) )
        return this.statusCode.globalVarError;

    if ( Server.getRoomVar( roomID, "chatDisable", false ) )
        return this.statusCode.roomVarError;

    if ( chatMessage.length <= 0 || chatMessage.length > 200 )
        return this.statusCode.lengthError;

    if ( filterXSS( chatMessage ) !== chatMessage )
        return this.statusCode.xssError;

    return this.statusCode.success;
}

hook.register( "PostClientConnected", function( client, socket )
{
    socket.on( "RS.chat", function( data, ack )
    {
        if ( !util.isValidSocketData( data, "string" ) )
        {
            Logger.impor( `[Chat] WARNING: Clients requested Socket [RS.chat] data structure is not valid!, this is actually Clients manual socket emission. ${ client.information( ) }` );
            client.pushWarning( );
            return;
        }

        if ( !ack || typeof ack === "undefined" )
        {
            Logger.impor( `[Chat] WARNING: Clients requested Socket [RS.chat] ack parameter missing!, this is actually Clients manual socket emission. ${ client.information( ) }` );
            client.pushWarning( );
            return;
        }

        var chatMessage = data.trim( );
        var preChat = ChatManager.preChat( client, chatMessage );

        if ( preChat !== ChatManager.statusCode.success )
        {
            if ( preChat !== ChatManager.statusCode.xssError )
                Logger.warn( `[Chat] Client chat post rejected. (code:${ util.getCodeID( ChatManager.statusCode, preChat ) }) -> ${ client.information( ) } : ${ chatMessage }` );
            else
                Logger.impor( `[Chat] WARNING: XSS attack detected! -> ${ client.information( ) } : ${ chatMessage }` );

            return ack(
            {
                code: preChat
            } );
        }

        Server.sendMessage( client.room, "RS.chat",
        {
            type: "text",
            userID: client.userID,
            // profileImage: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
            // profileName: client.name,
            message: chatMessage
        }, client );

        ack(
        {
            type: "text",
            userID: client.userID,
            // profileImage: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
            // profileName: client.name,
            message: chatMessage
        } );

        // Server.sendMessage( client.room, "RS.chat",
        // {

        // } );

        // if ( client.platform === "android" )
        // {
        // Server.sendMessage( client.room, "RS.chat",
        // {
        // type: "text",
        // userID: client.userID,
        // profileImage: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
        // profileName: client.name,
        // message: chatMessage
        // } );
        // }
        // else if ( client.platform === "web" )
        // {
        // Server.sendMessage( client.room, "RS.chat",
        // {
        // type: "text",
        // userID: client.userID,
        // message: chatMessage
        // } );
        // }

        Server.emitDiscord( client.room, client.name + " : " + chatMessage );

        Logger.info( `[Chat] ${ client.information( ) } : ${ chatMessage }` );
    } );

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