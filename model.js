"use strict";

var SuperJS = require('superjs');

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
    return this.engine.find(criteria);
  },

  findOne: function(criteria) {
    return this.engine.findOne(criteria);
  },

  create: function(criteria) {
    return this.engine.create(criteria);
  },

  update: function(searchCriteria, values) {
    return this.engine.update(searchCriteria, values);
  },

  destroy: function(criteria) {
    return this.engine.destroy(criteria);
  }

});