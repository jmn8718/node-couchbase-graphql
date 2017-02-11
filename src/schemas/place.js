'use strict';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const LocationSchema = require('./location');

const PlaceSchema = new GraphQLObjectType({
  name: 'Place',
  description: 'Place description',
  fields: {
    id: {
      type: GraphQLString,
      resolve(place) {
        return place._id;
      }
    },
    name: {
      type: GraphQLString,
    },
    description:{
      type: GraphQLString,
    },
    location: {
      type: LocationSchema,
    },
    created: {
      type: GraphQLString,
    }
  }
});

module.exports = PlaceSchema;
