# SpartialView

## Document name
place_by_location

## Name
place_by_location

## Spartial query:
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
