/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const QueueManager = {};
const path = require( "path" );
const App = require( "../app" );
const Server = require( "../server" );
// const RoomManager = require( "./room" );
const YoutubeConverter = require( "horizon-youtube-mp3" );
const URL = require( "url" );
const querystring = require( "querystring" );
const fileStream = require( "fs" );
const util = require( "../util" );
const Logger = require( "./logger" );
const ChatManager = require( "./chat" );
const hook = require( "../hook" );
const superagent = require( "superagent" );
const cheerio = require( "cheerio" );
const getDuration = require( "get-video-duration" );
const ServiceManager = require( "./service" );
// const datastream = require( "../datastream" );
const decodeHTML = require( "decode-html" );

// const datastream = require( "../datastream" );
// const getVideoInfo = require( "get-video-info" );

QueueManager.providerType = {
    Youtube: 0,
    Ani24: 1,
    Tvple: 2,
    Direct: 3,
    KakaoTV: 4
}

// 오후 8:41 - RIPPLE: 사클
// 오후 8:41 - RIPPLE: 지금보니
// 오후 8:41 - RIPPLE: /tracks로 요청하면
// 오후 8:41 - RIPPLE: stream_url도 보내줌
// 오후 8:42 - RIPPLE: /tracks로 요청할 필요도 없고
// 오후 8:42 - RIPPLE: https://api.soundcloud.com/tracks/13158665/stream?client_id=8df0d68fcc1920c92fc389b89e7ce20f
// 오후 8:43 - RIPPLE: 이렇게 요청하면 302로 바로 뿌려주네요
// 오후 8:43 - RIPPLE: 리다이렉트로 뿌려주는 url을 재활용이 가능한지는 모르겠음

// https://api.soundcloud.com/tracks/13158665/stream?client_id=8df0d68fcc1920c92fc389b89e7ce20f
// http://a0000001114.site/ani_video/32363.html
// http://ani24.co/ani_view/32411.html
// var uu = "http://ani24.co/ani_view/32363.html"
// var urlParsed = url.parse( uu );

QueueManager.urlValidChecker = [
    {
        type: QueueManager.providerType.KakaoTV,
        host: "tv.kakao.com",
        validFormat: "https://tv.kakao.com/channel/2681352/cliplink/388542402",
        checker: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );
            var id = Number( p[ p.length - 1 ] );

            if ( id && !isNaN( id ) )
            {
                return urlParsed.href;
            }
        },
        getVideoID: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );

            return p[ p.length - 1 ];
        }
    },
    {
        type: QueueManager.providerType.Youtube,
        host: [ "youtube.com", "www.youtube.com" ],
        validFormat: "https://www.youtube.com/watch?v=AD5TWU_0M-k",
        checker: function( urlParsed, query )
        {
            if ( !query.v ) return false;

            return "https://www.youtube.com/watch?v=" + query.v;
        },
        getVideoID: function( urlParsed, query )
        {
            return query.v;
        }
    },
    {
        type: QueueManager.providerType.Youtube,
        host: "youtu.be",
        validFormat: "https://www.youtube.com/watch?v=AD5TWU_0M-k",
        checker: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );

            return "https://www.youtube.com/watch?v=" + p[ p.length - 1 ];
        },
        getVideoID: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );

            return p[ p.length - 1 ];
        }
    },
    {
        type: QueueManager.providerType.Ani24,
        host: [ "ani24.co", "ani24tv.com" ],
        validFormat: "http://ani24tv.com/ani_view/32363.html",
        checker: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );
            var id = Number( p[ p.length - 1 ].replace( ".html", "" ) );

            if ( urlParsed.pathname.indexOf( "/ani_view/" ) === 0 && id && !isNaN( id ) )
            {
                return urlParsed.href;
            }

            return false;
        },
        getVideoID: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );
            var id = Number( p[ p.length - 1 ].replace( ".html", "" ) );

            if ( id && !isNaN( id ) )
                return id.toString( );
        }
    },
    {
        type: QueueManager.providerType.Tvple,
        host: "tvple.com",
        validFormat: "http://tvple.com/other/194734",
        checker: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );
            var id = Number( p[ p.length - 1 ] );
            // var category = [
            //     "parody",
            //     "ent",
            //     "ani",
            //     "game",
            //     "humor",
            //     "sisa",
            //     "sport",
            //     "fashion",
            //     "tech",
            //     "life",
            //     "jculture",
            //     "other"
            // ];

            if ( id && !isNaN( id ) )
            {
                return urlParsed.href;
            }
            // if ( urlParsed.pathname.indexOf( "/ani_view/" ) === 0 )
            // {
            //     return urlParsed.href;
            // }

            return false;
        },
        getVideoID: function( urlParsed, query )
        {
            var p = urlParsed.pathname.split( "/" );
            var id = Number( p[ p.length - 1 ] );

            if ( id && !isNaN( id ) )
            {
                return id.toString( );
            }
        }
    }
];

QueueManager.isAllowRegister = function( client, roomID, data, force = false )
{
    if ( !force )
    {
        if ( !this.isEmpty( roomID ) && this.isOnTimeDelay( client, true ) )
            return {
                code: this.statusCode.delayError
            };
    }

    if ( Server.getRoomConfig( roomID, "disallow_queue_request", false ) )
        return {
            code: this.statusCode.roomConfigDisallowError
        };

    if ( data.url.length <= 0 )
        return {
            code: this.statusCode.urlError
        };

    if ( isNaN( data.start ) )
        return {
            code: this.statusCode.startTimeError
        };

    var urlParsed = URL.parse( data.url );

    if ( urlParsed && urlParsed.host )
    {
        var query = querystring.parse( urlParsed.query );

        if ( query )
        {
            var length = this.urlValidChecker.length;

            for ( var i = 0; i < length; i++ )
            {
                var checkerData = this.urlValidChecker[ i ];

                if ( typeof checkerData.host === "object" && checkerData.host.length )
                {
                    var length2 = checkerData.host.length;

                    for ( var i2 = 0; i2 < length2; i2++ )
                    {
                        if ( urlParsed.host === checkerData.host[ i2 ] )
                        {
                            var checkResult = checkerData.checker( urlParsed, query );

                            if ( !checkResult )
                            {
                                return {
                                    code: this.statusCode.urlError,
                                    validFormat: checkerData.validFormat
                                };
                            }
                            else if ( typeof checkResult === "string" )
                            {
                                return {
                                    code: this.statusCode.success,
                                    type: checkerData.type,
                                    newURL: checkResult,
                                    videoID: checkerData.getVideoID ? checkerData.getVideoID( urlParsed, query ) : ""
                                };
                            }
                        }
                    }
                }
                else
                {
                    if ( urlParsed.host === checkerData.host )
                    {
                        var checkResult = checkerData.checker( urlParsed, query );

                        if ( !checkResult )
                        {
                            return {
                                code: this.statusCode.urlError,
                                validFormat: checkerData.validFormat
                            };
                        }
                        else if ( typeof checkResult === "string" )
                        {
                            if ( !ServiceManager.isQueueRegisterAllowed( roomID, checkerData.type ) )
                                return {
                                    code: this.statusCode.serviceBlockedError
                                };

                            return {
                                code: this.statusCode.success,
                                type: checkerData.type,
                                newURL: checkResult,
                                videoID: checkerData.getVideoID ? checkerData.getVideoID( urlParsed, query ) : ""
                            };
                        }
                        else if ( typeof checkResult === "boolean" )
                        {
                            if ( !ServiceManager.isQueueRegisterAllowed( roomID, checkerData.type ) )
                                return {
                                    code: this.statusCode.serviceBlockedError
                                };

                            return {
                                code: this.statusCode.success,
                                type: checkerData.type,
                                newURL: data.url,
                                videoID: checkerData.getVideoID ? checkerData.getVideoID( urlParsed, query ) : ""
                            };
                        }
                    }
                }
            }

            return {
                code: this.statusCode.urlError
            };
        }
    }
    else
        return {
            code: this.statusCode.urlError
        };

    return {
        code: this.statusCode.unknownError
    };
}


