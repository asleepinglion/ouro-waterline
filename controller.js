/*
 * @module API
 * @submodule Database
 */

"use strict";

var Controller = require('../superjs/core/controller');
var _ = require('underscore');

/**
 * The WaterlineController provides basic essential methods for the basic model management.
 *
 * @exports WaterlineController
 * @extends SuperJS.Controller
 */

module.exports = Controller.extend({

  /**
   * Initialize the controller
   *
   * @param app
   */
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

    //determine search criteria
    var where = this.sanitizeCriteria(req, next);

    if( where === false )
      return;

    //make sure the sort parameter is an available attribute
    var sort = req.param('sort');
    if( sort ) {
      var sortBy = sort.split(" ");
      if( Object.keys(this.model._attributes).indexOf(sortBy[0]) === -1 ) {
        return next({meta:{success: false, message: "Failed to search the " + self.name + " database..."}, errors:[{code: 'invalid_sort', status: 422, message: sortBy[0]+' is not a valid attribute.'}]}, 422);
      }
    }

    var limit = req.param('limit') || 25;
    var skip = req.param('skip') || 0;

    //search database
    this.model.find()
      .where(where)
      .limit(limit)
      .skip(skip)
      .sort(sort)
      .then(function(results) {

        //package & return response
        var response = {meta:{success: true, message: "Successfully searched the " + self.name + " database..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {

        //return properly formatted error messages
        var parsed = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to search the " + self.name + " database..."}, errors: parsed.errors}, parsed.status);

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

        //package & return response
        var response = {meta:{success: true, message: "Successfully created " + self.name + " record..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {

        var parsed = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to create " + self.name + " record..."}, errors: parsed.errors}, parsed.status);

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

        //package & return response
        var response = {meta:{success: true, message: "Successfully updated " + self.name + " record..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {
        var parsed = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to update " + self.name + " record..."}, errors: parsed.errors}, parsed.status);
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

        //package & return response
        var response = {meta:{success: true, message: "Successfully deleted " + self.name + " record..."}};
        response[self.name] = results;
        next(response);

      }).fail( function(wlErrors) {
        var parsed = self.parseErrors(wlErrors);
        next({meta:{success: false, message: "Failed to delete " + self.name + " record..."}, errors: parsed.errors}, parsed.status);
      });

  },

  Describe: function(req, next) {

    var response = {meta:{success: true, model: this.model.name}, attributes: this.model._attributes};
    next(response);

  },

  //TODO: refactor as promises
  sanitizeCriteria: function(req, next) {

    //maintain reference to instance
    var self = this;

    var where = req.param('where');
    if( where ) {

      //attempt to convert where clause to object if its a string
      if(_.isString(where)){
        try {
          where = JSON.parse(where);
        } catch(e) {
          next({meta:{success: false, message: "Failed to search the " + self.name + " database..."}, errors:[{code: 'invalid_where', status: 422, message: 'The where parameter provided was not valid JSON.'}]}, 422);
          return false;
        }
      }

    } else {

      where = {};

      var paramBlackList = ['sort','limit','skip','where'];

      //loop through query string parameters
      for( var qParam in req.query ) {

        //ignore special parameters
        if( paramBlackList.indexOf(qParam) !== -1 ) {
          continue;
        }

        //populate where object
        where[qParam] = req.query[qParam];

      }

      //loop through body parameters
      for( var bParam in req.body ) {

        //ignore special parameters
        if( paramBlackList.indexOf(bParam) !== -1 ) {
          continue;
        }

        //populate where object
        where[bParam] = req.body[bParam];

      }
    }

    //make sure fields are valid
    for( var attribute in where ) {
      var attribute = attribute.split(" ");
      if( Object.keys(this.model._attributes).indexOf(attribute[0]) === -1 ) {
        next({meta:{success: false, message: "Failed to search the " + self.name + " database..."}, errors:[{code: 'invalid_attribute', status: 422, message: attribute[0]+' is not a valid attribute.'}]}, 422);
        return false;
      }
    }

    return where;
  },

  /**
   * Loop through errors returned from waterline and populate an
   * error array for clean consistent responses.
   *
   * @param wlErrors
   * @returns {Object}
   */

  //TODO: refactor as promises
  parseErrors: function(wlErrors) {

    this.app.log.error('waterline errors:',wlErrors);

    var errors = [];
    var status = 500;

    if( wlErrors.status >= 500 ) {
      errors.push({code: 'database_error', status: status, message: 'An unexpected error occurred attempting to execute your query.', raw: wlErrors.raw});

    } else if( wlErrors.status >= 400 ) {

      status = 422;
      var attributes = wlErrors.invalidAttributes;

      var error = {code: 'validation_error', status: status, exceptions:[]};

      for (var key in attributes) {

        for (var i in attributes[key]) {

          var exception = {rule: attributes[key][i].rule, attribute: key};

          //TODO: provide clean error message for all rules
          switch (attributes[key][i].rule) {
            case 'string':
              exception.message = "The `" + key + "` field must be a string.";
              break;
            case 'required':
              exception.message = "The `" + key + "` field is required.";
              break;
            case 'email':
              exception.message = "The `" + key + "` field must be a valid email address.";
              break;
            default:
              exception.message = attributes[key][i].message;
          }

          error.exceptions.push(exception);
        }
      }

      errors.push(error);
    }

    return {status: status, errors: errors};
  }

});
