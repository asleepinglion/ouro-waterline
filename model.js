"use strict";

var SuperJS = require('superjs');
var Promise = require('bluebird');

/**
 * The Waterline model provides a common interface from SuperJS to the
 * Waterline ORM.
 *
 * @exports Model
 * @namespace SuperJS.Waterline
 * @extends SuperJS.Model
 */

module.exports = SuperJS.Model.extend({

  find: function(criteria) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      return self.engine.find(criteria)

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

    return this.engine.find(criteria);
  },

  findOne: function(criteria) {
    return this.engine.findOne(criteria);
  },

  create: function(criteria) {
    return this.engine.create(criteria);
  },

  update: function(searchCriteria, values) {

    //maintain reference to instance
    var self = this;

    return new Promise(function(resolve, reject) {

      //execute waterline update with provided criteria and values
      self.engine.update(searchCriteria, values)
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
    return this.engine.destroy(criteria);
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