/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/


'use strict';

const Logger = require( "../logger" );
require( "passport-openid" );

const util = require( "util" );
const passport = require( "passport" );
const FacebookStrategy = require( "passport-facebook" )
    .Strategy

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

passport.use( new FacebookStrategy(
    {
        clientID: "259393978199882",
        clientSecret: "3f677b06d9db0c6b044961d85c644f7e",
        callbackURL: "https://regustreaming.oa.to/login/facebook/return"
    },
    function( accessToken, refreshToken, profile, done )
    {
        process.nextTick( function( )
        {
            Logger.write( Logger.LogType.Info, `[Router] Login with FACEBOOK ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.profile_image;
            profile.avatarFull = profile._json.profile_image;

            return done( null, profile );
        } );
    }
) );