// QueueManager._queueList = [ ];
QueueManager._recentClientList = [ ];
// QueueManager.currentQueueData = [ ];
// QueueManager.currentPlayingPos = [ ]

QueueManager.config = {
    DELAY: 1000 * 60, // 수정 바람 60
    LANGUAGE_CODE: "ko"
    // MAX_DURATION: 420, // 420
    // DIRECTORY: path.join( __dirname, "../public/youtube_sounds" ),
    // YOUTUBE_FILE_FORMAT: "yt_%s.mp3"
}

hook.register( "PreRegisterQueue", function( videoType, client, roomID, url, videoID )
{
    // if ( roomID === "osu" && videoType === QueueManager.providerType.Ani24 )
    // {
    //     return {
    //         accept: false,
    //         reason: "'빅 홀 오스' 채널에서는 애니메이션을 재생할 수 없습니다, 애니메이션 채널로 이동해주세요."
    //     }
    // }

    // if ( roomID === "anime" && videoType === QueueManager.providerType.Youtube )
    // {
    //     return {
    //         accept: false,
    //         reason: "'애니메이션' 채널에서는 유튜브를 재생할 수 없습니다, 다른 채널로 이동해주세요."
    //     }
    // }
} );

// hook.register( "RoomInitialized", function( rooms )
// {
//     var length = rooms.length;

//     for ( var i = 0; i < length; i++ )
//     {
//         var roomID = rooms[ i ].roomID;

//         QueueManager._queueList[ roomID ] = [ ];
//         QueueManager.currentQueueData[ roomID ] = {};
//         QueueManager.currentPlayingPos[ roomID ] = 0;
//         QueueManager._randomVideos[ roomID ] = [ ];

//         hook.run( "RoomQueueCreated", roomID );
//     }
// } );

QueueManager.getYoutubeHighQualityResource = function( data )
{
    try
    {
        var highQualityValue = 0;
        var highQualityIndexValue;

        data.videoFormats.forEach( ( value, index, ar ) =>
        {
            if ( value.quality_label && value.audioEncoding )
            {
                if ( highQualityValue < Number( value.quality_label.replace( "p", "" ) ) )
                {
                    highQualityValue = Number( value.quality_label.replace( "p", "" ) );
                    highQualityIndexValue = value;
                }
            }
        } );

        // *해결*
        // 가끔 url 없어서 가버렷..
        // https://www.youtube.com/watch?v=UpxX86eXQtI&list=FLqSiujw1tboyUDWc50UKrkA&t=0s&index=2
        if ( highQualityIndexValue == null )
        {
            highQualityValue = 0;

            data.videoFormats.forEach( ( value, index, ar ) =>
            {
                if ( value.resolution && value.audioEncoding )
                {
                    if ( highQualityValue < Number( value.resolution.replace( "p", "" ) ) )
                    {
                        highQualityValue = Number( value.resolution.replace( "p", "" ) );
                        highQualityIndexValue = value;
                    }
                }
            } );
        }

        return {
            videoThumbnail: data.videoThumbList[ data.videoThumbList.length - 1 ].url,
            videoDirectURL: highQualityIndexValue.url
        }
    }
    catch ( exception )
    {
        Logger.write( Logger.LogType.Error, `[Queue] ERROR: Unknown server process error. -> (Error: ${ exception.stack })'` );

        return {
            videoThumbnail: "images/nanachi.png",
            videoDirectURL: ""
        }
    }
}

QueueManager.getYoutubeCaption = function( languageCode, vssId, captionList, callback )
{
    if ( captionList && captionList.length )
    {
        var caption = captionList.find( function( t )
        {
            return t.languageCode === languageCode && t.vssId === vssId;
        } );

        if ( caption )
        {
            var url = caption.baseUrl;

            superagent.get( url )
                .then(
                    function( res )
                    {
                        if ( res.status !== 200 )
                            throw new Error( "HTTP error code : " + res.statusCode );

                        util.parseXML( res.text, function( err, result )
                        {
                            if ( err )
                                throw new Error( "XML parse error : " + err );

                            if ( result.transcript && result.transcript.text )
                            {
                                // 2018-07-19 2:35:44 (!    ERROR    !) : [Queue] Failed to process QueueManager.getYoutubeCaption -> (TypeError: Cannot read property 'replace' of undefined
                                // at decodeHTMLEntities (D:\NodeJS\ReguStreaming\regustreaming\node_modules\decode-html\index.js:15:14)
                                // at D:\NodeJS\ReguStreaming\regustreaming\modules\queue.js:394:50
                                // at Array.map (native)
                                // at D:\NodeJS\ReguStreaming\regustreaming\modules\queue.js:391:76
                                // at D:\NodeJS\ReguStreaming\regustreaming\util.js:44:9
                                // at Parser.<anonymous> (D:\NodeJS\ReguStreaming\regustreaming\node_modules\xml2js\lib\parser.js:303:18)
                                // at emitOne (events.js:96:13)
                                // at Parser.emit (events.js:188:7)
                                // at Object.onclosetag (D:\NodeJS\ReguStreaming\regustreaming\node_modules\xml2js\lib\parser.js:261:26)
                                // at emit (D:\NodeJS\ReguStreaming\regustreaming\node_modules\sax\lib\sax.js:624:35)
                                // at emitNode (D:\NodeJS\ReguStreaming\regustreaming\node_modules\sax\lib\sax.js:629:5))

                                var newResult = result.transcript.text.map( function( source )
                                {
                                    if ( source && source.attr )
                                    {
                                        return {
                                            val: source.val ? decodeHTML( source.val ) : "",
                                            attr:
                                            {
                                                start: Number( source.attr.start ),
                                                dur: Number( source.attr.dur )
                                            }
                                        }
                                    }
                                    else
                                        return source;
                                } );

                                callback( true, newResult );
                            }
                            else
                                throw new Error( "Unknown javascript object : " + result );
                        } );
                    } )
                .catch( function( err )
                {
                    callback( false, null );
                    Logger.write( Logger.LogType.Error, `[Queue] Failed to process QueueManager.getYoutubeCaption -> (${ err.stack })` );
                } );
        }
        else
            return callback( false, null );
    }
    else
        return callback( false, null );
}

