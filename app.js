
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , auth = require('connect-auth')
  , common = require('./lib/common');

var app = express();

var schemas = require('./models')(common.loadConfig('db').path, mongoose);
mongoose.model('User', schemas.User);
mongoose.model('Writing', schemas.Writing);

app.configure(function(){

  app.set('app_info', common.loadConfig('app'));
  app.get('app_info').url_start;

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: app.get('app_info').sess_secret,
    cookie: {maxAge: 86400000 * 200} // 200 days.
  }));

  var auth_config = common.loadConfig('auth');
  app.use(auth({
          strategies : [
              auth.Facebook(auth_config.facebook)
          ],
          trace: true,
          logoutHandler: require('connect-auth/lib/events').redirectOnLogout("/")
      })
  );


  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


var routes      = require('./routes/index')
  , sess_routes = require('./routes/session');

/* Site HTTP Mappings */

// site routes
app.get( '/',                   routes.index);
app.get( '/about',              routes.about);

// writing routes
app.post('/writing',            routes.add_writing);
app.get( '/writing/:id',        routes.get_writing);
app.post('/writing/:id/view',   routes.view_writing);
app.post('/writing/:id/heart',  routes.heart_writing);
app.post('/writing/:id/update', routes.update_writing);
app.get( '/writing/:id.json',   routes.get_writing);
app.get( '/writings',           routes.list_writings);
// user routes
app.get( '/me',                 routes.me);
app.post('/me/pen_name',        routes.save_profile_opts);
app.post('/me/username',        routes.save_profile_opts);
app.post('/me/email',           routes.save_profile_opts);

// session routes
app.get ('/login',         sess_routes.login);
app.get ('/logout',        sess_routes.logout);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
