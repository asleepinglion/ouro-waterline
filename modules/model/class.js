"use strict";

var SuperJSApi = require('superjs-api');
var Promise = require('bluebird');

module.exports = SuperJSApi.Model.extend({

  adapter: 'waterline',

  init: function(adapter) {

    this._super(adapter.app);

    //store reference to self
    var self = this;

    //provide access to the waterline collection model
    adapter.on('connected', function(collections) {
      self.db = collections[self.name];
    });
  },

  find: function(criteria) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      return self.db.find(criteria)

        .then(function(results) {

          //process results before returning them to the controller
          self.processResults(results);

          //resolve results
          resolve(results);
        })
        .catch(function(err) {
          reject(err);
        });

    });

  },

  findOne: function(criteria) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      return self.db.findOne(criteria)

        .then(function(results) {

          //process results before returning them to the controller
          self.processResults(results);

          //resolve results
          resolve(results);
        })
        .catch(function(err) {
          reject(err);
        });

    });
  },

  create: function(criteria) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      return self.db.create(criteria)

        .then(function(results) {

          //process results before returning them to the controller
          self.processResults(results);

          //resolve results
          resolve(results);
        })
        .catch(function(err) {
          reject(err);
        });

    });
  },

  update: function(searchCriteria, values) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      //execute waterline update with provided criteria and values
      self.db.update(searchCriteria, values)
        .then(function(results) {

          //process results before returning them to the controller
          self.processResults(results);

          //resolve results
          resolve(results);
        })
        .catch(function(err) {
          reject(err);
        })
    });

  },

  destroy: function(criteria) {
    return this.db.destroy(criteria);
  },

  //process results returned from waterline before returning to the controller
  processResults: function(results) {

    //maintain reference to instance
    var self = this;

    //map the results
    results.map(function(result) {

      //map the attributes for this model
      Object.keys(self.attributes).map(function(attribute) {

        //if the attribute is an object/json and the value is currently a string
        if( self.attributes[attribute].type &&
          (self.attributes[attribute].type === 'object' || self.attributes[attribute].type === 'json') &&
          typeof result[attribute] === 'string' ) {

            //attempt to convert into native objects
            try {
              result[attribute] = JSON.parse(result[attribute]);
            } catch(e) {
              //if not valid json, do nothing with the result
            }
        }

      });

    });
  }

});