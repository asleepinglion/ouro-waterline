module.exports = {

  extends: 'node_modules/superjs/modules/base',
  description: 'The Waterline controller blueprint describes the essential CRUD methods for the Waterline ORM.',
  actions: {

    search: {

      security: false,

      description: "Search the {{model}} database...",

      params: {

        where: {

          description: 'The where parameter allows you to filter records using the Waterline query language.',

          transform: {
            testMethod2: true,
            testMethod1: true,
            queryOrBody: true //source the parameter from either the query string, json body, or form attributes
          },

          validate: {
            //waterlineQuery: true, //test to make sure the parameter is valid waterline query language.
            attributes: true //run model validations against the parameter contents.
          }
        },

        sort: {
          description: 'The sort parameter allows you to sort records using standard SQL notation (e.g. field ASC).',
          validate: {
            sortAttribute: true, //validate sort attribute
            sortDirection: true //validate the sort direction
          }
        },

        limit: {
          description: 'The limit parameter allows you specify the number of results to return.'
        },

        skip: {
          description: 'The skip parameter allows you to page results in conjunction with the limit parameter.'
        }

      }

    },

    create: {

      description: "Create a new {{model}} record...",

      params: {

        attributes: {
          description: 'The attributes for the record you wish to create.',

          transform: {
            queryOrBody: true //source the parameter from either the query string, json body, or form attributes
          },

          validate: {
            attributes: true //run model validations against the parameter contents.
          }

        }

      }
    }
  }
};
