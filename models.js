module.exports = function(connect_path, mongoose){

  var schemas = {};
  mongoose.connect(connect_path);

  schemas.Writing = new mongoose.Schema({
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

  schemas.User = new mongoose.Schema({
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

  return schemas;

}