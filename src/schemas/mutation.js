'use strict';

const {
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} = require('graphql');

const LocationSchema = require('./location');
const PlaceSchema = require('./place');
const Place = require('../models/place');

const Mutation = new GraphQLObjectType({
  name: 'Mutations',
  description: 'Functions to set stuff',
  fields: {
    createPlace: {
      type: PlaceSchema,
      description: 'Create a new place',
      args: {
        name: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Name of the place',
        },
        description: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Description of the place',
        },
        latitude: {
          type: GraphQLFloat,
          description: 'Latitude of the place',
        },
        longitude: {
          type: GraphQLFloat,
          description: 'Longitude of the place',
        }
      },
      resolve(source, args) {
        return new Promise((resolve, reject) => {
          const place = new Place({
            name: args.name,
            description: args.description,
            location: {
              lat: args.latitude,
              lon: args.longitude,
            },
          });
          place.save((err) => {
            if (err) {
              reject(err);
            }
            resolve(place);
          })
        });
      }
    }
  }
});

module.exports = Mutation;
