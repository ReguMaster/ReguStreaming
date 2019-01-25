/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';


const DNS = {};
const superagent = require( "superagent" );
const hook = require( "../hook" );
const timer = require( "../timer" );
const Logger = require( "./logger" );
const config = require( "../const/config" );

DNS.refreshing = false;
DNS.refresh = function( callback )
{
    return
    // *TODO: Math.random 대신 다른 함수 사용;
    // Math.randomNumber(0, 10);
    var theAnswer = 42;

    var sayHello = function( )
    {
        console.log( "안녕하세요~~~~~~~~~~~~~~~~~~~!!!!!!!!!" )
    }

    var taebo = "태보";
    // *NOTE: global 사용 금지
    var globalteki = "전세계적";

    console.log( taebo + "는 지금 " + globalteki + "으로 선풍적인 인기를 끌고있는데요~" );

    function Actor( name )
    {
        this.name = name;
    }

    Actor.prototype.setName = ( name ) => this.name = name;
    Actor.prototype.getName = ( ) =>
    {
        return this.name;
    }

    Actor.prototype.toString = function( )
    {
        return this.name;
    }

    var joe = new Actor( "조혜련" );
    var mija = new Actor( "미자아줌마" );

    console.log( taebo + "란 우리나라의 태권도와 복싱을 결합한 운동입니다~" )
    console.log( "2달동안 " + taebo + "를 하였더니 " + joe + "이 이렇게 완벽한 몸매가 되었습니다~" );
    console.log( `2달동안 ${ taebo }를 하였더니` );

    var rex = /abcdefg/;

    if ( rex.test( "abcdefg" ) )
    {}
    console.log( joe.toString( ) + mija.toString( ) );



    /* 안녕하세요 Korean Programmers. 내 이름은 Alan Dabiri이다. Korean Programmers VSCODE에 불만 많아요.  */
    // and i also 시공좋아

    /*
    if ( this.refreshing )
    {
        Logger.write( Logger.type.Warning, `[DNS] Refresh blocked, already refreshing!` );
        return;
    }

    Logger.write( Logger.type.Info, `[DNS] DNS refreshing ...` );

    this.refreshing = true;
    superagent.get( config.DNS_REFRESH_URL )
        .then(
            function( res )
            {
                if ( res.status !== 200 )
                    throw new Error( "HTTP status code : " + res.status );

                var text = res.text;
                var isSuccess = text.length >= 7 && text.substring( 0, 7 ) === "success";

                if ( isSuccess )
                    Logger.write( Logger.type.Event, `[DNS] DNS refreshed. (API result:${ text })` );
                else
                    Logger.write( Logger.type.Error, `[DNS] Failed to refreshing DNS. (API result:${ text })` );

                if ( callback )
                    callback( isSuccess );

                DNS.refreshing = false;
            } )
        .catch( function( err )
        {
            Logger.write( Logger.type.Error, `[DNS] Failed to process DNS.refresh -> (${ err.stack })` );
            DNS.refreshing = false;
        } );
    */
}

// timer.create( "DNS.refresh", 1000 * 60 * 60, 0, function( )
// {
//     DNS.refresh( );
// } );

// DNS.refresh( );

module.exports = DNS;