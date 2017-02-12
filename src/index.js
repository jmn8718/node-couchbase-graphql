'use strict';

const express = require('express');
const graphqlHTTP = require('express-graphql');
const cors = require('cors');

const PORT = process.env.PORT || 5000;

const schema = require('./schemas');

const app = express();

app.use(cors());
app.use('/graphql', graphqlHTTP({
  schema: schema,
  pretty: true,
  graphiql: true,
}));

// start server
const server = app.listen(PORT, () => {
  console.log(`Server started at ${ server.address().port }`);
});

module.exports = server;
