
/*
 * GET home page.
 */

mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/livewrite');

function get_ip(req){
  if(req.headers['x-forwarded-for']){
    ip_address = req.headers['x-forwarded-for']; 
  } else {
    ip_address = req.connection.remoteAddress;
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
	sess_id:     String,
  json_schama: Number,
  author:   mongoose.Schema.ObjectId,
	views:       {type: Number, default: 0},
	hearts:     {type: Number, default: 0},
	tags:        [String]
});
var Writing = mongoose.model('Writing', WritingS);


var UserS = new mongoose.Schema({
  has_session: Boolean,
  created_at: Date,
  created_ip: String,
  last_ip: String,
  realname: String,
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
  try {
    fetch_user(req, true, function(err, user){
      if (err){ throw err; }
      Writing.findById(req.params.id, function(err, writing){
        if (err){ throw err; }
        if (user.hearts.indexOf(writing.id)){
          delete user.hearts[user.hearts.indexOf(writing.id)];
          writing.hearts -= 1;
        } else {
          user.hearts.push(writing.id);
          writing.hearts += 1;
        }
        writing.save();
        user.save();
        res.send({err: false, updated: true, hearted: true});
      })
    });
  } catch (e){
    res.send({err: e, updated: false, hearted: false});
  }
}

function fetch_user(req, create, cb){
  if (req.cookies['user_id'] && req.cookies['user_id'].length>10){
    User.findById(req.cookies['user_id'].slice(4), function(err,doc){
      cb(err, doc);
    });
  } else {
    if (create){
      var user = new User();
      user.created_at = new Date();
      user.created_ip = get_ip(req);
      user.save(function(err, doc){
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
      res.cookie('user_id', 'uid:' + user.id, {maxAge: 1000*3600*24*100, httpOnly: true});
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
    Writing.find({author: user._id}, function(err, writings){
      res.render('you', {user: user, writings: writings})
    })
  });
}

exports.view_writing = function(req, res){
  try {
    Writing.findById(req.params.id, function(err, doc){
      if (err){ throw err; }
      if (!err && doc){
        doc.views += 1;
        doc.save(function(err, doc){
          if (err){ throw err; }
          res.send({err: false, updated: true})
        })
      }
    })
  } catch (e){
    res.send({err: e});
  }
}

exports.get_writing = function(req, res){
  Writing.findById(req.params.id, function(err, doc){
    if (!err){
      if (!req.path.indexOf('.json')){
        delete doc.created_ip;
        res.send(doc);
      } else {
        res.render('writing', {writing: doc});
      }
    } else {
      res.send('404');
    }
  });
};


exports.list_writings = function(req, res){
  Writing.find({}, 'title id', function(err, docs){
    res.render('list_writings', {writings: docs});
  });
};



