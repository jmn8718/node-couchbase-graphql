GeoSpartialQuery

# Document name
place_by_location

# Name
place_by_location

#Spartial code:
```
function (doc) {
  if (doc._type === 'Place' && doc.location) {
    emit([{
      "type": "Point",
      "coordinates": [doc.location.lon, doc.location.lat]
    }], {
      "name": doc.name,
      "id": doc._id,
      "description": doc.description
    });
  }
}
```
