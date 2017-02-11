const Place = require('../src/models/place');

const place1 = new Place({
  name: 'p1',
  description: 'desc p1',
  location: {
    lat: 30.556,
    lon: 12.12
  }
});

place1.save((err, d) => {
  console.log(err)
});

const place2 = new Place({
  name: 'p2',
  description: 'desc p2',
  location: {
    lat: 10.556,
    lon: 25.12
  }
});

place2.save((err, d) => {
  console.log(err)
});
