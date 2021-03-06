"use strict";

var OuroApi = require('ouro-api');
var Promise = require('bluebird');

module.exports = OuroApi.Model.extend({

  adapterName: 'waterline',

  _metaFile: function() {
    this._super();
    this._loadMeta(__filename);
  },

  init: function(app, adapter) {

    this._super.apply(this, arguments);

    //store reference to self
    var self = this;

    //store reference to adapter
    this.adapter = adapter;

  },

  find: function(criteria) {

   return this.db.find(criteria);

  },

  findOne: function(criteria) {
    return this.db.findOne(criteria);
  },

  create: function(criteria) {

   return this.db.create(criteria);

  },

  update: function(searchCriteria, values) {

    return this.db.update(searchCriteria, values);

  },

  destroy: function(criteria) {

    return this.db.destroy(criteria);

  },

  //process results returned from waterline before returning to the controller
  processResults: function(results) {

    //maintain reference to instance
    var self = this;

    if( Array.isArray(results) ) {

      //map the results
      results.map(function (result) {
        self.processAttributes(result);
      });

    } else {
      self.processAttributes(results);
    }
  },

  processAttributes: function(result) {

    //maintain reference to instance
    var self = this;

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
  }

});