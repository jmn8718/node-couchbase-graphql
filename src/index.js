'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');

const PORT = process.env.PORT || 5000;

const schema = require('./schemas');

const app = express();

app.use('/graphql', graphqlHTTP({
  schema: schema,
  pretty: true,
  graphiql: true,
}));

// start server
const server = app.listen(PORT, () => {
  console.log('Listening at port', server.address().port);
});

module.exports = server;
