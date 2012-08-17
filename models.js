module.exports = function(connect_path, app){

  var mongoose = require('mongoose')
    , models = {};
  mongoose.connect('mongodb://localhost/livewrite');

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
  models.Writing = mongoose.model('Writing', WritingS);


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
  models.User = mongoose.model('User', UserS);

  if (app){
    app.set('models', models);
  }
  return models;

}