/*
 * Waterline Initializer *
 */

//require dependencies
var Class = require('../superjs/core/base'),
    fs = require('fs');


module.exports = Class.extend({


  //initialize the database engine
  init: function(app) {

    //store reference to the app
    this.app = app;

    //maintain list of loaded models for console
    this.loadedModels = [];

    this.setupOrm();
    this.loadModels();
    this.initOrm();
  },

  //initialize the waterline ORM
  setupOrm: function() {

    var Waterline = require('waterline');

    //maintain reference to waterline orm
    this.app.orm = new Waterline();

  },

  //load models by going through module folders
  loadModels: function() {

    this.app.log.info('loading models...');

    //maintain reference to self
    var self = this;

    //maintain quick list of loaded models for console
    var loadedModels = [];

    //check if files are stored in modules or by type
    if( fs.existsSync(self.app.appPath+'/modules') ) {

      //get list of modules
      var modules = fs.readdirSync(self.app.appPath+'/modules');

      //load each controller
      modules.map(function(moduleName) {

        //make sure the controller exists
        if( fs.existsSync(self.app.appPath+'/modules/'+moduleName+'/model.js') ) {

          var Model = require(self.app.appPath+'/modules/'+moduleName+'/model');

          if( Model ) {
            self.loadModel(moduleName, Model);
          }
        }

      });

    } else if( fs.existsSync(self.app.appPath+'/models') ) {

      //get list of models
      var models = fs.readdirSync(self.app.appPath+'/models');

      //load each controller
      models.map(function(modelName) {

        modelName = modelName.split('.')[0];

        var Model = require(self.app.appPath+'/models/'+modelName);

        if( Model ) {
          self.loadModel(modelName, Model);
        }

      });

    }

    this.app.log.info('models loaded:',this.loadedModels);

  },

  loadModel: function(modelName, Model) {
    this.app.orm.loadCollection(Model);
    this.loadedModels.push(modelName);
  },

  initOrm: function() {

    //maintain reference to self
    var self = this;

    //initialize the orm
    this.app.orm.initialize(this.app.config.data, function(err, models) {

      //TODO: retry/manage app.ormReady state
      if(err) {
        self.app.log.error('ORM failed to initialize:',err);

      } else {
        self.app.log.info('The ORM is Now Ready...');
        self.app.models = models.collections;
        self.app.connections = models.connections;

        self.app.emit('dbReady', models.collections);
      }
    });

  }

});