// *TODO;
// 여기다가 클라가 요청한 url 관련 기록도 넣기 (Logger에 해당) -> 썩쎽스
// 이상한 주소 넣었을때 처리바람 (Ani24) -> 썩쎽스
function registerFailed( client, reason, logErrorMessage, isRejected )
{
    if ( client )
    {
        client.emit( "regu.queueRegisterReceive",
        {
            success: false,
            reason: reason
        } );

        if ( isRejected )
            Logger.write( Logger.LogType.Warning, `[Queue] Client's queue register request has rejected! -> (${ logErrorMessage }) ${ client.information( ) }` );
        else
            Logger.write( Logger.LogType.Error, `[Queue] Failed to register Queue! -> (${ logErrorMessage }) ${ client.information( ) }` );
    }
    else
    {
        if ( isRejected )
            Logger.write( Logger.LogType.Warning, `[Queue] Client's queue register request has rejected! -> (${ logErrorMessage }) SERVER` );
        else
            Logger.write( Logger.LogType.Error, `[Queue] Failed to register Queue! -> (${ logErrorMessage }) SERVER` );
    }
}

QueueManager.userVote = function( client, type )
{
    var playingData = QueueManager.getPlayingData( client.room );

    if ( util.isEmpty( playingData ) )
    {
        return {
            success: false,
            reason: "영상이 재생중이지 않습니다."
        };
    }

    if ( type !== 0 && type !== 1 ) // 0: unlike, 1: like
    {
        return {
            success: false,
            reason: "좋아요 또는 싫어요만 할 수 있습니다."
        };
    }

    if ( playingData.userVote[ client.userID ] === type )
        delete playingData.userVote[ client.userID ];
    else
        playingData.userVote[ client.userID ] = type;

    var users = Object.keys( playingData.userVote );
    var usersLength = users.length;

    var like = 0,
        unlike = 0;

    for ( var i = 0; i < usersLength; i++ )
    {
        playingData.userVote[ users[ i ] ] === 1 ? like++ : unlike++;
    }

    playingData.userVoteSum = {
        like: like,
        unlike: unlike
    };

    return {
        success: true
    };
}

// params: client (클라이언트), code (오류 코드), url (입력한 주소(콘솔표시용)), err (콘솔에 표시할 오류메세지), isError (오류인지 표시, 아니면 reject status)
QueueManager._onRegister = function( client, code, url, err, isError )
{
    if ( client )
    {
        client.emit( "regu.queueRegisterReceive",
        {
            code: code
        } );
    }

    if ( code !== QueueManager.statusCode.success )
    {
        var keys = Object.keys( QueueManager.statusCode );

        if ( isError )
            Logger.write( Logger.LogType.Error, `[Queue] ERROR: Failed to register Queue. (url:${ url }, error:${ err.stack })\n${ ( client ? client.information( ) : "SERVER" ) }` );
        else
            Logger.write( Logger.LogType.Warning, `[Queue] Queue register request rejected. (url:${ url }, code:${ ( keys[ code ] || "unknown" ) }) ${ ( client ? client.information( ) : "SERVER" ) }` );
    }
}

// QueueManager._processRegisterYoutube( client, url, videoID, startPosition, 

QueueManager.statusCode = {
    success: 0,
    delayError: 1,
    roomConfigDisallowError: 2,
    urlError: 3,
    startTimeError: 4,
    serverError: 5,
    liveStreamError: 6,
    notValidError: 7,
    startPositionOverThanLengthError: 8,
    startPositionTooShortThanLengthError: 9,
    failedToGetInformationError: 10,
    unknownError: 11,
    serviceBlockedError: 50
};
QueueManager._processRegisterYoutube = function( client, roomID, url, videoID, startPosition, callback )
{
    var queueData = {};

    YoutubeConverter.getInfo( url,
    {
        lang: QueueManager.config.LANGUAGE_CODE
    }, function( err, data )
    {
        if ( err )
        {
            if ( typeof err === "string" )
            {
                // registerFailed( client,
                //     `죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다.(API_ERROR_${ err })`,
                //     `${ url } -> ${ err }`,
                //     false
                // );

                //client, code, url, err, isError
                if ( err === "errorOnGetInfo." )
                    return callback( client, QueueManager.statusCode.failedToGetInformationError, url, err, true );
                else
                    return callback( client, QueueManager.statusCode.serverError, url, err, true );
            }
            else
            {
                // registerFailed( client,
                //     "죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다. (API_ERROR_UNKNOWN)",
                //     `${ url } -> Unknown`,
                //     false
                // );

                return callback( client, QueueManager.statusCode.serverError, url, err, true );
            }

        }

        if ( !data.isValid )
            return callback( client, QueueManager.statusCode.notValidError, url, null, false );


        if ( data.isLivestream )
            return callback( client, QueueManager.statusCode.liveStreamError, url, null, false );

        var videoLengthSec = Number( data.videoTimeSec || 10 );

        // if ( videoLengthSec > QueueManager.config.MAX_DURATION )
        // {
        //     registerFailed( client,
        //         "죄송합니다, 영상이 최대 허용 길이를 초과했습니다, 영상 목록에 추가할 수 없습니다.",
        //         `${ url } -> OverTime`,
        //         true
        //     );

        //     return;
        // }

        // var videoLengthTime = util.calcTime( videoLengthSec );
        // var maxAllowLengthTime = util.calcTime( QueueManager.config.MAX_DURATION );

        if ( startPosition > videoLengthSec )
            return callback( client, QueueManager.statusCode.startPositionOverThanLengthError, url, null, false );
        // return registerFailed( client,
        //     "죄송합니다, 영상 시작 시간이 영상 길이를 초과했습니다, 영상 목록에 추가할 수 없습니다.",
        //     `${ url } -> StartLengthOver`,
        //     true
        // );

        if ( Math.abs( videoLengthSec - startPosition ) <= 10 )
            return callback( client, QueueManager.statusCode.startPositionTooShortThanLengthError, url, null, false );
        // return registerFailed( client,
        //     "죄송합니다, 영상 길이와 시작 시간의 간격이 너무 짧습니다 (10초 이하), 영상 목록에 추가할 수 없습니다.",
        //     `${ url } -> StartLengthTooShort`,
        //     true
        // );

        var highQualityResources = QueueManager.getYoutubeHighQualityResource( data );

        queueData.id = "yt_" + videoID + "_" + Date.now( );
        queueData.mediaName = data.videoName || "알 수 없음";
        queueData.mediaProvider = QueueManager.providerType.Youtube;
        queueData.mediaProviderURL = url;
        queueData.mediaThumbnail = highQualityResources.videoThumbnail;
        queueData.mediaContentURL = highQualityResources.videoDirectURL;
        queueData.mediaDuration = videoLengthSec;
        queueData.mediaPosition = startPosition;

        if ( client )
            queueData.user = {
                name: client.name,
                userID: client.userID,
                avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
                information: client.information( )
            };

        queueData.userVote = {};
        queueData.userVoteSum = {
            like: 0,
            unlike: 0
        };

        var newQueueData = hook.run( "ModifyQueueData", roomID, queueData );

        if ( newQueueData )
            queueData = newQueueData;

        var onRegister = function( )
        {
            if ( !Server.ROOM[ roomID ] )
            {
                if ( client )
                    client.emit( "regu.queueRegisterReceive", QueueManager.statusCode.unknownError );
                console.log( "room boombed..." )
                return;
            }

            var newData = util.deepCopy( queueData );
            newData.type = "register";

            // if ( client ) // client가 있을경우.
            // {
            //     client.emit( "regu.queueRegisterReceive",
            //     {
            //         code: QueueManager.statusCode.success
            //     } );
            // }

            callback( client, QueueManager.statusCode.success );

            Server.sendMessage( roomID, "regu.queue", newData );

            Server.ROOM[ roomID ].queueList.push( queueData );

            if ( client )
            {
                ChatManager.saySystem( roomID, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다. (${ queueData.user.name }님이 추가함)`, "glyphicon glyphicon-download", true );
                Server.emitDiscord( roomID,
                {
                    embed:
                    {
                        color: 10181046,
                        image:
                        {
                            url: queueData.mediaThumbnail
                        },
                        description: `'${ queueData.mediaName }' 영상이 대기열에 추가되었습니다.`,
                        author:
                        {
                            name: "대기열 추가"
                        },
                        url: "https://regustreaming.oa.to",
                        timestamp: new Date( ),
                        footer:
                        {
                            text: queueData.user.name + "님이 추가함"
                        }
                    }
                } );
            }
            else
            {
                ChatManager.saySystem( roomID, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다.`, "glyphicon glyphicon-download" );
                // Server.emitDiscord( Server.discordChannelType.Queue, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다.` );
            }

            Logger.write( Logger.LogType.Event, `[Queue] Queue registered. -> (${ url }) ${ client ? client.information( ) : "SERVER" }` );
        };

        if ( data.videoCaptions )
        {
            QueueManager.getYoutubeCaption( QueueManager.config.LANGUAGE_CODE, "." + QueueManager.config.LANGUAGE_CODE, data.videoCaptions, function( success, result )
            {
                if ( success )
                {
                    queueData.extra = {
                        caption: result
                    };
                }

                onRegister( );
            } );
        }
        else
            onRegister( );
    } );
}

