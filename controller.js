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

      //execute sanitization & validation in parallel
      return Promise.join(

        //sanitize and validate the sort parameter
        self.sanitizeSort(req),

        //sanitize and validate the limit parameter
        self.sanitizeLimit(req),

        //sanitize and validate the skip parameter
        self.sanitizeSkip(req),

        //execute the database query
        function(sort, limit, skip) {

          //capture where
          var where = req.parameters.where;

          /*
          //make sure fields are valid
          for( var attribute in where ) {

            if( !self.isValidAttribute(attribute) ) {
              reject(new SuperJS.Error('invalid_attribute', 422, attribute+' is not a valid attribute.'));
            }
          }

          */

          return self.model.find()
            .where(where)
            .limit(limit)
            .skip(skip)
            .sort(sort)
            .then(function(results) {

              //package & return response
              var response = {meta:{success: true, message: "Successfully searched the " + self.name + " database..."}};
              //console.log(results);
              response[self.name] = results;
              resolve(response);

            });

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

      //validate parameters
      var obj = (req.body && req.body.attributes) ? req.body.attributes : {};

      //add record to the database
      self.model.create(obj)

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

      //validate parameters
      var obj = (req.body && req.body.attributes) ? req.body.attributes : {};

      //make sure the id is present
      if (!obj.id) {
        next({success: false, message: "Updates require you pass the \"id\" field..."});
        return;
      }

      //update database record
      self.model.update({id: obj.id}, obj)
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

      //make sure the id is present
      if (!params.id) {
        next({success: false, message: "Delete requires you pass the \"id\" field..."});
        return;
      }

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
   * Sanitize and validate the search criteria.
   *
   * @param req
   * @returns {Promise}
   */

  sanitizeCriteria: function(req) {

    //maintain reference to instance
    var self = this;

    //return bluebird promise
    return new Promise(function(resolve, reject) {

      //attempt to capture the where parameter
      var where = req.param('where');

      if( where ) {

        //attempt to convert where clause to object if its a string
        if(_.isString(where)){
          try {
            where = JSON.parse(where);
          } catch(e) {
            reject(new SuperJS.Error('invalid_where', 422, 'The where parameter provided was not valid JSON.'));
          }
        }

      } else {

        //build search criteria from passed parameters
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
        if( !self.isValidAttribute(attribute) ) {
          reject(new SuperJS.Error('invalid_attribute', 422, attribute+' is not a valid attribute.'));
        }
      }

      return resolve(where);

    });

  },

  /**
   * Sanitize and validate the sort parameter.
   *
   * @param req
   * @returns {Promise}
   */

  sanitizeSort: function(req) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      var sort = req.param('sort');
      if( sort ) {

        //split the sort parameter to obtain the attribute and direction
        var sortBy = sort.split(" ");

        //check the attribute
        if( !self.isValidAttribute(sortBy[0]) ) {
          return reject(new SuperJS.Error('invalid_sort_attribute', 422, sortBy[0]+' is not a valid attribute.'));
        }

        //check the direction
        if( sortBy.length <= 1 || (sortBy[1] !== 'asc' && sortBy[1] !== 'desc') ) {
          return reject(new SuperJS.Error('invalid_sort_direction', 422, sortBy[1]+' is not a valid sort direction.'));
        }
      }

      resolve(sort);
    });
  },

  sanitizeLimit: function(req) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      //set limit and skip parameters
      var limit = req.param('limit') || 25;

      resolve(limit);

    });

  },

  sanitizeSkip: function(req) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      var skip = req.param('skip') || 0;

      resolve(skip);

    });
  },

  isValidAttribute: function(attribute) {

    if( Object.keys(this.model._attributes).indexOf(attribute) === -1 ) {
      return false
    } else {
      return true;
    }

  },

  /**
   * Loop through errors returned from waterline and populate an
   * error array for clean consistent responses.
   *
   * @param wlErrors
   * @returns {Object}
   */

  parseWlErrors: function(wlError) {

    this.app.log.error('waterline errors:',wlError);

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
