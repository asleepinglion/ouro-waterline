/*
 * Waterline REST Controller *
 * the rest controller class provides basic rest methods to a controller *
 */

//require dependencies
var Controller = require('../superjs/core/controller');

module.exports = Controller.extend({

  init: function(app) {

    //call base class constructor
    this._super(app);

    //mark controller as rest enabled
    this.restEnabled = true;

    //store reference to self
    var self = this;

    this.app.on('dbReady', function(models) {

      //store reference to models
      self.models = models;

      //associate model of the same name to this controller if it exists
      var modelName = self.name.toLowerCase();
      if( modelName in models )
        self.model = models[modelName];

    });

  },

  Search: function(req, callback) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var where = req.param('where');
    var sort = req.param('sort');
    var limit = req.param('limit');
    var skip = req.param('skip') || 0;

    //search database
    this.model.find()
      .where(where)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .then(function(results) {
        callback({success: true, message: "Successfully searched the " + self.name + " database...", results: results});
      }).fail( function(err) {
        callback({success: false, message: "Failed to search the " + self.name + " database...", error: err});
      });
  },

  Create: function(req, callback) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    //add record to the database
    this.model.create(obj)
      .then(function(results) {
        callback({success: true, message: "Successfully created " + self.name + " record...", results: results});
      }).fail( function(err) {
        callback({success: false, message: "Failed to create " + self.name + " record...", error: err});
      });
  },

  Update: function(req, callback) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    //make sure the id is present
    if( !obj.id ) {
      callback({success: false, message: "Updates require you pass the \"id\" field..."});
      return;
    }

    //update database rec ord
    this.model.update({id: obj.id}, obj)
      .then(function(results) {
        callback({success: true, message: "Successfully updated " + self.name + " record...", results: results});
      }).fail( function(err) {
        callback({success: false, message: "Failed to update " + self.name + " record...", error: err});
      });

  },

  Delete: function(req, callback) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var params = req.body || {};

    //make sure the id is present
    if( !params.id ) {
      callback({success: false, message: "Delete requires you pass the \"id\" field..."});
      return;
    }

    //mark record as deleted
    this.model.update({id: params.id}, {isDeleted: true})
      .then(function(results) {
        callback({success: true, message: "Successfully deleted " + self.name + " record...", results: results});
      }).fail( function(err) {
        callback({success: false, message: "Failed to delete " + self.name + " record...", error: err});
      });

  },

  Describe: function(req, callback) {

    var response = {success: true, model: this.model.name, attributes: this.model._attributes};
    callback(response);

  }

});
