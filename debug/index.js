'use strict';
var mapboxgl = require('mapbox-gl');
var insertCss = require('insert-css');
var fs = require('fs');

mapboxgl.accessToken = window.localStorage.getItem('MapboxAccessToken');


var meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'initial-scale=1,maximum-scale=1,user-scalable=no';
document.getElementsByTagName('head')[0].appendChild(meta);

insertCss(fs.readFileSync('./lib/mapbox-gl-geocoder.css', 'utf8'));
insertCss(
  fs.readFileSync('./node_modules/mapbox-gl/dist/mapbox-gl.css', 'utf8')
);

var MapboxGeocoder = require('../');

var mapDiv = document.body.appendChild(document.createElement('div'));
mapDiv.style.position = 'absolute';
mapDiv.style.top = 0;
mapDiv.style.right = 0;
mapDiv.style.left = 0;
mapDiv.style.bottom = 0;

var map = new mapboxgl.Map({
  container: mapDiv,
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [-79.4512, 43.6568],
  zoom: 13
});

var coordinatesGeocoder = function(query) {
  var matches = query.match(/^[ ]*(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)[ ]*$/);
  if (!matches) {
    return null;
  }
  function coordinateFeature(lng, lat) {
    var lng = Number(lng);
    var lat = Number(lat);
    return {
      center: [lng, lat],
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      place_name: 'Lat: ' + lat + ', Lng: ' + lng,
      place_type: ['coordinate'],
      properties: {},
      type: 'Feature'
    };
  }
  var coord1 = matches[1];
  var coord2 = matches[2];
  var geocodes = [];
  if (coord1 < -90 || coord1 > 90) {
    // must be lng, lat
    geocodes.push(coordinateFeature(coord1, coord2));
  }
  if (coord2 < -90 || coord2 > 90) {
    // must be lat, lng
    geocodes.push(coordinateFeature(coord2, coord1));
  }
  if (geocodes.length == 0) {
    // else could be either
    geocodes.push(coordinateFeature(coord1, coord2));
    geocodes.push(coordinateFeature(coord2, coord1));
  }
  return geocodes;
};

var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  trackProximity: true,
  localGeocoder: function(query) {
    return coordinatesGeocoder(query);
  },
  language: 'en'
});

window.geocoder = geocoder;

var button = document.createElement('button');
button.textContent = 'click me';

var removeBtn = document.body.appendChild(document.createElement('button'));
removeBtn.style.position = 'absolute';
removeBtn.style.zIndex = 10;
removeBtn.style.top = '10px';
removeBtn.style.left = '10px';
removeBtn.textContent = 'Remove geocoder control';

map
  .getContainer()
  .querySelector('.mapboxgl-ctrl-bottom-left')
  .appendChild(button);
map.addControl(geocoder);

map.on('load', function() {
  button.addEventListener('click', function() {
    geocoder.query('Montreal Quebec');
  });
  removeBtn.addEventListener('click', function() {
    map.removeControl(geocoder);
  });
});

geocoder.on('results', function(e) {
  console.log('results: ', e.features);
});

geocoder.on('error', function(e) {
  console.log('Error is', e.error);
});
