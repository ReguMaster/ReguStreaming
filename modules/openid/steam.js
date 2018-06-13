/*
	ReguStreaming
	Copyright 2018. ReguMaster all rights reserved.
*/

'use strict';

const SteamOpenID = { };
const path = require( "path" );
const consoleColor = require( "colors" );
const Main = require( "../../app.js" );

const LogManager = require( "../logmanager.js" );
require('passport-openid')
// const passport = require( "passport" );

const express = require('express');
const app = require('express')();
const router = express.Router();
const passport = require( "passport" );
const SteamStrategy = require( "passport-steam" ).Strategy

SteamOpenID.apiKey = "6FD21C3629A18581B780F424C782DDE6";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).


passport.use(new SteamStrategy({
    returnURL: 'http://1.224.53.166:8085/auth/steam/return',
    realm: 'http://1.224.53.166:8085/',
    apiKey: SteamOpenID.apiKey
  },
  function(identifier, profile, done) {
    process.nextTick(function () {

      // To keep the example simple, the user's Steam profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Steam account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

// app.use(session({
    // secret: 'your secret',
    // name: 'name of session id',
    // resave: true,
    // saveUninitialized: true}));



//C1012341B7D95C090FA5437E63901C97

SteamOpenID.test = 110;


SteamOpenID.register = function( )
{
	
}

module.exports = SteamOpenID;