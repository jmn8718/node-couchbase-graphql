'use strict';

const {
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLNonNull,
} = require('graphql');

const LocationSchema = new GraphQLObjectType({
  name: 'Location',
  description: 'Geographical location',
  fields: {
    lat: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: 'Latitude',
    },
    lon: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: 'Longitude',
    },
  }
});

module.exports = LocationSchema;
