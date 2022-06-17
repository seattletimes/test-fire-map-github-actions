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

const api_endpoint = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/Current_WildlandFire_Perimeters/FeatureServer/0/query?where=1=1+AND+irwin_POOState=%27US-WA%27+OR+irwin_POOState=%27US-OR%27&outFields=*&f=geojson";

//const little_fires_endpoint = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/Current_WildlandFire_Locations/FeatureServer/0/query?where=1=1+AND+POOState=%27US-WA%27+OR+POOState=%27US-OR%27&outFields=*&f=geojson';
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

  var getDateline = function() {
  //find the current dateline
  const monthNames = [ "Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec." ];
  var now = new Date();
  var month = monthNames[now.getMonth()];
  var day = now.getDate();
  var hours = now.getHours();
  var minutes = now.getMinutes() + "";
  if (minutes.length == 1) {
    minutes = "0" + minutes;
  }
  var time;
  if ( (hours < 12) && (hours > 0) ) {
    time = hours + ":" + minutes + " a.m.";
  } else if ( hours === 12 ) {
    time = hours + ":" + minutes + " p.m.";
  } else if ( hours === 0 ) {
      time = "12:" + minutes + " a.m.";
  } else {
    time = hours - 12 + ":" + minutes + " p.m.";
  }
  return month + " " + day + ", 2022," + " at " + time;
};

  /**
   * More information about working "inside" grunt tasks
   * @link https://gruntjs.com/inside-tasks
   */
  grunt.registerTask("scrape", function() {

    // Create Array that will end up containing all the names of fires for your dropdown search
    var nameArray = grunt.data.fireNames.names;


    // Tell Grunt that this task as asynchronous: https://gruntjs.com/inside-tasks#this.async
    var done = this.async();

        fetch(api_endpoint)
        .then((resp) => resp.json())
        .then(async function(results) {

          // Where the "updated at" date comes from
          grunt.data.fires = {
            updated: getDateline()
          }

          console.log(results.features);



          results.features.forEach(function(f) {
            var featureName = f.properties.poly_IncidentName;
            featureName = (featureName != null) ? toTitleCase(featureName.trim()) : "";

            // If Name Array doesn't already hold fire name, push it in
            if( (f.properties.poly_IncidentName != null) && (!nameArray.includes(featureName)) ){
              nameArray.push(featureName);
            }
          });

          console.log("success");
          const new_results = serialize(results);
          // write API Results to geojson file in JS folder
          grunt.file.write("src/js/fire_data/wa_fires_trial.geo.json", new_results);

        })
        .then(done)
        .catch(err => console.log(err));




  });
};
