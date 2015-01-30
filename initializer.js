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

    this.on('dbReady', this.updateModels);
  },

  //initialize the waterline ORM
  setupOrm: function() {

    var Waterline = require('waterline');

    //maintain reference to waterline orm
    this.app.orm = new Waterline();

  },

  //find models by searching through modules folder
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

  //instantiate the model & register with waterline & the application
  loadModel: function(modelName, Model) {

    //instantiate the model
    var model = new Model(this.app);

    //set name based on the path if not set in the model
    if (!model.name) {
      model.name = modelName.replace('-','_');
    }

    //check the configuration for issues
    model.processConfiguration();

    //setup the model definition for waterline
    var modelDefinition = {};

    //set the connection
    modelDefinition.connection = model.connection;

    //copy options to model definition for the waterline ORM
    if( model.options) {

      for (var option in model.options) {

        if (typeof model.options[option] !== 'function') {
          modelDefinition[option] = model.options[option];
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
      for (var attribute in model.attributes ) {

        //use json to create actual copy
        modelDefinition.attributes[attribute] = JSON.parse(JSON.stringify(model.attributes[attribute]));

        //the description object is not used by waterline
        if( modelDefinition.attributes[attribute].description )
          delete modelDefinition.attributes[attribute].description;

        //the validate object is used by superjs-validate
        if( modelDefinition.attributes[attribute].validate )
          delete modelDefinition.attributes[attribute].validate;

        //the sanitize object is used by superjs-sanitize
        if( modelDefinition.attributes[attribute].sanitize )
          delete modelDefinition.attributes[attribute].sanitize;

        //the db type is used by superjs-migrate
        if( modelDefinition.attributes[attribute].dbType )
          delete modelDefinition.attributes[attribute].dbType;
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

  //initialize the orm
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
  //update the models with acccess to the underlying engine when the database is ready
  updateModels: function(collections) {

    for( var modelName in collections ) {
        this.app.models[modelName].engine = collections[modelName];
    }

  }

});
