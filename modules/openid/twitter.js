/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/


'use strict';

const Logger = require( "../logger" );
require( "passport-openid" );

const util = require( "util" );
const hook = require( "../../hook" );
const passport = require( "passport" );
const TwitterStrategy = require( "passport-twitter" )
    .Strategy
const apiConfig = require( "../../const/config" )
    .Twitter;

passport.serializeUser( function( user, done )
{
    done( null, user );
} );

passport.deserializeUser( function( obj, done )
{
    done( null, obj );
} );

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).

passport.use( new TwitterStrategy(
    {
        consumerKey: apiConfig.consumerKey,
        consumerSecret: apiConfig.consumerSecret,
        callbackURL: apiConfig.callbackURL
    },
    function( accessToken, refreshToken, profile, done )
    {
        // var isAllowedAccount = hook.run( "CanLoginAccount", profile.id, profile );

        // if ( isAllowedAccount && isAllowedAccount.isBanned )
        // {
        //     return done( null, false,
        //     {
        //         id: isAllowedAccount.id
        //     } );
        // }

        process.nextTick( function( )
        {
            Logger.write( Logger.LogType.Info, `[Router] Login with TWITTER ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.profile_image_url_https;
            profile.avatarFull = profile.avatar.replace( "_normal.jpg", "_400x400.jpg" );

            return done( null, profile );
        } );
    }
) );