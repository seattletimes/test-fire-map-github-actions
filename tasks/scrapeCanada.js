/*
For more information about how Grunt passes in options, and how you can access them, see the Grunt docs
@link https://gruntjs.com/api/grunt.option
Lots of flags available on this one:
--date=M/D/YYYY - pull data for this date (and the previous day)
  By default the rig will use today's date
--test - Ask the AP for test data
--offline - Use cached data if it exists
--archive - Set the "live" flag to false for all race JSON
*/

// this global stuff allows leaflet to run on the backend//
global.window = { screen: {} }
global.document = {
  documentElement: { style: {} },
  getElementsByTagName: () => { return [] },
  createElement: () => { return {} }
}
global.navigator = { userAgent: 'nodejs', platform: 'nodejs' }

const fetch = require("node-fetch");
const L = require("leaflet");
L.Proj = require('proj4leaflet');

//2021 version//
// const bc_endpoint = 'https://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&outputFormat=application%2Fjson';

//2022 version//
const bc_endpoint = 'http://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&outputFormat=json'

module.exports = function(grunt) {


  var serialize = d => JSON.stringify(d, null, 2);

  function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
  }


  var myCRS = new L.Proj.CRS("EPSG:3005","+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 +x_0=1000000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");


  function coordsToLatLng(coords) {
    var latLng = myCRS.unproject(L.point(coords[0], coords[1]));
    return latLng;
  };


  /**
   * More information about working "inside" grunt tasks
   * @link https://gruntjs.com/inside-tasks
   */
  grunt.registerTask("scrapeCanada", function() {
    var nameArray = grunt.data.fireNames.names;
    // grunt.task.requires("json"); // we need the schedule sheet

    // Tell Grunt that this task as asynchronous: https://gruntjs.com/inside-tasks#this.async
    var done = this.async();

        fetch(bc_endpoint)
        .then((resp) => resp.json())
        .then(async function(results) {

          const only_active_fires = results.features.filter(result => result.properties.FIRE_STATUS != "Out");

          only_active_fires.forEach(function(f) {
            var featureName = f.properties.FIRE_OF_NOTE_NAME;
            featureName = (featureName != null) ? toTitleCase(featureName.trim()) : "";
            if((f.properties.FIRE_OF_NOTE_NAME != null) && (!nameArray.includes(featureName))) {
              nameArray.push(featureName);
            }
          });

          console.log("success");

          var myLayer = L.geoJSON(only_active_fires, {
            coordsToLatLng: coordsToLatLng
          });

          var newLayerFormat = myLayer.toGeoJSON();
          const newLayerFormat_results = serialize(newLayerFormat);
          grunt.file.write("src/js/fire_data/bc_layer.geo.json", newLayerFormat_results);
        })
        .then(done)
        .catch(err => console.log(err));
  });
};
