"use strict";

var SuperJS = require('superjs');
var _ = require('underscore');
var Promise = require('bluebird');

/**
 * The Waterline controller initializes the controller within SuperJS &
 * provides essential methods for managing Waterline models.
 *
 * @exports Controller
 * @namespace SuperJS.Waterline
 * @extends SuperJS.Controller
 */

module.exports = SuperJS.Controller.extend({

  /**
   * Initialize the controller
   *
   * @param app
   */
  init: function(app) {

    //call base class constructor
    this._super(app);

    //maintain reference to app
    this.app = app;

    //mark controller as rest enabled
    this.restEnabled = true;

    //maintain a reference to models
    this.models = app.models;

    //store reference to self
    var self = this;

  },

  /**
   * Search records in the database.
   *
   * @param req
   * @param next
   */

  Search: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      var criteria = {};
      criteria.where = (typeof req.parameters.where === 'object') ? req.parameters.where : {};
      criteria.sort = (typeof req.parameters.sort === 'string' && req.parameters.sort.length > 0 ) ? req.parameters.sort : undefined;
      criteria.limit = (typeof req.parameters.limit === 'number') ? req.parameters.limit : undefined;
      criteria.skip = (typeof req.parameters.skip === 'number' ) ? req.parameters.skip : undefined;

      return self.model.find(criteria)
        .then(function(results) {

          //package & return response
          var response = {meta:{success: true, message: "Successfully searched the " + self.name + " database..."}};
          response[self.name] = results;
          resolve(response);

        }).catch(function(error) {

          //if the error is from waterline; clean it up first
          if( !(error instanceof SuperJS.Error) ) {
            error = self.parseWlErrors(error);
          }

          //reject with the error so the application can respond
          reject(error);

        });

    });

  },

  /**
   * Create a new record in the database.
   *
   * @param req
   * @param next
   */

  Create: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      //add record to the database
      self.model.create(self.parameter(req, 'attributes'))

        .then(function(results) {

          //package response
          var response = {meta:{success: true, message: "Successfully created " + self.name + " record..."}};
          response[self.name] = results;

          //resolve with results from waterline
          resolve(response);

        }).catch(function(error) {

          //if the error is from waterline; clean it up first
          if( !(error instanceof SuperJS.Error) ) {
            error = self.parseWlErrors(error);
          }

          //reject with the error
          reject(error);

        });
    });
  },

  /**
   * Update a record in the database.
   *
   * @param req
   * @param next
   */

  Update: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      self.model.update({id: self.parameter(req,'attributes.id')}, self.parameter(req,'attributes'))
        .then(function (results) {

          //package response
          var response = {meta: {success: true, message: "Successfully updated " + self.name + " record..."}};
          response[self.name] = results;

          //resolve with results from waterline
          resolve(response);

        }).catch(function(error) {

          //if the error is from waterline; clean it up first
          if( !(error instanceof SuperJS.Error) ) {
            error = self.parseWlErrors(error);
          }

          //reject with the error
          reject(error);

        });
    });

  },

  /**
   * Delete a record from the database.
   *
   * @param req
   * @param next
   */

  Delete: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      //validate parameters
      var params = req.body || {};

      //mark record as deleted
      self.model.update({id: params.id}, {isDeleted: true})
        .then(function (results) {

          //package response
          var response = {meta: {success: true, message: "Successfully deleted " + self.name + " record..."}};
          response[self.name] = results;

          //resolve with results from waterline
          resolve(response);

        }).catch(function(error) {

          //if the error is from waterline; clean it up first
          if( !(error instanceof SuperJS.Error) ) {
            error = self.parseWlErrors(error);
          }

          //reject with the error
          reject(error);

        });
    });

  },

   /**
   * Loop through errors returned from waterline and populate an
   * error array for clean consistent responses.
   *
   * @param wlErrors
   * @returns {Object}
   */

  parseWlErrors: function(wlError) {

    this.app.log.error('waterline errors:');
    this.app.log.object(wlError);

    var error =  {code: 'database_error', status: 500, message: 'An unexpected error occurred attempting to execute your query.'};

    if( wlError.status ) {

      if (wlError.status >= 500) {
        error.detail = wlError.details;

      } else if (wlError.status >= 400) {

        var attributes = wlError.invalidAttributes;

        error.code = 'validation_error';
        error.status = 422;
        error.exceptions = [];

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
      }
    }

    return error;
  }

});
