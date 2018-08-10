/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const express = require( "express" );
const path = require( "path" );
const fileStream = require( "fs" );
const router = express.Router( );
const passport = require( "passport" );
const BanManager = require( "../modules/ban" );
const Database = require( "../modules/db" );
const Logger = require( "../modules/logger" );
const util = require( "util" );
const uniqid = require( "uniqid" );
// const ClientManager = require( "../client" );
const QueueManager = require( "../modules/queue" );
// const RoomManager = require( "../modules/room" );
const ServiceManager = require( "../modules/service" );
const hook = require( "../hook" );
const reguUtil = require( "../util" );
const superagent = require( "superagent" );
const Server = require( "../server" );

// http://expressjs.com/ko/advanced/best-practice-performance.html#restart
router.get( "/", function( req, res )
{
    if ( req.query.room && req.query.room !== "" )
    {
        if ( req.isAuthenticated( ) )
        {
            res.setHeader( "Cache-Control", "no-cache, no-store" );
            req.session.roomID = req.query.room;

            Server.joinRoom( req.session.roomID, req, res, req.ip );
        }
        else
            res.redirect( "/?loginRequired" );

        return;
    }

    if ( !!!req.session.discordRecommend )
        req.session.discordRecommend = 1;

    res.render( "main",
    {
        discordRecommend: req.session.discordRecommend
    } );
} );

router.post( "/api/discordRecommend", function( req, res )
{
    req.session.discordRecommend = 2;
    res.status( 200 )
        .send( "Success" );
} );

router.get( "/extra/:room", function( req, res )
{
    if ( !req.isAuthenticated( ) )
    {
        res.status( 403 )
            .render( "error",
            {
                code: 403
            } );

        return;
    }

    if ( req.params.room )
    {
        var playingData = QueueManager.getPlayingData( req.params.room );

        if ( reguUtil.isEmpty( playingData ) )
        {
            res.send( "{}" );

            return;
        }

        if ( playingData.extra && playingData.extra.caption )
            res.send( JSON.stringify( playingData.extra.caption ) );
        else
            res.send( "{}" );
    }
    else
        res.status( 403 )
        .render( "error",
        {
            code: 403
        } );
} );

router.get( "/media/:room", function( req, res )
{
    if ( !req.isAuthenticated( ) )
    {
        res.status( 403 )
            .render( "error",
            {
                code: 403
            } );

        return;
    }

    if ( req.params.room )
    {
        var playingData = QueueManager.getPlayingData( req.params.room );

        if ( reguUtil.isEmpty( playingData ) )
        {
            res.status( 204 )
                .send( "" );

            return;
        }

        // var videoLengthSize = ( ( 128 / 8 ) * playingData.videoLength ) * 1000;
        // res.writeHead( 200,
        // {
        //     'Set-Cookie': 'fileDownload=true; path=/',
        //     'Content-Type': 'video/mp4',
        //     'Content-disposition': 'attachment; filename*=UTF-8\'\'' + fixedEncodeURI( playingData.videoDirectURL ),
        //     'Content-Length': videoLengthSize
        // } );
        // res.pipe( );

        // res.status( 200 );
        // res.setHeader( "Content-Type", "video/mp4" );
        // res.setHeader( "Location", playingData.mediaContentURL );

        // res.location( playingData.mediaContentURL );
        res.redirect( playingData.mediaContentURL );


        //         var movieStream = fs.createReadStream("./test.mp4");
        // movieStream.on('open', function () {
        //     res.writeHead(206, {
        //         "Content-Range": "bytes " + start + "-" + end + "/" + total,
        //             "Accept-Ranges": "bytes",
        //             "Content-Length": chunksize,
        //             "Content-Type": "video/mp4"
        //     });
        //     // This just pipes the read stream to the response object (which goes 
        //     //to the client)
        //     movieStream.pipe(res);
        // });

        // fileStream.createReadStream( "./test.mp4" )
        //     .pipe( res );

        // res.status( 200 );
        // res.setHeader( "Content-Type", "video/mp4" );

        // var request = superagent.get( playingData.mediaContentURL )
        //     .on( "response", function( res2 ) {

        //     } );

        // request.pipe( res );
    }
    else
        res.status( 403 )
        .render( "error",
        {
            code: 403
        } );
} );

router.get( "/background", function( req, res )
{
    if ( ServiceManager.background )
        res.sendFile( ServiceManager.background );
} );

router.get( "/api/serviceStatus", function( req, res )
{
    res.send( JSON.stringify( ServiceManager.getClientAjaxData( ) ) );
} );

