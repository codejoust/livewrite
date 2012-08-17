var configCache = {}
  , loadJSONSync = exports.loadJSONSync = function(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }, loadConfigSync = function(name, dir) {
  var file = (dir || process.cwd()) + '/config/' + name + '.json'
    , config;
  try { config = loadJSONSync(file); }
  catch(e) { throw new Error('Missing config file ./config/' + name + '.json - ' + e); }
  return config;
  }, loadConfig = function(name){
    return configCache[name] || (configCache[name] = loadConfigSync(name)[app.settings.env || process.env.NODE_ENV]);
  };

module.exports = {};
module.exports.loadConfig = loadConfig;