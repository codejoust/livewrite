
/*
 * GET home page.
 */

mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/livewrite');

var _ = require('underscore');

function get_ip(req){
  if(req.headers['x-forwarded-for']){
    ip_address = req.headers['x-forwarded-for']; 
  } else {
    ip_address = req.connection.remoteAddress;
  }
}

function ProcJoin(){
  this.returns = 0;
  this.err = null;
  this.callback = null;
  this.outputs = [];
  var self = this;

  this.add_fn = function(name){
    this.returns += 1;
    return function(fn_err, data){
      self.outputs[name] = data;
      if (self.err){
        return false;
      } else if (fn_err){
        self.callback(err, self.outputs);
        self.err = true;
      } else if (self.callback && self.returns-- == 1){
        self.callback(null, self.outputs);
      } else {
        self.outputs[name] = data;
      }
    }
  }
  this.join = function(callback){
    self.callback = callback;
  }
}



var WritingS = new mongoose.Schema({
	title:  String,
	body:  [String],
	live: {
		keys:  String,
		time:  [Number]
	},
	created_at:  Date,
	created_ip:  String,
	is_finished: Boolean,
  is_public:   {type: Boolean, default: false},
  pen_name:    String,
  json_schama: Number,
  author:   mongoose.Schema.ObjectId,
	views:       {type: Number, default: 0},
	hearts:      {type: Number, default: 0},
	tags:        [String]
});
var Writing = mongoose.model('Writing', WritingS);


var UserS = new mongoose.Schema({
  has_login: {type: Boolean, default: false},
  created_at: Date,
  created_ip: String,
  last_ip: String,
  realname: String,
  remote_id: String,
  remote_token: String,
  pen_name: String,
  email: String,
  username: String,
  bio: String,
  hearts: [mongoose.Schema.ObjectId],
  writings: [mongoose.Schema.ObjectId]
});
var User = mongoose.model('User', UserS);

exports.index = function(req, res){
  res.render('index');
};

function create_writing(req, res, user){
  var writing = new Writing();
  writing.title = req.body.title;
  writing.body  = req.body.text;
  writing.live.keys  = req.body.live.keys;
  req.body.live.time.forEach(function(line_item){
    writing.live.time.push(parseInt(line_item));
  });
  writing.author = user.id;
  writing.created_at = new Date();
  writing.created_ip = get_ip(req);
  writing.is_finished = true;
  writing.json_schema = 1.2;
  user.writings.push(writing.id);
  user.last_ip = get_ip(req);
  user.save();
  writing.save(function(err){
    res.send({err: err, id: writing._id});
  });
}



exports.heart_writing = function(req, res){
  var cb_join = new ProcJoin();
  try {
    var action = 'unknown';
    fetch_user(req, true, function(err, user){
      if (err){ throw err; }
      Writing.findById(req.params.id, function(err, writing){
        if (err){ throw err; }
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
          if (err){ throw err; }
          res.send({err: false, updated: true, action: action});
        })
      })
    });
  } catch (e){
    res.send({err: e, updated: false, hearted: false});
  }
}

function fetch_user(req, create, cb){
  if (req.session['user_id'] && req.session['user_id'].length>10){
    User.findById(req.session['user_id'].slice(4), function(err,doc){
      cb(err, doc);
    });
  } else {
    if (create){
      var user = new User();
      user.created_at = new Date();
      user.created_ip = get_ip(req);
      user.save(function(err, doc){
        if (!err){ req.session['user_id'] = 'uid:' + user.id; }
        cb(err, doc);
      });
    } else {
      cb('No User Found', null)
    }
  }
}

exports.add_writing = function(req, res){
  fetch_user(req, true, function(err, user){
    if (user && !err){
     create_writing(req, res, user);
    } else {
      res.send({err: err, err_at: 'User Create'})
    }
  });
};

exports.about = function(req, res){
  res.render('about');
}

exports.me = function(req, res){
  fetch_user(req, false, function(err, user){
    if (!user){
      res.render('you', {user: null, writings: null, found:false});
      return;
    }
    Writing.find({'_id': {$in: _.union(user.hearts, user.writings)}}, function(err, writings){
      if (err){
        res.render('error!');
        return;
      }
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


exports.login_with_code = function(req, res){
  if (req.body.code && req.body.email){
    User.findOne({code: req.body.code, email: req.body.email}, function(err, user){
      if (!err && user){
        req.session.user_id = 'uid:' + user._id;
        res.send('successfully logged in');
      } else {
        res.send('an error was encountered finding your account.');
      }
    })
  }
}

exports.save_profile_opts = function(req, res){
  try {
    fetch_user(req, false, function(err, user){
      if (!user){ throw err || "Can't find user"; }
      if (req.body['data']){
        if (req.path.indexOf('username') != -1){
          user.username = req.body['data'];
        } else if (req.path.indexOf('pen_name') != -1) {
          user.pen_name = req.body['data'];
        } else if (req.path.indexOf('email') != -1) {
          user.email = req.body['data'].toLowerCase();
        } else {
          throw "Improper url";
        }
      } else {
        throw "No data with update";
      }
      user.save(function(err, resp){
        if (err){ throw err || 'Unable to update [db error].'; }
        res.send({err: false, success: true});
      });
    })
  } catch (e){
    res.send({err: e, success: false})
  }
}

exports.view_writing = function(req, res){
  Writing.findOneAndUpdate({_id: req.params.id}, {'$inc': {views: 1}}, function(err, doc){
    if (err){
      res.send({err: err, writing: null});
    } else {
      res.send({err: false, writing: doc, updated: true})
    }
  });
}

exports.get_writing = function(req, res){
  fetch_user(req, false, function(err, user){
    Writing.findById(req.params.id, function(err, doc){
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

exports.update_writing = function(req, res){
  try {
    fetch_user(req, false, function(err, user){
      if (err || !user){ throw err; }
      Writing.findById(req.params.id, function(err, writing){
        if (err || !writing){ throw err; }
        if (req.body['make_public']){
          writing.is_public = true;
          writing.pen_name = user.pen_name;
          if (req.body['pen_name'] && req.body['pen_name'].length > 0){
            writing.pen_name = req.body['pen_name'];
            user.update({$set: {'pen_name': req.body['pen_name']}}, {}, function(err, resp){
              if (err){ throw err; };
            });
          } else if (!user.pen_name || user.pen_name.length == 0){
            throw 'Pen Name required';
          }
        } else if (req.body['make_private']){
          writing.is_public = false;
        }
        writing.save(function(err, data){
          if (err){ throw err; }
          res.render('writing', {writing:writing, user:user, flash: 'Updated Writing'})
        })
      })
    })
  } catch(e){
    res.render('500', {err: e});
  }
}

exports.list_writings = function(req, res){
  Writing.find({is_public: true}, 'title pen_name author id', function(err, docs){
    res.render('list_writings', {writings: docs});
  });
};



