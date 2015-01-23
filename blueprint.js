module.exports = {

  extends: 'node_modules/superjs/modules/base',
  description: 'The Waterline controller blueprint describes the essential CRUD methods for the Waterline ORM.',
  actions: {

    search: {

      description: "Search the database records...",

      params: {

        where: {
          description: 'The where parameter allows you to filter records using the Waterline query language.',
          type: 'object',
          default: {},

          transform: {
            object: true
          },
          validate: {
          }
        },

        sort: {
          description: 'The sort parameter allows you to sort records using standard SQL notation (e.g. field ASC).',
          default: "",
          type: 'string',
          validate: {
            sortAttribute: true, //validate sort attribute
            sortDirection: true //validate the sort direction
          }
        },

        limit: {
          description: 'The limit parameter allows you specify the number of results to return.',
          type: 'integer',
          default: 25,
          validate: {
            min: 0,
            max: 1000
          }
        },

        skip: {
          description: 'The skip parameter allows you to page results in conjunction with the limit parameter.',
          type: 'integer',
          default: 0,
          validate: {
            min: 0
          }
        }

      }

    },

    create: {

      description: "Create a new database record...",

      params: {

        attributes: {
          description: 'The attributes for the record you wish to create.',
          type: 'object',
          //default: {},
          transform: {
            json: true
          },
          model: true
        }

      }
    },

    update: {

      description: "Update a database record...",

      params: {

        attributes: {
          description: 'The attributes for the record you wish to update.',
          type: 'object',
          transform: {
            json: true
          },
          model: true
        }

      }
    },

    delete: {

      description: "Delete a new database record...",

      params: {

        id: {
          description: 'The attributes for the record you wish to delete.',
          type: 'integer'
        }

      }
    }

  }
};
