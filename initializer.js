/*
 * Waterline Initializer *
 */

//require dependencies
var Class = require('../superjs/core/base'),
    fs = require('fs');


module.exports = Class.extend({

  //initialize the database engine
  _init: function(app) {
    this._setupOrm(app);
    this._loadModels(app);
    this._initOrm(app);
  },

  //initialize the waterline ORM
  _setupOrm: function(app) {

    var Waterline = require('waterline');

    //maintain reference to waterline orm
    app.orm = new Waterline();

  },

  //load models by going through module folders
  _loadModels: function(app) {

    console.log('loading models...');

    //maintain quick list of loaded models for console
    var loadedModels = [];

    //check if files are stored in modules or by type
    if( fs.existsSync(app.appPath+'/modules') ) {

      //get list of modules
      var modules = fs.readdirSync(app.appPath+'/modules');

      //load each controller
      modules.map(function(moduleName) {

        //make sure the controller exists
        if( fs.existsSync(app.appPath+'/modules/'+moduleName+'/model.js') ) {

          var Model = require(app.appPath+'/modules/'+moduleName+'/model');

          if( Model ) {
            app.orm.loadCollection(Model);
            loadedModels.push(moduleName);
          }
        }

      });

    } else if( fs.existsSync(app.appPath+'/models') ) {

      //get list of models
      var models = fs.readdirSync(app.appPath+'/models');

      //load each controller
      models.map(function(modelName) {

        modelName = modelName.split('.')[0];

        var Model = require(app.appPath+'/models/'+modelName);

        if( Model ) {
          app.orm.loadCollection(Model);
          loadedModels.push(modelName);
        }

      });

    }

    console.log('models loaded:',loadedModels);

  },

  _initOrm: function(app) {

    //initialize the orm
    app.orm.initialize(app.config.data, function(err, models) {

      //TODO: retry/manage app.ormReady state
      if(err) {
        console.log('ORM failed to initialize:');
        console.log(err);

      } else {
        console.log('The ORM is Now Ready...');
        app.models = models.collections;
        app.connections = models.connections;

        app._emit('ormReady', models.collections);
      }
    });

  }

});