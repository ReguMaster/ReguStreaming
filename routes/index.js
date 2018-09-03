/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

const apiConfig = require( "../const/config" );
const express = require( "express" );
const path = require( "path" );
// const fileStream = require( "fs" );
const router = express.Router( );
const passport = require( "passport" );
const BanManager = require( "../modules/ban" );
const Database = require( "../modules/db" );
const Logger = require( "../modules/logger" );
const util = require( "../util" );
const uniqid = require( "uniqid" );
const QueueManager = require( "../modules/queue" );
const ServiceManager = require( "../modules/service" );
const hook = require( "../hook" );
// const superagent = require( "superagent" );
const Server = require( "../server" );
// const cheerio = require( "cheerio" );
// const cookie = require( "cookie" );
const recaptcha = new( require( "recaptcha2" ) )(
{
    siteKey: apiConfig.Recaptcha.siteKey,
    secretKey: apiConfig.Recaptcha.secretKey
} );

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

    // *NOTE: 세션 올바르지 않을 시 오류 발생 (ex: redis 접속 실패시)
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

        if ( util.isEmpty( playingData ) )
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

        if ( util.isEmpty( playingData ) )
        {
            res.status( 204 )
                .send( "" );

            return;
        }

        res.redirect( 302, playingData.mediaContentURL );
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

router.get( "/login", function( req, res )
{
    if ( !req.isAuthenticated( ) )
    {
        res.render( "login" );

        return;
    }

    res.redirect( "/" );
} );

router.get( "/logout", function( req, res )
{
    if ( req.isAuthenticated( ) )
    {
        Logger.write( Logger.type.Info, `[Router] Account logout. ${ util.inspect( req.user, false, 4 ) }` );

        var client = Server.getClientBySessionID( req.sessionID );

        if ( client )
            client.disconnect( );

        req.session.destroy( );
        req.logOut( );
    }

    res.redirect( "/" );
} );

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

        Database.queryWithEscape( `SELECT _file, _type from userfile WHERE _id = ?`, [ req.params.id ], function( status, result )
        {
            if ( status === "success" )
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

router.post( "/login/guest", function( req, res )
{
    if ( req.isAuthenticated( ) )
    {
        res.redirect( "/" );
        return;
    }

    if ( !req.session )
    {
        res.redirect( "/?error=500" );
        return;
    }

    if ( !req.body.key )
    {
        res.status( 403 )
            .render( "error",
            {
                code: 403
            } );

        return;
    }

    var ipAddress = req.ip;
    var onSuccess = function( data )
    {
        req.session.passport = {};
        req.session.passport.user = {
            id: data._tag,
            displayName: data._name + "#" + data._tag.substring( 0, 8 ),
            avatar: "/images/avatar/guest_64.png",
            avatarFull: "/images/avatar/guest_184.png",
            provider: "guest"
        }

        res.send( "success" );
    };

    var onError = function( err )
    {
        res.send( "code=500" );
    };

    recaptcha.validate( req.body.key )
        .then( function( )
        {
            var isAllowedAccount = hook.run( "CanLoginAccount", ipAddress, null );

            if ( isAllowedAccount && isAllowedAccount.isBanned )
            {
                res.redirect( "/?banned&id=" + isAllowedAccount.id );
                return;
            }

            Logger.write( Logger.type.Info, `[Router] Login with guest ... ${ ipAddress }` );

            // 코드 좀 바꾸기 (Promise 패턴)
            Database.executeProcedure( "FIND_USER_BY_IPADDRESS", [ ipAddress ], function( status, data )
            {
                if ( status === "success" && data.length === 1 ) // 1이 아니면 뭔가 문제가 생긴것. (다중 값은 존재할 수 없음 '현재로서는')
                    onSuccess( data[ 0 ] );
                else if ( data.length >= 2 )
                {
                    Logger.write( Logger.type.Important, `[Router] WARNING : User account duplicated! this is not good!!! ${ ipAddress }` );
                    onError( );
                }
                else
                {
                    Database.executeProcedure( "REGISTER_GUEST", [ "guest", "Guest", uniqid( ), ipAddress ], function( status2, data2 )
                    {
                        if ( status2 === "success" && data2.affectedRows === 1 )
                        {
                            Database.executeProcedure( "FIND_USER_BY_IPADDRESS", [ ipAddress ], function( status3, data3 )
                            {
                                if ( status3 === "success" && data3.length === 1 ) // 1이 아니면 뭔가 문제가 생긴것. (다중 값은 존재할 수 없음 '현재로서는')
                                    onSuccess( data3[ 0 ] );
                                else
                                    onError( );
                            }, onError );
                        }
                        else
                        {
                            Logger.write( Logger.type.Important, `[Router] WARNING : Insert execute failed. ITS IGNORED ${ ipAddress }` );
                            onError( );
                        }
                    }, onError );
                }
            }, onError );
        } )
        .catch( function( err )
        {
            Logger.write( Logger.type.Error, `[Router] Failed to login with GUEST: recaptcha error (err:${ recaptcha.translateErrors( err ) }) ${ ipAddress }` );

            onError( );
        } );
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

    res.redirect( "/login/kakao/return" );
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
                Logger.write( Logger.type.Error, `[Router] Failed to login! -> ${ err.stack }` );
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
                Logger.write( Logger.type.Error, `[Router] Failed to login! -> ${ err.stack }` );
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
                Logger.write( Logger.type.Error, `[Router] Failed to login! -> ${ err.stack }` );
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
                Logger.write( Logger.type.Error, `[Router] Failed to login! -> ${ err.stack }` );
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
                Logger.write( Logger.type.Error, `[Router] Failed to login! -> ${ err.stack }` );
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