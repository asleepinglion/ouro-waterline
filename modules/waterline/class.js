"use strict";

var SuperJS = {};
SuperJS.Api = require('superjs-api');
var fs = require('fs');
var Waterline = require('waterline');

module.exports = SuperJS.Api.Adapter.extend({

  init: function(app) {

    //execute parent class' constructor
    this._super();

    //localize dependent modules
    this.app = app;

    //maintain a list of loaded models
    this.loadedModels = [];

    this.loadWaterline();
    this.loadModels();
    this.initWaterline();

  },

  loadWaterline: function() {

    //initialize the waterline orm
    this.waterline = new Waterline();
  },

  initWaterline: function() {

    //maintain reference to self
    var self = this;

    //initialize the orm
    this.waterline.initialize(this.app.config.data.adapters.waterline, function(err, models) {

      //TODO: retry/manage app.ormReady state
      if(err) {
        self.log.error('Waterline failed to initialize:',err);
      } else {
        self.emit('connected', models.collections);
      }
    });

  },

  //find models by searching through modules folder
  loadModels: function() {

    //maintain reference to self
    var self = this;

    //make sure the apis folder has been defined
    if( fs.existsSync(self.app.paths.cwd+'/apis') ) {

      //get list of apis
      var apis = fs.readdirSync(self.app.paths.cwd+'/apis');

      //load each model
      apis.map(function(apiName) {

        //make sure the model exists
        if( fs.existsSync(self.app.paths.cwd+'/apis/'+apiName+'/model.js') ) {

          var Model = require(self.app.paths.cwd+'/apis/'+apiName+'/model');

          if( Model && typeof Model.prototype.adapter === 'string' && Model.prototype.adapter === 'waterline' ) {
            self.loadModel(apiName, Model);
          }
        }

      });

    }

    this.log.info('models loaded:',this.loadedModels);

  },

  loadModel: function(moduleName, Model) {

    //instantiate the model
    var model = new Model(this);

    //convert module name to table name format
    var modelName = moduleName.replace('-', '_');

    //set name based on the path if not set in the model
    if (!model.name) {
      model.name = modelName;
    }

    //setup the model definition for waterline
    var modelDefinition = {};

    //set the connection
    modelDefinition.connection = model.connection;

    //copy options to model definition for the waterline ORM
    if (model.options) {

      for (var option in model.options) {

        if (typeof model.options[option] !== 'function') {
          modelDefinition[option] = model.options[option];
        }

      }
    }

    //set the identity for waterline if not set in the options
    if (!modelDefinition.identity) {
      modelDefinition.identity = modelName;
    }

    //setup the model attributes for waterline
    modelDefinition.attributes = {};

    //copy the attributes to the model definition for the waterline ORM.
    if (model.attributes) {
      for (var attribute in model.attributes) {

        //use json to create actual copy
        modelDefinition.attributes[attribute] = JSON.parse(JSON.stringify(model.attributes[attribute]));

        //don't set type to avoid waterline type checks
        if (modelDefinition.attributes[attribute].type)
          delete modelDefinition.attributes[attribute].type;

        //the description object is not used by waterline
        if (modelDefinition.attributes[attribute].description)
          delete modelDefinition.attributes[attribute].description;

        //the validate object is used by superjs-validate
        if (modelDefinition.attributes[attribute].validate)
          delete modelDefinition.attributes[attribute].validate;

        //the sanitize object is used by superjs-sanitize
        if (modelDefinition.attributes[attribute].sanitize)
          delete modelDefinition.attributes[attribute].sanitize;

        //the db type is used by superjs-db-migrate
        if (modelDefinition.attributes[attribute].dbType)
          delete modelDefinition.attributes[attribute].dbType;
      }
    }

    //extend the waterline collection
    var ormModel = Waterline.Collection.extend(modelDefinition);

    //load the collection with waterline
    this.waterline.loadCollection(ormModel);

    //make the model class available to the application
    this.app.models[modelName] = model;

    //keep simple array of load model names for debugging
    this.loadedModels.push(modelName);
  }



});