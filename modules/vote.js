/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const VoteManager = {};
const Server = require( "../server" );
const Logger = require( "./logger" );
const util = require( "../util" );
const QueueManager = require( "./queue" );
const ChatManager = require( "./chat" );
const hook = require( "../hook" );

VoteManager._voteList = [ ];
VoteManager.voteFlag = {
    reject: 0,
    accept: 1
}
VoteManager.config = {
    TIME: 15
}

VoteManager.register = function( client )
{
    var roomID = client.room;

    if ( !QueueManager.isPlaying( roomID ) )
    {
        return {
            success: false,
            reason: "영상 재생 중이 아닙니다."
        };
    }

    // if ( ClientManager.getCount( roomID ) <= 1 )
    // {
    //     return {
    //         success: false,
    //         reason: "투표를 진행하기 위한 충분한 인원이 없습니다."
    //     };
    // }

    if ( this.isRunningVote( roomID ) )
    {
        return {
            success: false,
            reason: "현재 투표가 이미 진행중입니다."
        };
    }

    this._voteList[ roomID ] = {
        startUser: client,
        startUserName: client.name,
        votedUser:
        {},
        startTime: Date.now( ),
        interval: null
    };

    // 투표한 사람은 항상 찬성함
    this._voteList[ roomID ].votedUser[ client.userID ] = this.voteFlag.accept;

    this._voteList[ roomID ].interval = setInterval( function( )
    {
        if ( !VoteManager._voteList[ roomID ] )
        {
            console.log( "noo" );
            return;
        }

        var data = VoteManager._voteList[ roomID ];

        if ( Date.now( ) - data.startTime >= VoteManager.config.TIME * 1000 )
        {
            console.log( "fin" );

            VoteManager.finished( roomID, data );
        }
    }, 1000 );

    var voteData = this._voteList[ client.room ];

    console.log( client );

    client.emit( "RS.voteEvent",
    {
        type: "register_local",
        percent: 1 / Server.getRoomClientCount( roomID ), // 항상 시작한 사람은 1이므로 확률 계산을 1명으로 취급
        endTime: VoteManager.config.TIME
    } );

    Server.sendMessage( roomID, "RS.voteEvent",
    {
        type: "register",
        startUser:
        {
            name: client.name,
            userID: client.userID,
            avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" )
        },
        percent: 1 / Server.getRoomClientCount( roomID ), // 항상 시작한 사람은 1이므로 확률 계산을 1명으로 취급
        endTime: VoteManager.config.TIME
    }, client );

    ChatManager.saySystem( roomID, `영상 건너뛰기 투표가 시작되었습니다. (${ client.name })`, "glyphicon glyphicon-random" );

    Logger.write( Logger.type.Event, `[Vote] Vote registered. -> ${ client.information( ) }` );

    return {
        accept: true
    };
}

VoteManager.remove = function( roomID )
{
    var voteData = this._voteList[ roomID ];

    Server.sendMessage( roomID, "RS.voteEvent",
    {
        type: "finish"
    } );

    clearInterval( voteData.interval );

    this._voteList[ roomID ] = {};
}

VoteManager.finished = function( roomID, voteData )
{
    var votedUser = voteData.votedUser;
    var keys = Object.keys( votedUser );
    var length = keys.length;
    var count = 0;

    for ( var i = 0; i < length; i++ )
    {
        if ( votedUser[ keys[ i ] ] === this.voteFlag.accept )
            count++;
    }

    console.log( count, ( count / Server.getRoomClientCount( roomID ) ), Server.getRoomClientCount( roomID ) );

    var isAccept = ( count / Server.getRoomClientCount( roomID ) ) >= 0.65;

    if ( isAccept )
    {
        ChatManager.saySystem( roomID, `영상 건너뛰기 투표가 <font style="color: rgb( 50, 200, 50 );">가결</font>되었습니다. (${ voteData.startUserName })`, "glyphicon glyphicon-ok" );
        QueueManager.skip( roomID );
    }
    else
    {
        ChatManager.saySystem( roomID, `영상 건너뛰기 투표가 <font style="color: rgb( 200, 50, 50 );">부결</font>되었습니다. (${ voteData.startUserName })`, "glyphicon glyphicon-remove" );
    }

    // 투표진행중 나가면 이거 어캐댐?
    Logger.write( Logger.type.Event, `[Vote] Vote finished. -> ${ voteData.startUser.information( ) } -> ${ isAccept }` );

    VoteManager.remove( roomID );
}