router.get( "/api/main", function( req, res )
{
    res.send( JSON.stringify(
    {
        isAuthenticated: req.isAuthenticated( ),
        id: req.user ? ( req.user.id || "null" ) : "null",
        name: req.user ? ( req.user.displayName || "null" ) : "null",
        avatar: req.user ? ( req.user.avatar || "null" ) : "null",
        provider: req.user ? ( req.user.provider || "guest" ) : "guest",
        room: Server.getRoomDataForClient( )
    } ) );
} );

router.get( "/api/room", function( req, res )
{
    res.send( JSON.stringify( Server.getRoomDataForClient( ) ) );
} );

router.get( "/ban", function( req, res )
{
    res.redirect( "/" );
} );

router.get( "/ban/:id", function( req, res )
{
    if ( req.params.id )
    {
        var banInformation = BanManager.getDataByID( req.params.id );

        if ( banInformation && banInformation.isBanned )
        {
            res.redirect( "/?banInfo=" + banInformation.reason );
            // res.render( "baninfo",
            // {
            //     reason: banInformation.reason || "서비스 약관 위반"
            // } );
        }
        else
            res.redirect( "/?banDataError" );
    }
    else
        res.redirect( "/?banDataError" );
} );

// router.get( "/api/loginInfo", ensureAuthenticated, function( req, res )
// {
//     if ( req.query.apiKey && req.query.apiKey === "test" )
//     {
//         res.send( `success<br /><img src='${ req.user.avatarFull }' alt='Your Avatar Image' /><br />
//         ID: ${ req.user.id }<br />
//         Name: ${ req.user.displayName }<br />` );
//     }
//     else
//         res.status( 403 )
//         .render( "error",
//         {
//             code: 403
//         } );
// } );

router.get( "/login", function( req, res )
{
    if ( !req.isAuthenticated( ) )
    {
        res.render( "login" );

        return;
    }

    res.redirect( "/" );
} );

router.get( "/test", function( req, res )
{
    res.render( "test" );
} );

router.get( "/logout", function( req, res )
{
    if ( req.isAuthenticated( ) )
    {
        Logger.write( Logger.LogType.Info, `[Router] Account logout. ${ util.inspect( req.user, false, 4 ) }` );

        var client = Server.getClientBySessionID( req.sessionID );

        if ( client )
            client.disconnect( );

        req.session.destroy( );
        req.logOut( );
    }

    res.redirect( "/" );
} );

function ensureAuthenticated( req, res, next )
{
    if ( req.isAuthenticated( ) )
        return next( );

    res.redirect( "/?loginRequire" );
}

// router.get( '/account', ensureAuthenticated, function( req, res )
// {
//     console.log( req.session );

//     // console.log( req.user );
//     res.send( `<p><img src='${req.user.photos[2].value}>' alt='Your Avatar Image' /></p>
// <p>ID: ${req.user.id}></p>
// <p>Name: ${req.user.displayName}></p>` );
// } );

router.get( "/admin", function( req, res )
{
    if ( req.isAuthenticated( ) && req.user.provider === "steam" && req.user.id === "76561198011675377" )
    {
        res.cookie( "permission", "1" );
        res.render( "admin" );

        return;
    }

    res.redirect( "/?permissionError" );
} );

router.get( "/files/:id", function( req, res )
{
    if ( req.params.id )
    {
        if ( !req.isAuthenticated( ) )
        {
            res.status( 403 )
                .render( "error",
                {
                    code: 403
                } );
            return;
        }

        Database.queryWithEscape( `SELECT _file, _type from userfile WHERE _id = ?`, [ req.params.id ], function( result )
        {
            if ( result && result.length === 1 )
            {
                result = result[ 0 ];

                res.type( "image/" + result._type )
                    .sendFile( path.join( __dirname, "/../", "userfiles", result._file + "." + result._type ) );
            }
            else
            {
                res.status( 404 )
                    .render( "error",
                    {
                        code: 404
                    } );
            }
        }, function( err )
        {
            res.status( 404 )
                .render( "error",
                {
                    code: 404
                } );
        } );
    }
    else
    {
        res.status( 404 )
            .render( "error",
            {
                code: 404
            } );
    }
} );

