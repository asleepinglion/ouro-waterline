"use strict";

var Ouro = {};
Ouro.Api = require('ouro-api');
var fs = require('fs');
var Waterline = require('waterline');

module.exports = Ouro.Api.Adapter.extend({

  name: 'waterline',

  _metaFile: function() {
    this._super();
    this._loadMeta(__filename);
  },

  init: function(app, config) {

    //execute parent class' constructor
    this._super();

    //localize dependent modules
    this.app = app;

    //save reference to config
    this.config = config || {};

    //maintain reference to models
    this.models = {};

    //initialize the waterline orm
    this.waterline = new Waterline();

  },

  loadModel: function(moduleName, Model) {

    //instantiate the model
    var model = new Model(this.app, this);

    //convert module name to table name format
    var modelName = moduleName.replace('-', '_');

    //set name based on the path if not set in the model
    if (!model.name || model.name === 'model' ) {
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

      modelDefinition.tableName = modelName;

      var nameParts = modelName.split('_');

      modelDefinition.identity = "";

      for( var i = 0; i < nameParts.length; i++ ) {
        modelDefinition.identity += nameParts[i].substr(0,1).toUpperCase() + nameParts[i].substr(1,nameParts[i].length-1);
      }

    }

    //setup the model attributes for waterline
    modelDefinition.attributes = {};

    //copy the attributes to the model definition for the waterline ORM.
    if (model.attributes) {
      for (var attribute in model.attributes) {

        //use json to create actual copy
        modelDefinition.attributes[attribute] = JSON.parse(JSON.stringify(model.attributes[attribute]));

        //the description object is not used by waterline
        if (modelDefinition.attributes[attribute].description)
          delete modelDefinition.attributes[attribute].description;

        //the validate object is used by ouro-validate
        if (modelDefinition.attributes[attribute].validate)
          delete modelDefinition.attributes[attribute].validate;

        //the sanitize object is used by ouro-sanitize
        if (modelDefinition.attributes[attribute].sanitize)
          delete modelDefinition.attributes[attribute].sanitize;

        //the db type is used by ouro-db-migrate
        if (modelDefinition.attributes[attribute].dbType)
          delete modelDefinition.attributes[attribute].dbType;
      }
    }

    //extend the waterline collection
    var ormModel = Waterline.Collection.extend(modelDefinition);

    //load the collection with waterline
    this.waterline.loadCollection(ormModel);

    //make the model class available to the application
    this.models[modelName] = model;
  },

  finalize: function() {

    this.log.debug('establishing waterline connections:', Object.keys(this.config.connections));

    //maintain reference to self
    var self = this;

    //initialize the orm
    this.waterline.initialize(this.config, function(err, models) {

      if(err) {
        self.log.error('Waterline failed to initialize:',err);
      } else {

        //fire event just in case
        self.emit('connected', this);

        //create map to model names because waterline makes it difficult
        var modelMap = {};
        for( var model in self.models ) {
          modelMap[model.replace('_','')] = self.models[model];
        }

        //associate each waterline model to the respective ouro model
        for( model in models.collections ) {
          modelMap[model].db = models.collections[model];
        }
      }
    });

  }

});