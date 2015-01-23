"use strict";

var SuperJS = require('superjs');
var Waterline = require('waterline');
var fs = require('fs');

/**
 * The Waterline initializer configures and initializes the Waterline ORM within SuperJS.
 *
 * @exports Initializer
 * @namespace SuperJS.Waterline
 * @extends SuperJS.Class
 */

module.exports = SuperJS.Class.extend({

  //initialize the database engine
  init: function(app) {

    //store reference to the app
    this.app = app;

    //maintain list of loaded models for console
    this.loadedModels = [];

    this.setupOrm();
    this.loadModels();
    this.initOrm();

    this.on('dbReady', this.updateControllers);
  },

  //initialize the waterline ORM
  setupOrm: function() {

    var Waterline = require('waterline');

    //maintain reference to waterline orm
    this.app.orm = new Waterline();

  },

  //load models by going through module folders
  loadModels: function() {

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

    }

    this.app.log.info('models loaded:',this.loadedModels);

  },

  loadModel: function(modelName, Model) {

    //instantiate the model
    var model = new Model(this.app);

    //set name based on the path if not set in the model
    if (!model.name) {
      model.name = modelName;
    }

    //setup the model definition for waterline
    var modelDefinition = {};

    //set the connection
    modelDefinition.connection = model.connection;

    //copy options to model definition for the waterline ORM
    if( model.options) {

      for (var key in model.options) {

        if (typeof model.options[key] !== 'function') {
          modelDefinition[key] = model.options[key];
        }

      }
    }

    //set the identity for waterline if not set in the options
    if( !modelDefinition.identity ) {
      modelDefinition.identity = modelName;
    }

    //setup the model attributes for waterline
    modelDefinition.attributes = {};

    //copy the attributes to the model definition for the waterline ORM.
    if( model.attributes) {
      for (var key in model.attributes ) {

        //use json to create actual copy
        modelDefinition.attributes[key] = JSON.parse(JSON.stringify(model.attributes[key]));

        //the validate object is used by superjs-validator
        if( modelDefinition.attributes[key].validate )
          delete modelDefinition.attributes[key].validate;

        //the sanitize object is used by superjs-validator
        if( modelDefinition.attributes[key].sanitize )
          delete modelDefinition.attributes[key].sanitize;

        //the db type is used by superjs-migrate
        if( modelDefinition.attributes[key].dbType )
          delete modelDefinition.attributes[key].dbType;
      }
    }

    //extend the waterline collection
    var ormModel = Waterline.Collection.extend(modelDefinition);

    //load the collection with waterline
    this.app.orm.loadCollection(ormModel);

    //make the model class available to the application
    this.app.models[modelName] = model;

    //assign the model to its related controller
    if( this.app.controllers[modelName] ) {
      this.app.controllers[modelName].model = model;
    }

    //keep simple array of load model names for debugging
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

        self.emit('dbReady', models.collections);
      }
    });
  },

  //TODO: namespace the models? Could be an issue when multiple db engines are possible.
  updateControllers: function(collections) {

    //loop through controllers and update the model of the same name
    for( var controllerName in this.app.controllers ) {

      if( controllerName in collections ) {
        this.app.controllers[controllerName].model.engine = collections[controllerName];
      }

    }

  }

});
