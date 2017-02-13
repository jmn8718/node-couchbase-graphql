'use strict';

const config = require('./config');
const couchbase = require('couchbase');

const endpoint = config.couchbase.endpoint;
const bucket = config.couchbase.bucket;
const myCluster = new couchbase.Cluster(endpoint, function(err) {
  if (err) {
    console.log("Can't connect to couchbase: %s", err);
  }
  console.log('connected to db %s', endpoint);
});

const myBucket = myCluster.openBucket(bucket, function(err) {
  if (err) {
    console.log("Can't connect to bucket: %s", err);
  }
  console.log('connected to bucket %s', bucket);
});

let ottoman = require('ottoman');
ottoman.store = new ottoman.CbStoreAdapter(myBucket, couchbase);

module.exports = {
  bucket: myBucket,
  ottoman: ottoman,
};
