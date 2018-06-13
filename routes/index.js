const express = require('express');
const path = require('path');
const router = express.Router();
const passport = require( "passport" );
// const multer = require( "multer" );
const Main = require( "../app.js" );

/*
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'userUploaded/')
  },
  filename: function (req, file, cb) {
	  cb(null, file.fieldname + '-' + Date.now( ) + '.' + file.mimetype.split('/')[1] )
  }
})

var upload = multer( {
	storage: storage,
	// dest: "userUploaded/",
	fileFilter: fileFilter
} )

function fileFilter( req, file, cb )
{
  // 이 함수는 boolean 값과 함께 `cb`를 호출함으로써 해당 파일을 업로드 할지 여부를 나타낼 수 있습니다.
  // 이 파일을 거부하려면 다음과 같이 `false` 를 전달합니다:
  //cb(null, false)
  
	var allowType = [
		"image/png",
		"image/gif",
		"image/jpg",
		"image/jpeg"
	];
	
	console.log(file);
	
	if ( allowType.indexOf( file.mimetype ) > -1 )
	{
		cb( null, true );
	}
	else
	{
		cb( null, false );
	}

  
  // 이 파일을 허용하려면 다음과 같이 `true` 를 전달합니다:
  

  // 무언가 문제가 생겼다면 언제나 에러를 전달할 수 있습니다:
  //cb(new Error('I don\'t have a clue!'))

}*/

router.get( "/api", (req, res) => {
	res.send( "Under construction;" );
});

router.get( "/", (req, res) => {
	res.sendFile( path.join(__dirname, '/../', 'views','index.html') );
});

router.get( "/streaming", (req, res) => {
	res.sendFile( path.join(__dirname, '/../', 'views','index.html') );
});

/*
router.post('/upload', upload.single('photoFile'), function (req, res, next) {
	console.log("success");
	
	Main.io.emit( "chatReceive", {
		// name: client.name,
		name: client.name + "#" + client.userID,
		chatMessage: chatMessage
	} );
  // req.file 은 `avatar` 라는 필드의 파일 정보입니다.
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})*/

// router.post( "/upload:filename", (req, res) => {
	// console.log(req)
	// console.log(res);
// });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

router.get( "/test", (req, res) => {
	res.sendFile( path.join(__dirname, '/../', 'views','test.html') );
});

router.get('/account', ensureAuthenticated, function(req, res){
console.log(req.user);
  res.send( `<p><img src='${req.user.photos[2].value}>' alt='Your Avatar Image' /></p>
<p>ID: ${req.user.id}></p>
<p>Name: ${req.user.displayName}></p>` );
});

router.get( "/auth/steam", passport.authenticate( "steam", { failureRedirect: "/" } ), (req, res) => {
	res.redirect('/');
});

router.get('/auth/steam/return',
  // Issue #37 - Workaround for Express router module stripping the full url, causing assertion to fail 
  function(req, res, next) {
      req.url = req.originalUrl;
      next();
  }, 
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

require( "../modules/openid/steam.js" );

module.exports = router;

