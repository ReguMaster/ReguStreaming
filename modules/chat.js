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
// let datastream = require( "../datastream" );

const xss = require( "xss" ); // https://www.npmjs.com/package/xss

ChatManager.config = {};
ChatManager.config.allowChatRegexExpression = /^[가-힣ㄱ-ㅎㅏ-ㅣ\x20|a-z|A-Z|0-9|!~?"'@#$%^&=*/()-_ ;|+.\*]+$/;
ChatManager.config.xssRegexExpression = /\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g;

ChatManager.color = {
    normal: 0,
    red: 1,
    green: 2,
    blue: 3
}

ChatManager.checkXSS = function( chatMessage, callback )
{
    // var filtered = xssF.filter( chatMessage ); // this sucks

    // callback( filtered !== chatMessage, filtered );

    // return ChatManager.config.xssRegexExpression.test( chatMessage );

    var filtered = xss( chatMessage );

    callback( filtered !== chatMessage );
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
    Server.sendMessage( client.roomID, "regu.chat",
    {
        profileImage: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ), // 최적화 필요함.
        name: client.name,
        userID: client.userID,
        type: "img",
        fileID: fileID,
        isAdmin: client.ipAddress === "1.224.53.166" // wow doge
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

ChatManager.canChat = function( client, chatMessage )
{
    if ( chatMessage.length <= 0 || chatMessage.length > 200 )
        return false;

    return true;
}

hook.register( "PostClientConnected", function( client, socket )
{
    // ClientManager.sendMessageToAll( client.room, "regu.chat",
    // {
    //     profileImage: client.getPassportField( "avatar", "/images/icon/user_64.png" ),
    //     name: client.name,
    //     userID: client.userID,
    //     message: "test message",
    //     isAdmin: client.ipAddress === "1.224.53.166"
    // } );

    socket.on( "regu.chat", function( data )
    {
        if ( !reguUtil.isValidSocketData( data, "string" ) )
        {
            Logger.write( Logger.LogType.Important, `[Chat] Chat rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }

        var chatMessage = data.trim( );

        if ( !ChatManager.canChat( client, chatMessage ) )
        {
            socket.emit( "regu.notification",
            {
                type: 1,
                title: "채팅 불가 :",
                time: 2000,
                message: "채팅 메세지는 1자 이상 200자 이하 되어야 합니다."
            } );

            Logger.write( Logger.LogType.Warning, `[Chat] Chat rejected. (#NotAllowed) -> ${ client.information( ) } : ${ chatMessage }` );

            return;
        }

        ChatManager.checkXSS( chatMessage, function( detected )
        {
            if ( detected )
            {
                socket.emit( "regu.notification",
                {
                    type: 1,
                    title: "채팅 불가 :",
                    time: 2000,
                    message: "채팅 메세지에 입력할 수 없는 문장입니다."
                } );

                Logger.write( Logger.LogType.Important, `[Chat] WARNING! : XSS attack detected! -> ${ client.information( ) } : ${ chatMessage }` );
                return;
            }

            Server.sendMessage( client.room, "regu.chat",
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