
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  //app.use(express.session({secret: 'aw4tji4#TALKASDnaergawreILRAEIJAalwker'}));
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/* Site Mappings */
app.get( '/',                   routes.index);
app.get( '/about',              routes.about);
app.post('/writing',            routes.add_writing);
app.get( '/writing/:id',        routes.get_writing);
app.post('/writing/:id/view',   routes.view_writing);
app.post('/writing/:id/heart',  routes.heart_writing);
app.post('/writing/:id/update', routes.update_writing);
app.get( '/writing/:id.json',   routes.get_writing);
app.get( '/writings',           routes.list_writings);
app.get( '/me',                 routes.me);
app.post('/me/pen_name',        routes.save_profile_opts);
app.post('/me/username',        routes.save_profile_opts);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
