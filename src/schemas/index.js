'use strict';

const {
  GraphQLSchema,
} = require('graphql');

const Query = require('./query');
const Mutation = require('./mutation');

const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});

module.exports = schema;
