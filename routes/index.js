
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
	views:       {type: Number, default: 0},
	plusses:     {type: Number, default: 0},
	tags:        [String]
});
var Writing = mongoose.model('Writing', WritingS);


exports.index = function(req, res){
  res.render('index');
};

exports.add_writing = function(req, res){
  var writing = new Writing();
  writing.title = req.body.title;
  writing.body  = req.body.text;
  writing.live.keys  = req.body.live.keys;
  req.body.live.time.forEach(function(line_item){
    writing.live.time.push(parseInt(line_item));
  });
  writing.created_at = new Date();
  writing.created_ip = get_ip(req);
  writing.is_finished = true;
  writing.save(function(err){
    res.send({err: err, id: writing._id});
  });
};

exports.get_writing = function(req, res){
  Writing.findById(req.params.id, function(err, doc){
    if (!err){
      if (!req.path.indexOf('.json')){
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
  
};