QueueManager._processRegisterAni24 = function( client, roomID, url, videoID, startPosition, callback )
{
    var queueData = {};
    var urlParsed = URL.parse( url );

    // videoID = path.basename( urlParsed.path, path.extname( urlParsed.path ) ); // 이거 getVideoID 함수로 바꾸기

    // yhtgrfd.top/ani_video/
    superagent.get( "http://a0000001114.site/ani_video/" + videoID + ".html" )
        .set( "Referer", "https://ani24tv.com/ani_view/" + videoID + ".html" )
        .then( function( res ) // .catch  이렇게 넣기
            {
                if ( res.statusCode !== 200 )
                    return callback( client, QueueManager.statusCode.failedToGetInformationError, url, err, true );

                var text = res.text;

                // 무식하군.
                var fileIndex = text.indexOf( `{"file":` ) + 9;
                var fileEndIndex = text.indexOf( ",", fileIndex ) - 1;

                var titleIndex = text.indexOf( `title: '` ) + 8;
                var titleEndIndex = text.indexOf( "',", titleIndex );

                var file = text.substring( fileIndex, fileEndIndex )
                    .trim( );
                var title = text.substring( titleIndex, titleEndIndex )
                    .trim( );

                //http://test.cjeqqwsa.xyz/img/ani/32363.jpg
                //http://a0000001114.site/img/ani/32363.jpg
                getDuration( file )
                    .then( function( duration )
                    {
                        if ( startPosition > duration )
                            return callback( client, QueueManager.statusCode.startPositionOverThanLengthError, url, null, false );

                        if ( Math.abs( duration - startPosition ) <= 60 )
                            return callback( client, QueueManager.statusCode.startPositionTooShortThanLengthError, url, null, false );

                        queueData.id = "ani24_" + videoID + "_" + Date.now( );
                        queueData.mediaName = title || "알 수 없음";
                        queueData.mediaProvider = QueueManager.providerType.Ani24;
                        queueData.mediaProviderURL = url;
                        queueData.mediaThumbnail = `http://a0000001114.site/img/ani/${ videoID }.jpg`;
                        queueData.mediaContentURL = file;
                        queueData.mediaDuration = duration;
                        queueData.mediaPosition = startPosition;

                        if ( client )
                            queueData.user = {
                                name: client.name,
                                userID: client.userID,
                                avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
                                information: client.information( )
                            };

                        queueData.userVote = {};
                        queueData.userVoteSum = {
                            like: 0,
                            unlike: 0
                        };

                        var newQueueData = hook.run( "ModifyQueueData", roomID, queueData );

                        if ( newQueueData )
                            queueData = newQueueData;


                        // queueData.id = "ani24_" + videoID + "_" + Date.now( );
                        // queueData.videoName = title;
                        // queueData.videoProvider = "Ani24";
                        // queueData.videoThumbnail = `http://a0000001114.site/img/ani/${ videoID }.jpg`;
                        // queueData.videoLength = Number( duration || 10 );
                        // queueData.videoDirectURL = file;
                        // queueData.soundDirectURL = null;
                        // queueData.videoProviderURL = url;
                        // queueData.startTime = startSec;
                        // queueData.owner = client ? client.name : "채널 관리자";
                        // queueData.userID = client ? client.userID : "server";
                        // queueData.avatar = client ? client.getPassportField( "avatar", "/images/avatar/guest_64.png" ) : "/images/avatar/guest_64.png";
                        // queueData.videoConverted = true;

                        // client.emit( "regu.queueRegisterReceive",
                        // {
                        //     success: true
                        // } );

                        // // 여기서부터 해야함.
                        // // 2018-06-22

                        // Server.sendMessage( roomID, "regu.queue",
                        // {
                        //     type: "register",
                        //     id: queueData.id,
                        //     videoName: queueData.videoName,
                        //     videoThumbnail: queueData.videoThumbnail,
                        //     videoLength: queueData.videoLength,
                        //     startTime: queueData.startTime,
                        //     owner: queueData.owner,
                        //     userID: queueData.userID,
                        //     avatar: queueData.avatar,
                        //     videoConverted: queueData.videoConverted
                        // } );

                        var newData = util.deepCopy( queueData );
                        newData.type = "register";

                        // if ( client ) // client가 있을경우.
                        // {
                        //     client.emit( "regu.queueRegisterReceive",
                        //     {
                        //         code: QueueManager.statusCode.success
                        //     } );
                        // }

                        callback( client, QueueManager.statusCode.success );

                        Server.sendMessage( roomID, "regu.queue", newData );

                        Server.ROOM[ roomID ].queueList.push( queueData );

                        if ( client )
                            ChatManager.saySystem( roomID, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다. (${ queueData.user.name }님이 추가함)`, "glyphicon glyphicon-download" );
                        else
                            ChatManager.saySystem( roomID, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다.`, "glyphicon glyphicon-download" );

                        Logger.write( Logger.LogType.Event, `[Queue] Queue registered. -> (${ url }) ${ client ? client.information( ) : "SERVER" }` );
                    } )
                    .catch( function( err )
                    {
                        return callback( client, QueueManager.statusCode.serverError, url, err, true );
                    } )

            } )
        .catch( function( err )
        {
            return callback( client, QueueManager.statusCode.serverError, url, err, true );
        } );
}

