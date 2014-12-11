/*
 * @module API
 * @submodule Database
 */

"use strict";

var Controller = require('../superjs/core/controller');

/**
 * The WaterlineController provides basic essential methods for the basic model management.
 *
 * @exports WaterlineController
 * @extends SuperJS.Controller
 */
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

  /**
   * Search records in the database.
   *
   * @param req
   * @param next
   */
  Search: function(req, next) {

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

        //package * return response
        var response = {meta:{success: true, message: "Successfully searched the " + self.name + " database..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {
        var errors = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to search the " + self.name + " database..."}, errors: errors}, 422);
      });
  },

  /**
   * Create a new record in the database.
   *
   * @param req
   * @param next
   */
  Create: function(req, next) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    //add record to the database
    this.model.create(obj)
      .then(function(results) {

        //package * return response
        var response = {meta:{success: true, message: "Successfully created " + self.name + " record..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {
        var errors = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to create " + self.name + " record..."}, errors: errors}, 422);
      });
  },

  /**
   * Update a record in the database.
   *
   * @param req
   * @param next
   */
  Update: function(req, next) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var obj = req.body || {};

    //make sure the id is present
    if( !obj.id ) {
      next({success: false, message: "Updates require you pass the \"id\" field..."});
      return;
    }

    //update database rec ord
    this.model.update({id: obj.id}, obj)
      .then(function(results) {

        //package * return response
        var response = {meta:{success: true, message: "Successfully updated " + self.name + " record..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {
        var errors = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to update " + self.name + " record..."}, errors: errors}, 422);
      });

  },

  /**
   * Delete a record from the database.
   *
   * @param req
   * @param next
   */
  Delete: function(req, next) {

    //maintain reference to self
    var self = this;

    //validate parameters
    var params = req.body || {};

    //make sure the id is present
    if( !params.id ) {
      next({success: false, message: "Delete requires you pass the \"id\" field..."});
      return;
    }

    //mark record as deleted
    this.model.update({id: params.id}, {isDeleted: true})
      .then(function(results) {

        //package * return response
        var response = {meta:{success: true, message: "Successfully deleted " + self.name + " record..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {
        var errors = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to delete " + self.name + " record..."}, errors: errors}, 422);
      });

  },

  Describe: function(req, next) {

    var response = {meta:{success: true, model: this.model.name, attributes: this.model._attributes}};
    next(response);

  },

  /**
   * Loop through invalid attribute errors on the errors object returned
   * from waterline and populate error message array for proper JSON API response.
   *
   * @param wlErrors
   * @returns {{}}
   */

  parseErrors: function(wlErrors) {

    var errors = {};

    var attributes = wlErrors.invalidAttributes;

    for( var key in attributes ) {
      errors[key] = [];

      for( var issue in attributes[key] ) {

        //TODO: provide clean error mesasage for all rules
        switch(attributes[key][issue].rule) {
          case 'string':
            errors[key].push("The `"+key+"` field must be a string.");
            break;
          case 'required':
            errors[key].push("The `"+key+"` field is required.");
            break;
          case 'email':
            errors[key].push("The `"+key+"` field must be a valid email address.");
            break;
          default:
            errors[key].push(attributes[key][issue].message);
        }

      }
    }

    return errors;
  }

});