hook.register( "PostPlayQueue", function( roomID, queueData )
{
    if ( VoteManager.isRunningVote( roomID ) )
    {
        VoteManager.remove( roomID );
        ChatManager.saySystem( roomID, `다음 영상이 재생되므로 영상 건너뛰기 투표가 취소되었습니다.`, "glyphicon glyphicon-exclamation-sign" );

        Logger.write( Logger.type.Event, `[Vote] Vote canceled. -> (#NextVideoPlay)` );
    }
} );

VoteManager.stackFlag = function( client, flag )
{
    var roomID = client.room;

    if ( !this.isRunningVote( roomID ) )
    {
        return {
            success: false,
            reason: "현재 투표가 진행중이지 않습니다."
        };
    }

    if ( flag !== this.voteFlag.reject && flag !== this.voteFlag.accept )
    {
        return {
            success: false,
            reason: "찬성과 반대만 할 수 있습니다."
        };
    }

    var voteData = this._voteList[ roomID ];

    if ( voteData.startUser === client )
    {
        return {
            success: false,
            reason: "이 투표를 시작하셨으므로 투표할 수 없습니다."
        };
    }

    var votedUser = voteData.votedUser;

    if ( votedUser[ client.userID ] && ( votedUser[ client.userID ] === this.voteFlag.reject || votedUser[ client.userID ] === this.voteFlag.accept ) )
    {
        return {
            success: false,
            reason: "이미 투표하셨습니다."
        };
    }

    voteData.votedUser[ client.userID ] = flag;

    var votedUser = voteData.votedUser;
    var keys = Object.keys( votedUser );
    var length = keys.length;
    var count = 0;

    for ( var i = 0; i < length; i++ )
    {
        if ( votedUser[ keys[ i ] ] === this.voteFlag.accept )
            count++;
    }

    // *TODO: 최적화 필요;

    Server.sendMessage( roomID, "RS.voteEvent",
    {
        type: "flag",
        percent: count / Server.getRoomClientCount( roomID )
    } );

    Logger.write( Logger.type.Event, `[Vote] Vote flag request. -> ${ client.information( ) } -> ${ flag }` );

    // if ( ( count / Server.getRoomClientCount( roomID ) ) >= 0.65 )
    // {
    //     VoteManager.finished( roomID, voteData );
    // }

    return {
        success: true,
        percent: ( count / Server.getRoomClientCount( roomID ) ),
        isTrue: ( count / Server.getRoomClientCount( roomID ) ) >= 0.65
    };
}

VoteManager.sendData = function( client )
{
    // if ( this.isRunningVote( client.room ) )
    // {
    //     var voteData = this.getRoomVote( client.room );

    //     client.emit( "RS." );
    // }
}

VoteManager.getRoomVote = function( roomID )
{
    return VoteManager._voteList[ roomID ];
}

VoteManager.isRunningVote = function( roomID )
{
    return !util.isEmpty( VoteManager._voteList[ roomID ] );
}

hook.register( "OnCreateOfficialRoom", function( roomList )
{
    util.forEach( roomList, ( room ) => VoteManager._voteList[ room.roomID ] = {} );
} );

hook.register( "PostClientConnected", function( client, socket )
{
    socket.on( "RS.voteRegister", function( data )
    {
        var result = VoteManager.register( client );

        if ( result.accept )
        {
            socket.emit( "RS.voteRegisterReceive",
            {
                success: true
            } );
        }
        else
        {
            socket.emit( "RS.voteRegisterReceive",
            {
                success: false,
                reason: result.reason
            } );

            Logger.write( Logger.type.Warning, `[Vote] Vote register request rejected! -> (#${ result.reason }) ${ client.information( ) }` );
        }
    } );

    socket.on( "RS.voteStackFlag", function( data )
    {
        if ( !util.isValidSocketData( data,
            {
                flag: "number"
            } ) )
        {
            Logger.write( Logger.type.Important, `[Vote] Vote flag request rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }

        var result = VoteManager.stackFlag( client, data.flag );

        if ( !result.success )
        {
            socket.emit( "RS.voteStackFlagReceive",
            {
                success: false,
                reason: result.reason
            } );

            Logger.write( Logger.type.Warning, `[Vote] Vote flag request rejected! -> (#${ result.reason }) ${ client.information( ) }` );
        }
        else
        {
            socket.emit( "RS.voteStackFlagReceive",
            {
                success: true,
                percent: result.percent,
                isTrue: result.isTrue
            } );
        }
    } );
} );

module.exports = VoteManager;