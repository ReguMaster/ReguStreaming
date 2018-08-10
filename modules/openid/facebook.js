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
const FacebookStrategy = require( "passport-facebook" )
    .Strategy
const apiConfig = require( "../../const/config" )
    .Facebook;

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
        clientID: apiConfig.clientID,
        clientSecret: apiConfig.clientSecret,
        callbackURL: apiConfig.callbackURL
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