router.get( "/login/guest", function( req, res )
{
    if ( req.isAuthenticated( ) )
    {
        res.redirect( "/" );
        return;
    }

    if ( req.session )
    {
        var ipAddress = req.headers[ "x-forwarded-for" ] || req.connection.remoteAddress;

        if ( ipAddress )
        {
            if ( ipAddress.substr( 0, 7 ) == "::ffff:" )
                ipAddress = ipAddress.substr( 7 )

            var isAllowedAccount = hook.run( "CanLoginAccount", ipAddress, null );

            if ( isAllowedAccount && isAllowedAccount.isBanned )
            {
                res.redirect( "/?banned&id=" + isAllowedAccount.id );
                return;
            }

            Logger.write( Logger.LogType.Info, `[Router] Login with guest ... ${ ipAddress }` );

            var onError = function( err )
            {
                res.redirect( "/?error=500" );
            }

            // 코드 좀 바꾸기 (Promise 패턴)
            Database.executeProcedure( "FIND_USER_BY_IPADDRESS", [ ipAddress ], function( result )
            {
                if ( result.length === 1 ) // 1이 아니면 뭔가 문제가 생긴것. (다중 값은 존재할 수 없음 '현재로서는')
                {
                    req.session.passport = {};
                    req.session.passport.user = {
                        id: result[ 0 ]._tag,
                        displayName: result[ 0 ]._name + "#" + result[ 0 ]._tag.substring( 0, 8 ),
                        avatar: "/images/avatar/guest_64.png",
                        avatarFull: "/images/avatar/guest_184.png",
                        provider: "guest"
                    }

                    res.redirect( "/" );
                }
                else if ( result.length >= 2 )
                {
                    Logger.write( Logger.LogType.Important, `[Router] WARNING : User account duplicated! this is not good!!! ${ ipAddress }` );
                    onError( );
                }
                else
                {
                    // 여기부터 해야함
                    Database.executeProcedure( "REGISTER_GUEST", [ "guest", "Guest", uniqid( ), ipAddress ], function( result2 )
                    {
                        if ( result2.affectedRows === 1 )
                        {
                            Database.executeProcedure( "FIND_USER_BY_IPADDRESS", [ ipAddress ], function( result3 )
                            {
                                if ( result3.length === 1 ) // 1이 아니면 뭔가 문제가 생긴것. (다중 값은 존재할 수 없음 '현재로서는')
                                {
                                    req.session.passport = {};
                                    req.session.passport.user = {
                                        id: result3[ 0 ]._tag,
                                        displayName: result3[ 0 ]._name + "#" + result3[ 0 ]._tag.substring( 0, 8 ),
                                        avatar: "/images/avatar/guest_64.png",
                                        avatarFull: "/images/avatar/guest_184.png",
                                        provider: "guest"
                                    }

                                    res.redirect( "/" );
                                }
                                else
                                    onError( );
                            }, onError );
                        }
                        else
                        {
                            Logger.write( Logger.LogType.Important, `[Router] WARNING : Insert execute failed. ITS IGNORED ${ ipAddress }` );
                            onError( );
                        }
                    }, onError );
                }
            }, onError );
        }
        else
        {
            res.redirect( "/?error=500" );
        }

        // res.redirect( "/" );
    }
    else
    {
        res.redirect( "/?error=500" );
    }
} );

router.get( "/login/steam", function( req, res )
{
    if ( !ServiceManager.isLoginAllowed( "steam" ) )
    {
        res.redirect( "/?loginNotAllowed" );
        return;
    }

    res.redirect( "/login/steam/return" );
} );

router.get( "/login/naver", function( req, res )
{
    if ( !ServiceManager.isLoginAllowed( "naver" ) )
    {
        res.redirect( "/?loginNotAllowed" );
        return;
    }

    res.redirect( "/login/naver/return" );
} );

router.get( "/login/kakao", function( req, res )
{
    if ( !ServiceManager.isLoginAllowed( "kakao" ) )
    {
        res.redirect( "/?loginNotAllowed" );
        return;
    }

    // res.redirect( "/login/kakao/return" );

    res.redirect( "/" );
} );

// router.get( "/login/facebook", passport.authenticate( "facebook",
// {
//     failureRedirect: "/?error=loginFailed"
// } ), function( req, res )
// {
//     res.redirect( "/" );
// } );

router.get( "/login/google", function( req, res )
{
    if ( !ServiceManager.isLoginAllowed( "google" ) )
    {
        res.redirect( "/?loginNotAllowed" );
        return;
    }

    res.redirect( "/login/google/return" );
} );

router.get( "/login/twitter", function( req, res )
{
    if ( !ServiceManager.isLoginAllowed( "twitter" ) )
    {
        res.redirect( "/?loginNotAllowed" );
        return;
    }

    res.redirect( "/login/twitter/return" );
} );

