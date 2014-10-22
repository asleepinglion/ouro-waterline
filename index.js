/*
 * Waterline Database Engine
 */

module.exports.Initializer = require('./initializer');
module.exports.Waterline = require('waterline');
module.exports.Controller = require('./controller');
module.exports.Model = module.exports.Waterline.Collection;