"use strict";

var SuperJS = require('superjs');
SuperJS.Api = require('superjs-api');

var _ = require('underscore');
var Promise = require('bluebird');

module.exports = SuperJS.Api.Controller.extend({


  _metaFile: function() {
    this._super();
    this._loadMeta(__filename);
  },

  init: function(app) {

    //call base class constructor
    this._super.apply(this,arguments);

    //mark controller as rest enabled
    this.restEnabled = true;

    //maintain a reference to models
    this.models = app.models;

    //set the model for this controller
    if( this.models[this.name] ) {
      this.model = this.models[this.name];
    }

  },

  search: function(resolve, reject, req) {

    //maintain reference to instance
    var self = this;

    //setup parameter defaults
    req.parameters.where = (typeof req.parameters.where === 'object') ? req.parameters.where : {};
    req.parameters.sort = (typeof req.parameters.sort === 'string' && req.parameters.sort.length > 0 ) ? req.parameters.sort : undefined;
    req.parameters.limit = (typeof req.parameters.limit === 'number') ? req.parameters.limit : undefined;
    req.parameters.skip = (typeof req.parameters.skip === 'number' ) ? req.parameters.skip : undefined;
    req.parameters.join = (typeof req.parameters.join === 'object') ? req.parameters.join : {};

    //create promise to find records
    var searchPromise = self.model.find({where: req.parameters.where, sort: req.parameters.sort, limit: req.parameters.limit, skip: req.parameters.skip});

    //specify joins to populate
    for( var join in req.parameters.join ) {
      searchPromise.populate(join, req.parameters.join[join]);
    }

    //handle the results or catch errors
    searchPromise.then(function(results) {

      //process results
      self.model.processResults(results);

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
  },

  create: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      //add record to the database
      self.model.create(self.parameter(req, 'attributes'))

        .then(function(results) {

          //process results
          self.model.processResults(results);

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

  update: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      self.model.update({id: self.parameter(req,'attributes.id')}, self.parameter(req,'attributes'))
        .then(function (results) {

          //process results
          self.model.processResults(results);

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

  delete: function(req) {

    //maintain reference to instance
    var self = this;

    //return promise to resolve or reject
    return new Promise(function(resolve, reject) {

      //validate parameters
      var params = req.body || {};

      //mark record as deleted
      self.model.update({id: params.id}, {isDeleted: true})
        .then(function (results) {

          //process results
          self.model.processResults(results);

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

  parseWlErrors: function(wlError) {

    this.app.log.error('waterline errors:');
    this.app.log.object(wlError.stack);

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
