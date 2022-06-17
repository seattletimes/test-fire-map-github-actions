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

const fetch = require("node-fetch");

// const api_endpoint = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/Current_WildlandFire_Perimeters/FeatureServer/0/query?where=1=1+AND+irwin_POOState=%27US-WA%27&outFields=*&f=geojson';

//const api_endpoint = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/Current_WildlandFire_Perimeters/FeatureServer/0/query?where=1=1+AND+irwin_POOState=%27US-WA%27+OR+irwin_POOState=%27US-OR%27&outFields=*&f=geojson";

const little_fires_endpoint = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/Current_WildlandFire_Locations/FeatureServer/0/query?where=1=1+AND+POOState=%27US-WA%27+OR+POOState=%27US-OR%27&outFields=*&f=geojson';
// const bc_endpoint = 'https://openmaps.gov.bc.ca/geo/pub/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=pub%3AWHSE_LAND_AND_NATURAL_RESOURCE.PROT_CURRENT_FIRE_POLYS_SP&outputFormat=application%2Fjson';



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


  /**
   * More information about working "inside" grunt tasks
   * @link https://gruntjs.com/inside-tasks
   */
  grunt.registerTask("scrapeLittleFires", function() {

    var nameArray = grunt.data.fireNames.names;

    // Tell Grunt that this task as asynchronous: https://gruntjs.com/inside-tasks#this.async
    var done = this.async();

        fetch(little_fires_endpoint)
        .then((resp) => resp.json())
        .then(async function(results) {

          results.features.forEach(function(f) {
            var featureName = f.properties.IncidentName;
            featureName = (featureName != null) ? toTitleCase(featureName.trim()) : "";
            if( (f.properties.IncidentName != null) && (!nameArray.includes(featureName))){
              nameArray.push(featureName);
            }
          });

          console.log("success");
          const new_little_results = serialize(results);
          grunt.file.write("src/js/fire_data/wa_little_fires.geo.json", new_little_results);

        })
        .then(done)
        .catch(err => console.log(err));

  });
};
