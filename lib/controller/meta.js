module.exports = {


  description: 'The Waterline controller blueprint describes the essential CRUD methods for the Waterline ORM.',
  methods: {

    search: {

      description: "Search the database records...",
      async: true,

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
          type: 'string',
          default: "",
          validate: {
            //sortAttribute: true, //validate sort attribute
            //sortDirection: true //validate the sort direction
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
        },

        join: {
          description: 'The joins parameter allows you to specify associated data to return.',
          type: 'object',
          default: {},
          transform: {
            object: true
          },
          validate: {
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

          transform: {
            object: true
          },
          validate: {
            required: true
          },
          model: {
            defaults: true
          }
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
            object: true
          },
          validate: {
            required: true
          }
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
