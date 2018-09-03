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
const GoogleStrategy = require( "passport-google-oauth20" )
    .Strategy
const apiConfig = require( "../../const/config" )
    .Google;

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

passport.use( new GoogleStrategy(
    {
        clientID: apiConfig.clientID,
        clientSecret: apiConfig.clientSecret,
        callbackURL: apiConfig.callbackURL
    },
    function( accessToken, refreshToken, profile, done )
    {
        process.nextTick( function( )
        {
            Logger.write( Logger.type.Info, `[Router] Login with GOOGLE ... ${ util.inspect( profile, false, 3 ) }` );

            profile.avatar = profile._json.image.url;
            profile.avatarFull = profile.avatar.replace( "?sz=50", "?sz=180" );

            return done( null, profile );
        } );
    }
) );