router.get( "/login/naver/return",
    function( req, res, next )
    {
        if ( !ServiceManager.isLoginAllowed( "naver" ) )
        {
            res.redirect( "/?loginNotAllowed" );
            return;
        }

        passport.authenticate( "naver", function( err, user, info )
        {
            if ( err )
            {
                Logger.write( Logger.LogType.Error, `[Router] Failed to login! -> ${ err.stack }` );
                return res.redirect( "/?loginFailedService" );
            }

            if ( !user )
            {
                return res.redirect( "/?banned&id=" + info.id );
            }

            req.login( user, function( err )
            {
                if ( err )
                    return next( err );

                res.redirect( "/" );
            } );
        } )( req, res, next );
    } );

router.get( "/login/kakao/return",
    function( req, res, next )
    {
        if ( !ServiceManager.isLoginAllowed( "kakao" ) )
        {
            res.redirect( "/?loginNotAllowed" );
            return;
        }

        passport.authenticate( "kakao", function( err, user, info )
        {
            if ( err )
            {
                Logger.write( Logger.LogType.Error, `[Router] Failed to login! -> ${ err.stack }` );
                return res.redirect( "/?loginFailedService" );
            }

            if ( !user )
            {
                return res.redirect( "/?banned&id=" + info.id );
            }

            req.login( user, function( err )
            {
                if ( err )
                    return next( err );

                res.redirect( "/" );
            } );
        } )( req, res, next );
    } );

router.get( "/login/steam/return",
    function( req, res, next )
    {
        if ( !ServiceManager.isLoginAllowed( "steam" ) )
        {
            res.redirect( "/?loginNotAllowed" );
            return;
        }

        passport.authenticate( "steam", function( err, user, info )
        {
            if ( err )
            {
                Logger.write( Logger.LogType.Error, `[Router] Failed to login! -> ${ err.stack }` );
                return res.redirect( "/?loginFailedService" );
            }

            if ( !user )
            {
                return res.redirect( "/?banned&id=" + info.id );
            }

            req.login( user, function( err )
            {
                if ( err )
                    return next( err );

                res.redirect( "/" );
            } );
        } )( req, res, next );
    } );

// router.get( "/login/facebook/return",
//     // Issue #37 - Workaround for Express router module stripping the full url, causing assertion to fail 
//     function( req, res, next )
//     {
//         req.url = req.originalUrl;
//         next( );
//     },
//     passport.authenticate( "facebook",
//     {
//         failureRedirect: "/?error=loginFailed"
//     } ),
//     function( req, res )
//     {
//         res.redirect( "/" );
//     } );

router.get( "/login/google/return",
    function( req, res, next )
    {
        if ( !ServiceManager.isLoginAllowed( "google" ) )
        {
            res.redirect( "/?loginNotAllowed" );
            return;
        }

        passport.authenticate( "google",
        {
            scope: [ "profile" ],
            prompt: "select_account" // https://github.com/jaredhanson/passport-google-oauth2/issues/18
        }, function( err, user, info )
        {
            if ( err )
            {
                Logger.write( Logger.LogType.Error, `[Router] Failed to login! -> ${ err.stack }` );
                return res.redirect( "/?loginFailedService" );
            }

            if ( !user )
            {
                return res.redirect( "/?banned&id=" + info.id );
            }

            req.login( user, function( err )
            {
                if ( err )
                    return next( err );

                res.redirect( "/" );
            } );
        } )( req, res, next );
    } );

router.get( "/login/twitter/return",
    function( req, res, next )
    {
        if ( !ServiceManager.isLoginAllowed( "twitter" ) )
        {
            res.redirect( "/?loginNotAllowed" );
            return;
        }

        passport.authenticate( "twitter", function( err, user, info )
        {
            if ( err )
            {
                Logger.write( Logger.LogType.Error, `[Router] Failed to login! -> ${ err.stack }` );
                return res.redirect( "/?loginFailedService" );
            }

            if ( !user )
            {
                return res.redirect( "/?banned&id=" + info.id );
            }

            req.login( user, function( err )
            {
                if ( err )
                    return next( err );

                res.redirect( "/" );
            } );
        } )( req, res, next );
    } );

require( "../modules/openid/steam" );
require( "../modules/openid/naver" );
require( "../modules/openid/kakao" );
require( "../modules/openid/facebook" );
require( "../modules/openid/google" );
require( "../modules/openid/twitter" );

module.exports = router;