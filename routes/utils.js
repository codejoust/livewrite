
var mongoose = require('mongoose'),
 models = {
    User: mongoose.model('User'),
    Writing: mongoose.model('Writing')
  };
var helpers = {};


helpers.get_ip = function(req){
  if(req.headers['x-forwarded-for']){
    ip_address = req.headers['x-forwarded-for']; 
  } else {
    ip_address = req.connection.remoteAddress;
  }
}

helpers.ProcJoin = function(){
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




helpers.create_writing = function(req, res, user){
  var writing = new models.Writing();
  writing.title = req.body.title;
  writing.body  = req.body.text;
  writing.live.keys  = req.body.live.keys;
  req.body.live.time.forEach(function(line_item){
    writing.live.time.push(parseInt(line_item));
  });
  writing.author = user.id;
  writing.created_at = new Date();
  writing.created_ip = helpers.get_ip(req);
  writing.is_finished = true;
  writing.json_schema = 1.2;
  user.writings.push(writing.id);
  user.last_ip = helpers.get_ip(req);
  user.save();
  writing.save(function(err){
    res.send({err: err, id: writing._id});
  });
}

helpers.fetch_user = function(req, create, cb){
  function mk_user(){
    var user = new models.User();
    user.created_at = new Date();
    user.created_ip = helpers.get_ip(req);
    user.save(function(err, doc){
      if (!err){ req.session['user_id'] = 'uid:' + user.id; }
      cb(err, user);
    });
  }
  if (req.session['user_id'] && req.session['user_id'].length>10){
    models.User.findById(req.session['user_id'].slice(4), function(err,doc){
      if (!doc){
        req.session['user_id'] = null;
        console.error('>>> \n Nonexistent User!!!\n <<<<');
        if (create){
          mk_user();
        } else {
          cb('Nonexistent User', null);
        }
      }
      cb(err, doc);
    });
  } else {
    if (create){
      mk_user();
    } else {
      cb(null, null)
    }
  }
}

module.exports = helpers;