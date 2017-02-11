'use strict';

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLNonNull,
} = require('graphql');

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
      type: new GraphQLObjectType({
        name: 'Location',
        fields: {
          lat: {
            type: GraphQLFloat,
          },
          lon: {
            type: GraphQLFloat,
          },
        }
      }),
    },
    created: {
      type: GraphQLInt,
    }
  }
});

module.exports = PlaceSchema;
