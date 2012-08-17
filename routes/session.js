exports.logout = function(req, res){
    req.logout();
});

exports.login = function(req, res){
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
                  utils.fetch_user(req, false, function(err, doc){
                    if (err){ req.send('Err! '+err); return false; }
                    if (!doc){
                      user = new models.User();
                      user.created_at = new Date();
                      user.created_ip = get_ip(req);
                    }
                    user.has_login = true;
                    user.remote_id = fb_info['id'];
                    if (fb_info['email']){ user.email = fb_info['email']; }
                    user.save(function(err, doc){
                      if (!err){
                        res.send('logged in');
                      } else {
                        res.send('error logging in ')
                      }
                    });
                  })
                } else {
                  res.redirect('/');
                }
            }
        }});
});