function _getCloud( url, callback )
{
    superagent.get( url )
        .end( function( err, res )
        {
            if ( err )
            {
                console.log( "err " + err );
                callback( [ ] );
                return;
            }

            callback( JSON.parse( res.text ) );
        } );
}

QueueManager._processRegisterKakaoTV = function( client, roomID, url, videoID, startPosition )
{
    var queueData = {};

    // yhtgrfd.top/ani_video/
    superagent.get( "https://tv.kakao.com/embed/player/cliplink/" + videoID + "?autoplay=1&profile=HIGH&wmode=transparent" )
        .then( function( res ) // .catch  이렇게 넣기
            {
                if ( res.statusCode !== 200 )
                    return callback( client, QueueManager.statusCode.failedToGetInformationError, url, err, true );

                var text = res.text;

                fileStream.writeFileSync( "./test.html", text );

                console.log( text );

                var $ = cheerio.load( res.text );
                var videoElement = $( ".videoContainer" );

                console.log( videoElement );

                return callback( client, QueueManager.statusCode.failedToGetInformationError, url, err, true );


                getDuration( file )
                    .then( function( duration )
                    {
                        if ( startPosition > duration )
                            return callback( client, QueueManager.statusCode.startPositionOverThanLengthError, url, null, false );

                        if ( Math.abs( duration - startPosition ) <= 60 )
                            return callback( client, QueueManager.statusCode.startPositionTooShortThanLengthError, url, null, false );

                        queueData.id = "kakaotv_" + videoID + "_" + Date.now( );
                        queueData.mediaName = title || "알 수 없음";
                        queueData.mediaProvider = QueueManager.providerType.KakaoTV;
                        queueData.mediaProviderURL = url;
                        queueData.mediaThumbnail = "";
                        queueData.mediaContentURL = file;
                        queueData.mediaDuration = duration;
                        queueData.mediaPosition = startPosition;

                        if ( client )
                            queueData.user = {
                                name: client.name,
                                userID: client.userID,
                                avatar: client.getPassportField( "avatar", "/images/avatar/guest_64.png" ),
                                information: client.information( )
                            };

                        queueData.userVote = {};
                        queueData.userVoteSum = {
                            like: 0,
                            unlike: 0
                        };

                        var newQueueData = hook.run( "ModifyQueueData", roomID, queueData );

                        if ( newQueueData )
                            queueData = newQueueData;


                        // queueData.id = "ani24_" + videoID + "_" + Date.now( );
                        // queueData.videoName = title;
                        // queueData.videoProvider = "Ani24";
                        // queueData.videoThumbnail = `http://a0000001114.site/img/ani/${ videoID }.jpg`;
                        // queueData.videoLength = Number( duration || 10 );
                        // queueData.videoDirectURL = file;
                        // queueData.soundDirectURL = null;
                        // queueData.videoProviderURL = url;
                        // queueData.startTime = startSec;
                        // queueData.owner = client ? client.name : "채널 관리자";
                        // queueData.userID = client ? client.userID : "server";
                        // queueData.avatar = client ? client.getPassportField( "avatar", "/images/avatar/guest_64.png" ) : "/images/avatar/guest_64.png";
                        // queueData.videoConverted = true;

                        // client.emit( "regu.queueRegisterReceive",
                        // {
                        //     success: true
                        // } );

                        // // 여기서부터 해야함.
                        // // 2018-06-22

                        // Server.sendMessage( roomID, "regu.queue",
                        // {
                        //     type: "register",
                        //     id: queueData.id,
                        //     videoName: queueData.videoName,
                        //     videoThumbnail: queueData.videoThumbnail,
                        //     videoLength: queueData.videoLength,
                        //     startTime: queueData.startTime,
                        //     owner: queueData.owner,
                        //     userID: queueData.userID,
                        //     avatar: queueData.avatar,
                        //     videoConverted: queueData.videoConverted
                        // } );

                        var newData = util.deepCopy( queueData );
                        newData.type = "register";

                        // if ( client ) // client가 있을경우.
                        // {
                        //     client.emit( "regu.queueRegisterReceive",
                        //     {
                        //         code: QueueManager.statusCode.success
                        //     } );
                        // }

                        callback( client, QueueManager.statusCode.success );

                        Server.sendMessage( roomID, "regu.queue", newData );

                        Server.ROOM[ roomID ].queueList.push( queueData );

                        if ( client )
                            ChatManager.saySystem( roomID, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다. (${ queueData.user.name }님이 추가함)`, "glyphicon glyphicon-download" );
                        else
                            ChatManager.saySystem( roomID, `'${ queueData.mediaName }' 영상이 목록에 추가되었습니다.`, "glyphicon glyphicon-download" );

                        Logger.write( Logger.LogType.Event, `[Queue] Queue registered. -> (${ url }) ${ client ? client.information( ) : "SERVER" }` );
                    } )
                    .catch( function( err )
                    {
                        return callback( client, QueueManager.statusCode.serverError, url, err, true );
                    } )

            } )
        .catch( function( err )
        {
            return callback( client, QueueManager.statusCode.serverError, url, err, true );
        } );
}

// 오류 코드들 정리점;
QueueManager._processRegisterTvple = function( client, roomID, url, videoID, startSec )
{
    var queueData = {};
    var urlParsed = URL.parse( url );

    superagent.get( "http://tvple.com/" + videoID )
        .end( function( err, res )
        {
            if ( err )
                return registerFailed( client,
                    "죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다. (API_ERROR_VARIOUS)",
                    `${ url } -> ${ err }`,
                    false
                );

            if ( res.statusCode !== 200 )
                return registerFailed( client,
                    `죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다.(SERVER_ERROR_CONNECTION)`,
                    `${ url } -> ${ res.statusCode }`,
                    false
                );

            var $ = cheerio.load( res.text );

            var apiURL = $( "#video-player" )
                .attr( "data-meta" );

            var videoName = $( "meta[property='og:title']" )
                .attr( "content" );
            var videoThumbnail = $( "meta[property='og:image']" )
                .attr( "content" );
            // .replace( ".md-16x9", ".gif" );

            superagent.get( apiURL )
                .end( function( err2, res2 )
                {
                    if ( err2 )
                    {
                        registerFailed( client,
                            "죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다. (API_ERROR_TVPLE)",
                            `${ url } -> ${ err2 }`,
                            false
                        );

                        return;
                    }

                    if ( res2.statusCode !== 200 )
                    {
                        registerFailed( client,
                            `죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다.(SERVER_ERROR_CONNECTION)`,
                            `${ url } -> ${ res2.statusCode }`,
                            false
                        );

                        return;
                    }

                    try
                    {
                        var jsonResult = JSON.parse( res2.text );

                        if ( jsonResult.status === 200 )
                        {
                            var duration = jsonResult.stream.duration || 0;

                            if ( duration < startSec )
                            {
                                registerFailed( client,
                                    "죄송합니다, 입력한 시작 시간이 영상 길이보다 더 이후입니다.", // 안내문 수정 바람.
                                    `${ url } -> StartLengthOver`,
                                    true
                                );

                                return;
                            }

                            if ( startSec > 0 && Math.abs( duration - startSec ) <= 10 ) // *TODO; 길이 수정바람
                            {
                                registerFailed( client,
                                    "죄송합니다, 입력한 시작 시간과 영상 길이간의 간격이 너무 짧습니다.", // *TODO; 안내문 수정 바람.
                                    `${ url } -> StartLengthTooShort`,
                                    true
                                );

                                return;
                            }

                            queueData.id = "tvple_" + videoID + "_" + Date.now( );
                            queueData.videoName = videoName;
                            queueData.videoProvider = "Tvple";
                            queueData.videoThumbnail = videoThumbnail;
                            queueData.videoLength = duration;
                            queueData.videoDirectURL = jsonResult.stream.sources.a.urls.mp4_avc;
                            queueData.soundDirectURL = null;
                            queueData.videoProviderURL = url;
                            queueData.startTime = startSec;
                            queueData.owner = client ? client.name : "채널 관리자";
                            queueData.userID = client ? client.userID : "server";
                            queueData.avatar = client ? client.getPassportField( "avatar", "/images/avatar/guest_64.png" ) : "/images/avatar/guest_64.png";
                            queueData.videoConverted = true;

                            _getCloud( jsonResult.cloud.read_url, function( cloud )
                            {
                                queueData.cloud = cloud;

                                client.emit( "regu.queueRegisterReceive",
                                {
                                    success: true
                                } );

                                Server.sendMessage( roomID, "regu.queue",
                                {
                                    type: "register",
                                    id: queueData.id,
                                    videoName: queueData.videoName,
                                    videoThumbnail: queueData.videoThumbnail,
                                    videoLength: queueData.videoLength,
                                    startTime: queueData.startTime,
                                    owner: queueData.owner,
                                    userID: queueData.userID,
                                    avatar: queueData.avatar,
                                    videoConverted: queueData.videoConverted
                                } );

                                ChatManager.saySystem( roomID, queueData.videoName + " 영상이 목록에 추가되었습니다. (by " + ( client ? ( client.name + "#" + client.userID ) : "서버" ) + ")", "glyphicon glyphicon-download" );

                                QueueManager._queueList[ roomID ].push( queueData );
                            } );
                        }
                        else
                        {
                            registerFailed( client,
                                `죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다.(API_ERROR_CODE)`,
                                `${ url } -> ${ jsonResult.status }`,
                                false
                            );

                        }
                    }
                    catch ( exception2 )
                    {
                        registerFailed( client,
                            `죄송합니다, 서버 처리 중 오류가 발생했습니다, 영상 목록에 추가할 수 없습니다.(SERVER_ERROR_EXCEPTION)`,
                            `${ url } -> ${ exception2.stack }`,
                            false
                        );
                    }
                } );
        } );
}

QueueManager._processRegisterDirect = function( client, roomID, url, videoID, startSec )
{
    getDuration( url )
        .then( function( duration )
        {
            var queueData = {};
            queueData.id = "direct_" + videoID + "_" + Date.now( );
            queueData.videoName = url;
            queueData.videoProvider = "Direct";
            queueData.videoThumbnail = "";
            queueData.videoLength = duration;
            queueData.videoDirectURL = url;
            queueData.soundDirectURL = null;
            queueData.videoProviderURL = url;
            queueData.startTime = startSec;
            queueData.owner = client ? client.name : "채널 관리자";
            queueData.userID = client ? client.userID : "server";
            queueData.avatar = client ? client.getPassportField( "avatar", "/images/avatar/guest_64.png" ) : "/images/avatar/guest_64.png";
            queueData.videoConverted = true;

            if ( client )
            {
                client.emit( "regu.queueRegisterReceive",
                {
                    success: true
                } );
            }

            Server.sendMessage( roomID, "regu.queue",
            {
                type: "register",
                id: queueData.id,
                videoName: queueData.videoName,
                videoThumbnail: queueData.videoThumbnail,
                videoLength: queueData.videoLength,
                startTime: queueData.startTime,
                owner: queueData.owner,
                userID: queueData.userID,
                avatar: queueData.avatar,
                videoConverted: queueData.videoConverted
            } );

            ChatManager.saySystem( roomID, queueData.videoName + " 영상이 목록에 추가되었습니다. (by " + ( client ? ( client.name + "#" + client.userID ) : "서버" ) + ")", "glyphicon glyphicon-download" );

            QueueManager._queueList[ roomID ].push( queueData );
        } );
}

QueueManager.getCount = function( roomID )
{
    if ( !Server.ROOM[ roomID ] ) return 0;

    return Server.ROOM[ roomID ].queueList.length || 0;
}

QueueManager.getPlayingData = function( roomID )
{
    if ( !Server.ROOM[ roomID ] ) return {};

    return Server.ROOM[ roomID ].currentPlayingQueue ||
    {};
}

QueueManager.register = function( providerType, client, roomID, url, videoID, startPosition, force )
{
    var can = force ?
    {
        accept: true
    } : hook.run( "CanRegisterQueue", providerType, client, roomID, url, videoID );

    if ( can && !can.accept )
    {
        registerFailed( client, can.reason, can.reason, true );
        return;
    }

    if ( !force )
        QueueManager.registerTimeDelay( client, QueueManager.config.DELAY );

    switch ( providerType )
    {
        // function( client, url, videoID, startPosition, callback )
        case QueueManager.providerType.Youtube:
            this._processRegisterYoutube( client, roomID, url, videoID, startPosition, QueueManager._onRegister );
            break;
        case QueueManager.providerType.Ani24:
            this._processRegisterAni24( client, roomID, url, videoID, startPosition, QueueManager._onRegister );
            break;
        case QueueManager.providerType.Tvple:
            this._processRegisterTvple( client, roomID, url, videoID, startPosition, QueueManager._onRegister );
            break;
        case QueueManager.providerType.Direct:
            this._processRegisterDirect( client, roomID, url, videoID, startPosition, QueueManager._onRegister );
            break;
        case QueueManager.providerType.KakaoTV:
            this._processRegisterKakaoTV( client, roomID, url, videoID, startPosition, QueueManager._onRegister );
            break;
    }
}

QueueManager.clear = function( roomID, alsoPlayingQueue )
{
    if ( !Server.ROOM[ roomID ] ) return;

    Server.ROOM[ roomID ].queueList = [ ];

    if ( alsoPlayingQueue )
    {
        QueueManager.skip( roomID );
    }

    Server.sendMessage( roomID, "regu.queue",
    {
        type: "dataReq",
        queueList: Server.ROOM[ roomID ].queueList
    } );
}

QueueManager.skip = function( roomID )
{
    if ( !Server.ROOM[ roomID ] ) return;
    if ( !this.isPlaying( roomID ) ) return;

    Server.ROOM[ roomID ].currentPlayingQueue = {};

    Server.sendMessage( roomID, "RS.mediaPlay",
    {
        empty: true
    } );
}

QueueManager.removeAt = function( roomID, index )
{
    if ( Server.ROOM[ roomID ] && index >= 0 && index < Server.ROOM[ roomID ].queueList.length )
    {
        Server.ROOM[ roomID ].queueList.splice( index, 1 );

        Server.sendMessage( roomID, "regu.queue",
        {
            type: "dataReq",
            queueList: Server.ROOM[ roomID ].queueList
        } );
    }
}

QueueManager.moveTo = function( roomID, index, toIndex ) {

}

QueueManager.setVideoPos = function( roomID, pos )
{
    if ( !Server.ROOM[ roomID ] ) return;
    if ( !this.isPlaying( roomID ) ) return;

    Server.ROOM[ roomID ].currentPlayingPos = pos;
    Server.sendMessage( roomID, "RS.setMediaPos", pos );
}

QueueManager.removeFirst = function( roomID )
{
    if ( Server.ROOM[ roomID ] && Server.ROOM[ roomID ].queueList.length > 0 ) // 수정 바람
    {
        Server.ROOM[ roomID ].queueList.splice( 0, 1 );

        Server.sendMessage( roomID, "regu.queue",
        {
            type: "removeRecent"
        } );
    }
}

QueueManager.isEmpty = function( roomID )
{
    if ( !Server.ROOM[ roomID ] ) return true;

    return Server.ROOM[ roomID ].queueList.length == 0;
}

// var urlParsedObj = url.parse("https://www.youtube.com/watch?v=A8KrxWUnsWo");
// var querystringParsedObj = querystring.parse(urlParsedObj.query);
// console.log(querystringParsedObj);

QueueManager.sendQueueList = function( socket, roomID )
{
    if ( !Server.ROOM[ roomID ] ) return;

    socket.emit( "regu.queue",
    {
        type: "dataReq",
        queueList: Server.ROOM[ roomID ].queueList
    } );
}

QueueManager.sendUserVoteList = function( socket, roomID )
{
    socket.emit( "regu.queue",
    {
        type: "userVoteRefresh",
        voteList: QueueManager.getPlayingData( roomID )
            .userVoteSum
    } );
}

QueueManager.continueQueue = function( roomID )
{
    QueueManager.play( roomID );
}

QueueManager.play = function( roomID )
{
    if ( QueueManager.isEmpty( roomID ) )
    {
        Logger.write( Logger.LogType.Warning, `[Queue] [${ roomID }] Room queue is Empty!` );
        return;
    }

    var recentQueue = Server.ROOM[ roomID ].queueList[ 0 ];

    Server.ROOM[ roomID ].currentPlayingQueue = recentQueue;
    Server.ROOM[ roomID ].currentPlayingPos = recentQueue.mediaPosition;

    Server.sendMessage( roomID, "RS.mediaPlay", recentQueue );

    ChatManager.saySystem( roomID, `'${ recentQueue.mediaName }' 영상을 재생합니다.`, "glyphicon glyphicon-music", true );
    Server.emitDiscord( roomID,
    {
        embed:
        {
            color: 10181046,
            description: `'${ recentQueue.mediaName }' 영상을 재생합니다.`,
            author:
            {
                name: "대기열 재생"
            },
            url: "https://regustreaming.oa.to",
            timestamp: new Date( ),
            footer:
            {
                text: ( recentQueue.user ? recentQueue.user.name : "채널 관리자" ) + "님이 추가함"
            }
        }
    } );

    QueueManager.removeFirst( roomID );

    Logger.write( Logger.LogType.Event, `[Queue] [${ roomID }] Room playing ${ recentQueue.mediaName }-${ recentQueue.mediaProviderURL } by (${ ( recentQueue.user ? recentQueue.user.information : "SERVER" ) })` );

    hook.run( "PostPlayQueue", roomID, recentQueue );
}


// 남용 막기 위해 이 시스템은 roomID 설정을 안함;
QueueManager.registerTimeDelay = function( client, delay )
{
    QueueManager.removeTimeDelay( client ); // 이미 있는 경우 처리

    QueueManager._recentClientList.push(
    {
        identification: client.ipAddress,
        delay: Date.now( ) + delay,
        lastQueueRequest: null // *TODO;
    } );
}

QueueManager.isOnTimeDelay = function( client, checkDelay )
{
    for ( var i = 0; i < QueueManager._recentClientList.length; i++ )
    {
        if ( QueueManager._recentClientList[ i ].identification == client.ipAddress )
        {
            if ( checkDelay )
            {
                if ( Date.now( ) >= QueueManager._recentClientList[ i ].delay ) return false;
                else return true;
            }
            else
                return true;
        }
    }

    return false;
}

QueueManager.removeTimeDelay = function( client )
{
    for ( var i = 0; i < QueueManager._recentClientList.length; i++ )
    {
        if ( QueueManager._recentClientList[ i ].identification == client.ipAddress )
        {
            QueueManager._recentClientList.splice( i, 1 );
            break;
        }
    }
}

QueueManager.forceAdd = function( roomID, url )
{
    // var reason = QueueManager.preQueueRegister( null, roomID,
    // {
    //     url: url
    // }, true );

    // if ( !reason.accept )
    // {
    //     Logger.write( Logger.LogType.Error, `[Queue] Queue register request rejected! -> 'reason: ${ reason.reason }' SERVER` );
    //     return;
    // }

    // QueueManager.register( QueueManager.providerType.Ani24, null, roomID, url, url );
}

QueueManager.config.randomPlayList = {
    _24hournc: [
        "https://www.youtube.com/playlist?list=PLckeMyCaCCIN_JU1V4oADW50DlGOREoLj"
    ],
    _24hourjapan: [
        "https://www.youtube.com/playlist?list=PLwe1-DOXcLUYoY-3Crzq1f2ay-bnIOhOT"
    ]
};
QueueManager._randomVideos = [ ];

hook.register( "OnCreateOfficialRoom", function( )
{
    hook.register( "TickTok", function( )
    {
        util.forEach( Server.ROOM, ( room ) =>
        {
            var roomID = room.roomID;
            var currentQueueData = room.currentPlayingQueue;

            if ( !QueueManager.isEmpty( roomID ) && util.isEmpty( currentQueueData ) )
            {
                QueueManager.play( roomID );
                return;
            }
            else if ( QueueManager.isEmpty( roomID ) && util.isEmpty( currentQueueData ) )
                return

            if ( currentQueueData.mediaDuration <= room.currentPlayingPos - 3 ) // 3초 딜레이
            {
                if ( QueueManager.isEmpty( roomID ) )
                {
                    QueueManager.skip( roomID );

                    // Server.sendMessage( roomID, "RS.mediaPlay",
                    // {
                    //     empty: true
                    // } );
                    return;
                }

                QueueManager.play( roomID );

                return;
            }

            room.currentPlayingPos += Server.getRoomConfig( roomID, "playbackRate", 1.0 );
        } );

        // for ( var i = 0; i < roomIDListLength; i++ )
        // {
        //     var roomID = roomIDList[ i ];

        // }
    } );

    if ( !App.config.enableAutoQueue ) return;

    util.forEach( Server.ROOM, ( room ) =>
    {
        var roomID = room.roomID;

        if ( roomID !== "24hournc" && roomID !== "24hourjapan" ) return;

        // console.log( QueueManager.config.randomPlayList[ Math.floor( Math.random( ) * QueueManager.config.randomPlayList.length ) ] );

        QueueManager.refreshRandomPlayList(
            QueueManager.config.randomPlayList[ "_" + roomID ][ Math.floor( Math.random( ) * QueueManager.config.randomPlayList[ "_" + roomID ].length ) ],
            function( videoList )
            {
                QueueManager._randomVideos[ roomID ] = videoList;

                var length = videoList.length < 10 ? videoList.length : 10;

                for ( var i = 0; i < length; i++ )
                {
                    var videoURL = videoList[ Math.floor( Math.random( ) * videoList.length ) ];
                    var urlParsed = URL.parse( videoURL );

                    if ( urlParsed )
                    {
                        var query = querystring.parse( urlParsed.query );

                        if ( query )
                        {
                            QueueManager.register( QueueManager.providerType.Youtube, null, roomID, videoURL, query.v, 0, true );
                        }
                    }
                }
            }
        );
    } );
} );

QueueManager.refreshRandomPlayList = function( listURL, callback )
{
    var videoList = [ ];

    superagent.get( listURL )
        .end( function( err, res )
        {
            if ( err )
            {
                console.log( err );
            }
            else
            {
                var $ = cheerio.load( res.text );
                var list = $( ".pl-video-title-link" );
                var length = list.length;

                for ( var i = 0; i < length; i++ )
                    videoList.push( "https://www.youtube.com" + list[ i ].attribs.href.replace( /&amp;/g, "&" ) );

                callback( videoList );
            }
        } );
}

hook.register( "ModifyQueueData", function( roomID, queueData )
{
    // if ( roomID === "everync" )
    // {
    //     console.log( queueData.mediaDuration );
    //     queueData.mediaDuration = queueData.mediaDuration / 1.15;
    //     console.log( queueData.mediaDuration );
    //     return queueData;
    // }
} );

hook.register( "PostPlayQueue", function( roomID, queueData )
{
    if ( !App.config.enableAutoQueue ) return;
    if ( roomID !== "24hournc" && roomID !== "24hourjapan" ) return;

    // console.log( QueueManager.getCount( roomID ) );

    if ( QueueManager.getCount( roomID ) < 5 )
    {
        setTimeout( function( )
        {
            var videoList = QueueManager._randomVideos[ roomID ];
            var length = videoList.length < 5 ? videoList.length : 5;

            var videoURL = videoList[ Math.floor( Math.random( ) * videoList.length ) ];

            var urlParsed = URL.parse( videoURL );

            if ( urlParsed )
            {
                var query = querystring.parse( urlParsed.query );

                if ( query )
                {
                    QueueManager.register( QueueManager.providerType.Youtube, null, roomID, videoURL, query.v, 0, true );
                }
            }
        }, 3000 );
    }
} );

/*
// roomID 버그 잇음
setInterval( function( )
{
    QueueManager.refreshRandomPlayList(
        QueueManager.config.randomPlayList[ Math.floor( Math.random( ) * QueueManager.config.randomPlayList.length ) ],
        function( videoList )
        {
            QueueManager._randomVideos[ roomID ] = videoList;
            var length = videoList.length < 5 ? videoList.length : 5;

            for ( var i = 0; i < length; i++ )
            {
                var videoURL = videoList[ Math.floor( Math.random( ) * videoList.length ) ];

                var urlParsed = URL.parse( videoURL );

                if ( urlParsed )
                {
                    var query = querystring.parse( urlParsed.query );

                    if ( query )
                    {
                        QueueManager.register( QueueManager.providerType.Youtube, null, roomID, videoURL, query.v, 0, true );
                    }
                }
            }
        }
    );

    Logger.write( Logger.LogType.Event, `[Queue] New Playlist refreshed. [${ roomID }]` );
}, 1000 * 60 * 60 );*/

QueueManager.isPlaying = function( roomID )
{
    if ( !Server.ROOM[ roomID ] ) return false;

    return Server.ROOM[ roomID ].currentPlayingQueue != null && !util.isEmpty( Server.ROOM[ roomID ].currentPlayingQueue );
}

hook.register( "PostClientConnected", function( client, socket )
{
    var roomID = client.room;

    QueueManager.sendQueueList( socket, roomID );

    socket.on( "regu.mediaUserVote", function( data )
    {
        if ( !util.isValidSocketData( data,
            {
                type: "number"
            } ) )
        {
            Logger.write( Logger.LogType.Important, `[Queue] Client's queue register request has rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }

        var result = QueueManager.userVote( client, data.type );

        if ( result.success )
        {
            socket.emit( "regu.mediaUserVoteReceive",
            {
                success: true
            } );

            QueueManager.sendUserVoteList( socket, client.room );
        }
        else
        {
            socket.emit( "regu.mediaUserVoteReceive",
            {
                success: false,
                reason: result.reason
            } );
        }
    } );

    socket.on( "regu.mediaRequest", function( data )
    {
        var playingData = QueueManager.getPlayingData( roomID );

        if ( util.isEmpty( playingData ) )
        {
            socket.emit( "RS.mediaPlay",
            {
                empty: true
            } );
        }
        else
        {
            var newData = util.deepCopy( playingData );
            newData.mediaPosition = Server.ROOM[ roomID ].currentPlayingPos;
            // 자막 잇을경우 요청 없을경우 요청 안하기 바꾸기
            // newData.extra = {
            //     caption: result
            // };

            // console.log( playingData );
            // console.log( );
            // console.log( newData );

            socket.emit( "RS.mediaPlay", newData );
        }
    } );

    socket.on( "regu.queueRegister", function( data )
    {
        if ( !util.isValidSocketData( data,
            {
                url: "string",
                start: "number"
            } ) )
        {
            Logger.write( Logger.LogType.Important, `[Queue] Client's queue register request has rejected! -> (#DataIsNotValid) ${ client.information( ) }` );
            return;
        }

        data.url = data.url.trim( );

        var isAllowRegister = QueueManager.isAllowRegister( client, roomID, data );

        if ( isAllowRegister.code !== QueueManager.statusCode.success )
        {
            socket.emit( "regu.queueRegisterReceive", isAllowRegister );

            Logger.write( Logger.LogType.Warning, `[Queue] Queue request rejected. (url:${ data.url }, code:${ isAllowRegister.code }) ${ client.information( ) }` );
            return;
        }

        QueueManager.register( isAllowRegister.type, client, client.room, isAllowRegister.newURL, isAllowRegister.videoID, data.start );
    } );

    socket.on( "queueDataRequest", function( data )
    {
        socket.emit( "regu.queue",
        {
            type: "dataReq"
        } );
    } );
} );

module.exports = QueueManager;