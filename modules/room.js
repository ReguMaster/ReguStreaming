/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

/*
const RoomManager = {};
const Logger = require( "./logger" );
const hook = require( "../hook" );
// const ClientManager = require( "../client" );

// console.log( ClientManager );
RoomManager._list = [ ];
RoomManager.getAll = function( )
{
    return RoomManager._list;
}

RoomManager.isExists = function( roomID )
{
    return RoomManager._list.some( function( val )
    {
        if ( val.roomID == roomID )
            return true;
    } );
}

RoomManager.getDataByID = function( roomID )
{
    var data = null;

    RoomManager._list.some( function( val )
    {
        if ( val.roomID == roomID )
        {
            data = val;

            return true;
        }
    } );

    return data;
}

RoomManager.getConfigs = function( roomID )
{
    return RoomManager.getDataByID( roomID )
        .config ||
        {};
}

RoomManager.getConfig = function( roomID, configName, defaultValue )
{
    var configs = this.getConfigs( roomID );

    return configs[ configName ] !== undefined ? configs[ configName ] : defaultValue;
}

RoomManager.getMaxConnectable = function( roomID )
{
    var maxConnectable = 0;

    RoomManager._list.some( function( val )
    {
        if ( val.roomID == roomID )
        {
            maxConnectable = val.maxConnectable;

            return true;
        }
    } );

    return maxConnectable;
}

RoomManager.register = function( roomID, title, desc, maxConnectable, preConnect, config )
{
    RoomManager._list.push(
    {
        roomID: roomID,
        title: title,
        desc: desc,
        maxConnectable: maxConnectable,
        preConnect: preConnect,
        config: config
    } );
}

hook.register( "Initialize", function( )
{
    RoomManager.register( "osu", "빅 홀 오스", "많은 사람들이 거주하는 중앙 마을.", 3000 );
    RoomManager.register( "home", "벨 시에로 보육원", "안전하고 아늑한 공간.", 15 );
    RoomManager.register( "24hournc", "24시간 나이트코어", "나이트코어를 좋아하시나요?", 30, null,
    {
        disallow_queue_request: true,
        video_position_bar_color:
        {
            r: 247,
            g: 247,
            b: 150
        }
    } );

    RoomManager.register( "24hourjapan", "24시간 우타이테", "우타이테 곡을 들으면서 작업하세요.", 30, null,
    {
        disallow_queue_request: true,
        video_position_bar_color:
        {
            r: 247,
            g: 88,
            b: 150
        }
    } );
    // RoomManager.register( "nanachi", "파괴된 나나치의 은신처", "으아아아앙..", 3, function( ipAddress )
    // {
    //     return {
    //         access: false,
    //         reason: "이곳엔 아무것도 없다."
    //     };
    // } );

    hook.run( "RoomInitialized", RoomManager._list );
} );

// RoomManager.register( "test", "테스트", "테스트를 위한 공간", 5, function( socket )
// {
//     if ( socket.handshake.address == "1.224.53.166" )
//     {
//         return true;
//     }

//     return false;
// } );

module.exports = RoomManager;*/