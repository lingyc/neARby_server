var request = require('request');
var initLon = null;
var initLat = null;

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// calculates the total distance
function hypotenuseDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000; // Radius of the earth in m
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in m
  return d;
}

// calculates the x distance
function findXDistance(initLat, newLat) {
  return (newLat - initLat) * 111230;
}

function square(number) {
  return number * number;
}

// calculates the y distance using Pythagorean Theorem
function findYDistance(hypotenuse, xDistance, initLon, newLon) {
  var yDistance = Math.sqrt(square(hypotenuse) - square(xDistance));
  return (newLon - initLon > 0 ) ? yDistance : -1 * yDistance;
}

function getPlaces(req, res) {
  // check to see if it is the initial location
  if (req.body.threejsLat === 0 && req.body.threejsLon === 0) {
    // if so recored the initial position
    initLat = req.body.latitude;
    initLon = req.body.longitude;
  }
  var googleType = '';
  var googleKeyword = '';
  var googleOpenNow = '';
  if (req.body.type !== undefined) {
    googleType = `&type=${req.body.type}`;
  }
  if (req.body.keyword !== undefined) {
    googleKeyword = `&keyword=${req.body.keyword}`;
  }
  if (req.body.openNow !== undefined) {
    googleOpenNow = '&opennow';
  }
  // call to google API to get locations around
  var radius = 1000;
  var apiKey = 'AIzaSyDXk9vLjijFncKwQ-EeTW0tyiKpn7RRABU';
  var link = `https://maps.googleapis.com/maps/api/place/search/json?location=${req.body.latitude},${req.body.longitude}&radius=${radius}${googleKeyword}${googleOpenNow}${googleType}&key=${apiKey}`;
  return new Promise((resolve, reject) => {
    request(link, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var placesObj = [];
        var googleResults = JSON.parse(body);
        // iterate over the get request to extract data we want
        googleResults.results.forEach(function(result, index) {
          // calculate each of the distances in meters
            var googleLat = findXDistance(initLat, result.geometry.location.lat);
            var distanceFromInit = hypotenuseDistance(initLat, initLon, result.geometry.location.lat, result.geometry.location.lng);
            var googleDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, result.geometry.location.lat, result.geometry.location.lng);
            var googleLon = findYDistance(distanceFromInit, googleLat, initLon, req.body.longitude);
            googleDistance = Math.floor(googleDistance * 3.28084);
            // populate an object with all necessary information
            var place = {
            name: result.name,
            lat: googleLat,
            lon: googleLon,
            distance: googleDistance,
            img: result.icon,
            };
            placesObj.push(place);
        });

        // send back data to client side
        resolve(res.send(placesObj));
      }
    });
  });
}

function getEvents(req, res) {
  if (req.body.threejsLat === 0 && req.body.threejsLon === 0) {
    // if so recored the initial position
    initLat = req.body.latitude;
    initLon = req.body.longitude;
  }
  var date = 'Future';
  var eventsApiKey = 'CbNBBV9Qm4wTwMpg';
  var radius = 1;
  var eventsApiLink = `http://api.eventful.com/json/events/search?...&location=${req.body.latitude},${req.body.longitude}&within=${radius}&units=miles&date=${date}&app_key=${eventsApiKey}`;
  // http://api.eventful.com/json/events/search?...&location=37.783537,-122.409003&within=.25&units=miles&date=Future&CbNBBV9Qm4wTwMpg
  // http://api.eventful.com/json/events/search?...&location=37.783537,-122.409003&within=.25&units=miles&date=Future&app_key=CbNBBV9Qm4wTwMpg
  return new Promise((resolve, reject) => {
    request(eventsApiLink, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var eventObj = [];
        var eventsResults = JSON.parse(body);

        eventsResults.events.event.forEach(function(event) {
          var eventLat = findXDistance(initLat, event.latitude);
          var distanceFromInit = hypotenuseDistance(initLat, initLon, event.latitude, event.longitude);
          var eventDistance = hypotenuseDistance(req.body.latitude, req.body.longitude, event.latitude, event.longitude);
          var eventLon = findYDistance(distanceFromInit, eventLat, initLon, req.body.longitude);
          eventDistance = Math.floor(eventDistance * 3.28084);

          var place = {
          name: event.title,
          lat: eventLat,
          lon: eventLon,
          distance: eventDistance,
          };
          eventObj.push(place);
        });
        resolve(res.send(eventObj));
      }
    });

  });
}

module.exports = {
  getPlaces,
  getEvents
};
