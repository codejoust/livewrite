
var common = require('../lib/common')
var _ = require('underscore');
var async = require('async');
var utils = require('./utils');
var controller = {};


var mongoose = require('mongoose'),
 models = {
    User: mongoose.model('User'),
    Writing: mongoose.model('Writing')
  };



controller.index = function(req, res){
  res.render('index');
};

controller.heart_writing = function(req, res, next){
  var cb_join = new utils.ProcJoin();
  var action = 'unknown';
  utils.fetch_user(req, true, function(err, user){
    if (err){ next(err); return; }
    models.Writing.findById(req.params.id, function(err, writing){
      if (err){ next(err); return; }
      if (user.hearts.indexOf(writing._id) != -1){
        user.update({"$pull": {hearts: writing._id}}, {}, cb_join.add_fn('rm_hearts'));
        writing.update({"$inc": {hearts: -1}}, {}, cb_join.add_fn('dinc_hearts'));
        action = 'unhearted';
      } else {
        user.update({"$addToSet": {hearts: writing._id}}, {}, cb_join.add_fn('add_heart'));
        writing.update({"$inc": {hearts: 1}}, {}, cb_join.add_fn('inc_hearts'));
        action = 'hearted';
      }
      cb_join.join(function(err, data){
        if (err){ next(err); return; }
        res.send({err: false, updated: true, action: action});
      })
    })
  });
}

controller.add_writing = function(req, res){
  utils.fetch_user(req, true, function(err, user){
    if (user && !err){
     utils.create_writing(req, res, user);
    } else {
      res.send({err: err, err_at: 'User Create'})
    }
  });
};

controller.about = function(req, res, next){
  res.render('about');
}

controller.me = function(req, res){
  utils.fetch_user(req, false, function(err, user){
    if (!user){
      res.render('you', {user: null, writings: null, found:false});
      return;
    }
    models.Writing.find({'_id': {$in: _.union(user.hearts, user.writings)}}, function(err, writings){
      if (err){ next(err); return; }
      var hearts = [], authored = [];
      writings.forEach(function(writing){
        if (user.writings.indexOf(writing._id) != -1){
          authored.push(writing);
        }
        if (user.hearts.indexOf(writing._id) != -1){
          hearts.push(writing);
        }
      });
      res.render('you', {user: user, writings: authored, hearts: hearts, found: true})
    })
  });
}

controller.save_profile_opts = function(req, res, next){
  utils.fetch_user(req, false, function(err, user){
    if (!user){ next(err || "Can't find user"); return; }
    if (req.body['data']){
      if (req.path.indexOf('username') != -1){
        user.username = req.body['data'];
      } else if (req.path.indexOf('pen_name') != -1) {
        user.pen_name = req.body['data'];
      } else if (req.path.indexOf('email') != -1) {
        //user.email = req.body['data'].toLowerCase();
        if (req.isAuthenticated()){
          if (req.session.auth.user && req.session.auth.user.email){
            user.email = req.session.auth.user.email;
          }
        }
      } else {
        next("Improper URL")
      }
    } else {
      next("No data with update");
    }
    user.save(function(err, resp){
      if (err){ next(err || 'Unable to update [db error].'); return; }
      res.send({err: false, success: true});
    });
  })
}

controller.view_writing = function(req, res){
  models.Writing.findOneAndUpdate({_id: req.params.id}, {'$inc': {views: 1}}, function(err, doc){
    if (err || !doc){
      res.send({err: err, writing: null});
    } else {
      res.send({err: false, writing: doc, updated: true})
    }
  });
}

controller.get_writing = function(req, res){
  utils.fetch_user(req, false, function(err, user){
    models.Writing.findById(req.params.id, function(err, doc){
      if (!err){
        if (!req.path.indexOf('.json')){
          delete doc.created_ip;
          res.send(doc);
        } else {
          res.render('writing', {writing: doc, user: user});
        }
      } else {
        res.send('404');
      }
    });
  });
};

controller.update_writing = function(req, res){
  utils.fetch_user(req, false, function(err, user){
    if (err || !user){ next(err); return; }
    models.Writing.findById(req.params.id, function(err, writing){
      if (err || !writing){ next(err); return; }
      if (req.body['make_public']){
        writing.is_public = true;
        writing.pen_name = user.pen_name;
        if (req.body['pen_name'] && req.body['pen_name'].length > 0){
          writing.pen_name = req.body['pen_name'];
          user.update({$set: {'pen_name': req.body['pen_name']}}, {}, function(err, resp){
            if (err){ next(err); return; };
          });
        } else if (!user.pen_name || user.pen_name.length == 0){
          res.render('500', {err: 'Pen Name required'});
          return;
        }
      } else if (req.body['make_private']){
        writing.is_public = false;
      }
      writing.save(function(err, data){
        if (err){ next(err); return; }
        res.render('writing', {writing:writing, user:user, flash: 'Updated Writing'})
      })
    })
  })
}

controller.list_writings = function(req, res){
  models.Writing.find({is_public: true}, 'title pen_name author id', function(err, docs){
    res.render('list_writings', {writings: docs});
  });
};


module.exports = controller; 
