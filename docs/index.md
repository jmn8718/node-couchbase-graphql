# Introduction
We are going to develop a [Graphql](http://graphql.org/) server in nodejs with express.
Graphql is a query language for APIs, and it help us to fetch only the data that we define avoiding overfetching.
With the server we are going to query and create *Places*.
To store the data we are going to use couchbase and we are going to use Spartial views to query the Places by its geographical location.
I wrote a previous [post](https://blog.couchbase.com/2017/february/develop-a-rest-api-with-couchbase-ottoman-nodejs-hapijs) about node and couchbase, so I will skip the configuration of the db that I wrote in the previous post.

# Requirements
You need to have installed in your computer:
- nodejs
- couchbase server
You can find the code in the [github repo](https://github.com/jmn8718/node-couchbase-graphql.git).

# Spatial View
First of all we need to create the spartial view.
We go to the admin page, in my case http://localhost:8091/ and log in with my user and password.
Then click on **Data Buckets** and create a bucket, i called it *graphql*.
After that we click on **View**, then we click on **Create Development Spartial View**, and we type the values.
![graphic interface](./docs/create_view.png)
I used *place_by_location* in both **Design Document Name** and **View Name**. Now click on **edit**, and add the following code
```
function (doc) {
  if (doc._type === 'Place' && doc.location) {
    emit([{
      "type": "Point",
      "coordinates": [doc.location.lon, doc.location.lat]
    }], doc);
  }
}
```
and click on **Save**.
Here you can also test the view with the documents on the bucket.

# Place Model
For our places, we are going to store the name of the place and a description as string.
Like we want to use the SpartialView that couchbase provide as, we are going to store the location of the place in an object called *location* where we are going to store the latitude and longitude.
Also we will set by default the created date when we add the place.
```
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
```

For the spartial query, we are going to define a function that will perform a spartial query, for that we are going to create an spartial query using the package couchbase.
```
const queryByLocation = (bbox = [0, 0, 0, 0], next) => {
  const query = couchbase.SpatialQuery.from('dev_place_by_location', 'place_by_location').bbox(bbox);
  bucket.query(query, next);
}
```
In the *from* function, we have to provide the *design document name* and the *view name*. Then in the bbox, we need to provide the array of 4 floats **[ min Longitude , min Latitude , max Longitude , max Latitude ]**.
The last step is to perform the query in the bucket.

# Graphql Server
We are going to use an express server and the package express-graphql.
We import the schema of our graphql server that we are going to define later.
```
const express = require('express');
const graphqlHTTP = require('express-graphql');

const PORT = process.env.PORT || 5000;

const schema = require('./schemas');

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

// start server
const server = app.listen(PORT, () => {
  console.log(`Server started at ${ server.address().port }`);
});
```
In the graphql server, we are going to use the route */graphql*. And we are going to set some option, like graphiql, that will provide us a graphic interface to execute queries.
The last step is start our express server.

# Graphql Schemas
Graphql queries and mutations rely on the schemas that we define. So we have to create an schema for our Place object.
First we are going to define a Schema for *Location*.
```
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
```
We need to import the types from *graphql* package. In our schema we can define a name and a description, this fields are useful to documentate our queries, so the user can now what that field means.
Then we have to define *fields*, where we are going to specify the fields inside our schema, in this case, we have defined *lat* and *lon*. In every field we have to specify the type, in this case, these fields are float values, and they are required, so we use *GraphQLNonNull*  and  the type *GraphQLFloat*. We add a description so we can now what they mean.

Now we are going to define the schema **Place**.
Here we are going to import the types from *graphql* and the schema *Location* that we have defined.
```
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
```
We are matching the fields from the model, so we do not have to provide the resolve function. Only for the field *id*, because couchbase return the value in the field **_id**.

# Graphql Query
Query is the way that we retrieve data for the server.
The query object is also an schema, like the previous ones. In this case the fields are the queries we allow the user to perform. We are going to define 3 types of query.

## allPlaces
In this query we are going to query for all the places in the database, and we are going to order them by the created field, so we return first the newest places.
Like we are going to return an array of Places, we assign to **type** the type *GraphQLList* and we provide the *Place schema*
```
...

const PlaceSchema = require('./place');
const Place = require('../models/place');

...

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
}
```
We also add a description, this field is optional.
The last parameter is a function, that is the resolve function, that will specify how we are going to retrieve the data for our database. As our calls to the database are asynchronous, we are going to return a promise, that is going to use the Place model that we defined with ottoman. With the model we use find to query for documents, and we pass as the first parameter an empty object, because we want to query all the documents; The second parameter is the options of our query, in this case we are going to order by the field *created* in descending order. Finally we provide the callback function that will resolve the promise with the values, or reject it in case of an error.

## Places
In this query we are goint to query using the Spartial view, so we have to pass the boundary box points in the parameter of the query.
```
...

const queryByLocation = require('../models/place').queryByLocation;
...

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
      args.minLat,
      args.maxLon,
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
}
```
First we import the function that we defined to perform the spartial query.
As the previous query, we define the type as an array of places, and add a description.
In this query, we need some parameter, so we define the args, that refers to the parameter; Each value insite *args* correspond with the parameters, in this case we define 4, **minLon, maxLon, minLat, maxLat** and for all of them we are going to define the type as required and floats.
In this case, the resolve function is also a promise. First we build the bbox array to pass the function *queryByLocation*. In case of an error, we will reject the promise with an error; In case of success, we need to map the object from the db, because the spartial view returns the geopoint and value, where we are returning the full document, it will change if we define a different spartial view.

## Place
The last query that we are going to define, is the one to query for one place by its id.
```
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
```
In this case, the type is the *Place schema*, in the args, we only need to define the **id** and we set it to string and required.
The resolve function, again is a promise, in this case we are going to use the function *queryById* from the model, and we pass the *id* value from the args object.

# Graphql Mutation
With mutations we can modify the data in our server. As the query, mutations object are schemas. So we have to define the same fields as the previous schemas.
When we perform the mutation query we provide the values between parenthesis, and like the queries, we provide the values we want to retrieve of the modified object;
Here we are going to perform the creation, update and delete of Places.

## createPlace
In this mutation we are going to create a new place.
In the type of the schema we are going to define it as PlaceSchema, because we are going to return the created Place.
```
createPlace: {
  type: PlaceSchema,
  description: 'Create a place',
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
      type: new GraphQLNonNull(GraphQLFloat),
      description: 'Latitude of the place',
    },
    longitude: {
      type: new GraphQLNonNull(GraphQLFloat),
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
},
```
Like the queries, we define the args with the values that we require to create a new Place. In this case we require name and description as strings, and latitude and longitude as floats, all fields are going to be required.
In the resolve function, we are going to return a promise. Inside the promise we are going to create the place with the values of the query inside *args*. Then we are going to perform *save* on the place object. Finally, in case of an error saving the place, we are going to reject the promise with the error, or we are going to resolve the promise with the place data.

## updatePlace
As in the createPlace mutation, the updatePlace mutation is similar, the differences are that in this case, all the values in the args are not required, and the id field is a required string; And in the resolve function, first we are going to look for the object by the *id*, then we check the fields provided by the user and update the place, and finally we save it, and return the new object
```
updatePlace: {
  type: PlaceSchema,
  description: 'Update a place',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Id of the place',
    },
    name: {
      type: GraphQLString,
      description: 'Name of the place',
    },
    description: {
      type: GraphQLString,
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
      Place.getById(args.id, (err, place) => {
        if (err) {
          reject(err);
        } else {
          if (args.name) {
            place.name = args.name;
          }
          if (args.description) {
            place.name = args.name;
          }
          if (args.latitude) {
            place.location.lat = args.latitude;
          }
          if (args.longitude) {
            place.location.lon = args.longitude;
          }
          place.save((err) => {
            if (err) {
              reject(err);
            }
            resolve(place);
          });
        }
      })
    });
  }
}
```

## deletePlace
The last mutation is the delete, here we define a type of *PlaceSchema*, because we are going to return the object we delete.
In the args, we only need to define the *id* of the place to delete.
In the resolve function, we are going to return a Promise that is going to search for the place by id, and the perform the remove. We will reject the promise in case the place is not found or if there is an error while removing it; Or we are going to resolve the promise with the place data in case we remove it successfully.
```
deletePlace: {
  type: PlaceSchema,
  description: 'Delete a place',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Id of the place',
    },
  },
  resolve(source, args) {
    return new Promise((resolve, reject) => {
      Place.getById(args.id, (err, place) => {
        if (err) {
          reject(err);
        } else {
          place.remove((err) => {
            if (err) {
              reject(err);
            }
            resolve(place);
          });
        }
      })
    });
  }
}
```

# Test
To test our app, we are going to use Graphiql, that we allow in our server, for that we have to visit http://localhost:5000/graphql
![graphiql](./docs/graphiql.png)
In this page, we can perform the queries and mutations that we defined previously.

## Create
```
mutation {
  createPlace(
    name: "testplace"
    description: "testdescription"
    latitude: 1.36
    longitude: 18.36
  ) {
    id
  }
}
```
![mutation_create](./docs/mutation_create.png)

## Update
```
mutation {
  updatePlace(
    id: "41133f98-18e8-4979-89e0-7af012b0e14f"
    name: "updateplace"
    description: "updatedescription"
    latitude: 2.36
    longitude: 15.96
  ) {
    id
    name
    description
  }
}
```
![mutation_update](./docs/mutation_update.png)

## Delete
```
mutation {
  deletePlace(id: "41133f98-18e8-4979-89e0-7af012b0e14f") {
    id
  }
}
```
![mutation_delete](./docs/mutation_delete.png)

## Query All
```
query {
  allPlaces {
    id
    name
    location {
      lat
      lon
    }
  }
}
```
![query_all](./docs/query_all.png)

## Query by boundary box
```
query {
  Places(
    minLon: 3
    maxLon: 5
    minLat: 49
    maxLat: 51
  ) {
    name
    location {
      lat
      lon
    }
  }
}
```
![query_bbox](./docs/query_bbox.png)

## Query a place by id
```
mutation {
  deletePlace(id: "41133f98-18e8-4979-89e0-7af012b0e14f") {
    id
  }
}
```
![query_id](./docs/query_id.png)

# Conclusion
Graphql is a good query language that allow us to query only for the information that we define, so we can avoid underfetching or overfetching, and we can be sure that we always have the data.
In a Graphql server, the clients only use one single endpoint, so it hides the complexity and logics of the backend, so the server can connect to different backends, or use different databases, and if they change, the clients logic do not have to change because the endpoint is the same.
Also we have seen how to perform geographical query in our data with couchbase.

# References
- [Code](https://github.com/jmn8718/node-couchbase-graphql.git)
- [Graphql](http://graphql.org/)
- [Couchbase Spartial View](https://developer.couchbase.com/documentation/server/current/indexes/querying-using-spatial-views.html)
- [Boundary box](http://wiki.openstreetmap.org/wiki/Bounding_Box)
