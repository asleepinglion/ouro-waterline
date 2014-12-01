/*
 * Waterline Initializer *
 */

//require dependencies
var Class = require('../superjs/core/base');
var fs = require('fs');
var Waterline = require('waterline');

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

          var modelDefinition = require(self.app.appPath+'/modules/'+moduleName+'/model');

          if( modelDefinition ) {
            self.loadModel(moduleName, modelDefinition);
          }
        }

      });

    } else if( fs.existsSync(self.app.appPath+'/models') ) {

      //get list of models
      var models = fs.readdirSync(self.app.appPath+'/models');

      //load each controller
      models.map(function(modelName) {

        modelName = modelName.split('.')[0];

        var modelDefinition = require(self.app.appPath+'/models/'+modelName);

        if( modelDefinition ) {
          self.loadModel(modelName, modelDefinition);
        }

      });

    }

    this.app.log.info('models loaded:',this.loadedModels);

  },

  loadModel: function(modelName, modelDefinition) {

    //set name/identity if not present
    if (modelDefinition.name) {
      modelDefinition.identity = modelDefinition.name;
    } else {
      if( modelDefinition.identity ) {
        modelDefinition.name = modelDefinition.identity;
      } else {
        modelDefinition.name = modelName;
        modelDefinition.identity = modelName;
      }
    }

    //extend the waterline collection
    var ormModel = Waterline.Collection.extend(modelDefinition);

    //load the collection with waterline
    this.app.orm.loadCollection(ormModel);

    //make the model available to the application
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
