var express = require('express');
var path = require('path');
var session   = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(session({secret: 'Emrjdnsrkawk2ro',saveUninitialized: true,resave: true}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

var sess;

//Description : 세션이 유효한지 검사
//Author : Hyunyi Kim
app.post('/verify',function(req,res){
  sess = req.session;
  if(sess.userId){
    res.end(JSON.stringify({'result':'done','id':sess.userId}));
  } else {
    res.end(JSON.stringify({'result':'error'}));
  }
});

//Description : 로그인시, 세션에 사용자 정보 저장
//Author : Hyunyi Kim
app.post('/login',function(req,res){
  sess=req.session;
  sess.userId=req.body.userId;
  res.end(JSON.stringify({'result':'done','id':sess.userId}));
});


//Description : 로그아웃시, 세션이 사라짐
//Author : Hyunyi Kim
app.get('/logout',function(req,res){
  req.session.destroy(function(err){
    if(err){
      console.log(err);
    }else{
      res.end('logout');
    }
  })
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

//development error handler
//will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//production error handler
//no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
