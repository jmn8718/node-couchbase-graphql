'use strict';

const {
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
} = require('graphql');

const PlaceSchema = require('./place');
const Place = require('../models/place');
const queryByLocation = require('../models/place').queryByLocation;

const Query = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query object',
  fields: {
    allPlaces: {
      type: new GraphQLList(PlaceSchema),
      description: 'Query for all places',
      resolve(root, args) {
        return new Promise((resolve, reject) => {
          Place.find({}, {
            sort: {
              created: -1
            },
          }, (err, places) => {
            if (err) {
              reject(err);
            }
            resolve(places);
          })
        });
      }
    },
    Places: {
      type: new GraphQLList(PlaceSchema),
      description: 'Query for all places inside the boundary box',
      args: {
        minLon: {
          type: new GraphQLNonNull(GraphQLFloat),
          description: 'Min Longitude of the boundary box',
        },
        maxLon: {
          type: new GraphQLNonNull(GraphQLFloat),
          description: 'Max Longitude of the boundary box',
        },
        minLat: {
          type: new GraphQLNonNull(GraphQLFloat),
          description: 'Min Latitude of the boundary box',
        },
        maxLat: {
          type: new GraphQLNonNull(GraphQLFloat),
          description: 'Max Latitude of the boundary box',
        },
      },
      resolve(root, args) {
        // bbox = [ min Longitude , min Latitude , max Longitude , max Latitude ]
        const bbox = [
          args.minLon,
          args.maxLon,
          args.minLat,
          args.maxLat,
        ];
        return new Promise((resolve, reject) => {
          queryByLocation(bbox, (err, places) => {
            if (err) {
              reject(err);
            }
            resolve(places.map((place) => place.value));
          })
        });
      }
    },
    Place: {
      type: PlaceSchema,
      description: 'Query for a place by the place id',
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'Place id',
        }
      },
      resolve(root, args) {
        return new Promise((resolve, reject) => {
          Place.getById(args.id, (err, place) => {
            if (err) {
              reject(err);
            }
            resolve(place);
          });
        });
      }
    }
  }
});

module.exports = Query;
