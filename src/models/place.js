'use strict';

const couchbase = require('couchbase');
const{
  ottoman,
  bucket,
} = require('../db');

const PlaceModel = ottoman.model('Place', {
  name: 'string',
  description: 'string',
  location: {
    lat: 'number',
    lon: 'number'
  },
  created: {
    type: 'Date',
    default: Date.now
  }
});

// bbox = [ min Longitude , min Latitude , max Longitude , max Latitude ]
const queryByLocation = (bbox = [0, 0, 0, 0], next) => {
  const query = couchbase.SpatialQuery.from('dev_place_by_location', 'place_by_location').bbox(bbox);
  bucket.query(query, next);
}

ottoman.ensureIndices(function(err) {
  if (err) {
    return console.error('Error ensure indices Places', err);
  }
  console.log('Ensure indices Places');
});

module.exports = PlaceModel;
module.exports.queryByLocation = queryByLocation;
