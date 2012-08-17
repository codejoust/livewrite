utils  = require('./utils.js');
var _ = require('underscore');
var common = require('../lib/common');

var mongoose = require('mongoose'),
 models = {
    User: mongoose.model('User'),
    Writing: mongoose.model('Writing')
  };

exports.logout = function(req, res){
    req.logout();
};

exports.login = function(req, res){

  function finish_create(user, fb_info){
    user.has_login = true;
    user.remote_id = fb_info['id'];
    if (fb_info['email']){ user.email = fb_info['email']; }
    if (fb_info['name'] ){ user.realname = fb_info['name']; }
    if (req.session["access_token"]){ user.remote_token = req.session["access_token"]; }
    if (fb_info['email']){ user.email = fb_info['email']; }
    user.save(function(err, doc){
      if (!err){
        if (!req.query.back_path){ req.query.back_path = '/me'; }
        res.redirect(common.loadConfig('app').url_start + req.query.back_path);
      } else {
        res.send('error logging in ')
      }
    });
  }

    req.authenticate(['facebook'], function(error, authenticated){
        console.log(arguments);
        if( error ) {
            // Something has gone awry, behave as you wish.
            console.log(error);
            res.send('error logging in ')
        }
        else {
            if (authenticated === undefined) {
                // The authentication strategy requires some more browser interaction, suggest you do nothing here!
            }
            else {
                console.log(arguments);
                // We've either failed to authenticate, or succeeded (req.isAuthenticated() will confirm, as will the value of the received argument)
                //next();

                if (req.isAuthenticated()){
                  var fb_info = req.session.auth.user;
                  utils.fetch_user(req, true, function(err, user){
                    if (err || !user){ res.send('Err! '+err + ' u:' +JSON.stringify(user)); return false; }
                    models.User.findOne({'remote_id': fb_info['id']}, function(err, old_user){
                      if (old_user && user._id != user._id){
                        models.Writing.find({author: user._id}, '_id id', function(err, docs){
                          if (err){ console.error('BIG ERROR!!! CANNOT MOVE WRITINGS.'); res.send('err finding writings'); return; }
                          models.Writing.update({author: user._id}, {author: old_user._id}, function(err, update_prog){
                            if (err){ console.error('BIG ERROR!!! CANNOT MOVE WRITINGS.'); res.send('err updating writings'); return; }
                            old_user.hearts   = _.union(old_user.hearts, user.hearts); 
                            old_user.writings = _.pluck(docs, '_id');
                            user.remove(function(err, doc){
                              req.session['user_id'] = 'uid:' + old_user._id;
                              if (err){ res.send('ERR!' + err); return; }
                              old_user.save(function(err,resp){
                                if (err){ res.send('cannot create new user'); console.error(['cannot create new user for switchover', old_user, user]); return; }
                                finish_create(resp, fb_info);
                              })
                            })
                          })   
                        });
                      } else {
                        finish_create(user, fb_info);
                      }
                    });
                  })
                } else {
                  res.redirect('/');
                }
            }
        }});
};