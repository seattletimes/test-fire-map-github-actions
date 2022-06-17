require("component-responsive-frame/child");
require("component-leaflet-map");
var ich = require("icanhaz");

// console.log(grunt.data);

//get access to Leaflet and the map
var element = document.querySelector("leaflet-map");
var L = element.leaflet;
var map = element.map;
// L.Proj = require('proj4leaflet');

var desktop = window.innerWidth > 800 ? true : false;

function clickZoom(e) {
 map.setView(e.target.getLatLng());
}


var commafy = s => (s*1).toLocaleString().replace(/1.0+$/, "");
var ap_months = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

const hectare_to_acre = 2.47105;

function toTitleCase(str) {
return str.replace(
  /\w\S*/g,
  function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  }
);
}

function startsWithNumber(str) {
  return /^\d/.test(str);
}

// function removeSpecialCharacters(str) {
//   return string = string.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_');
// }

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}


// Large Fire Perimeters //
var templateFile = require("./popups/_popup.html");
ich.addTemplate("popup", templateFile);
var data = require("./fire_data/wa_fires_trial.geo.json");

data.features.forEach(function(f) {
  f.properties.poly_IncidentName = f.properties.poly_IncidentName != null ? toTitleCase(f.properties.poly_IncidentName.trim()) : "No assigned name";
  f.properties.poly_Acres_AutoCalc = commafy(f.properties.poly_Acres_AutoCalc.toFixed(1));
  f.properties.irwin_DailyAcres = commafy(f.properties.irwin_DailyAcres);
  f.properties.irwin_POOLandownerCategory = ((f.properties.irwin_POOLandownerCategory === "State") || (f.properties.irwin_POOLandownerCategory === "Private")) ? f.properties.irwin_POOLandownerCategory.toLowerCase() : f.properties.irwin_POOLandownerCategory;
  var lastModifiedDate = new Date(f.properties.irwin_ModifiedOnDateTime_dt);
  f.properties.irwin_ModifiedOnDateTime_dt = ap_months[lastModifiedDate.getMonth()] + " " + lastModifiedDate.getDate() + ", " + lastModifiedDate.getFullYear();
  f.properties.irwin_POOCity = f.properties.irwin_POOCity != null ? toTitleCase(f.properties.irwin_POOCity) + ", " : f.properties.irwin_POOCity;
});

var onEachFeature = function(feature, layer) {
  layer.bindPopup(ich.popup(feature.properties));
  layer._leaflet_id = "index"+feature.id;
  layer.getPopup().on('remove', function() {
    var takeOffHighlight = layer.getElement();
    takeOffHighlight.classList.remove('selected');
  });
};

function geojsonMarkerOptions(feature) {
  var featureName = feature.properties.poly_IncidentName;
  featureName = featureName.replace(/\s/g, '');
  featureName = (startsWithNumber(featureName)) ? "I" +  featureName : featureName;
  featureName = featureName.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_');
  return {
    // radius: desktop ? 5 : 8,
    fillColor: "#f03b20",
    color: "#000000",
    weight: 1,
    opacity: 0.3,
    fillOpacity: 0.7,
    className: featureName + ` index${feature.id} geojson`
    // + ` ${feature.geometry.coordinates[0]}||${feature.geometry.coordinates[1]}`
  }
};

var geojson = L.geoJson(data, {
    style: geojsonMarkerOptions,
    onEachFeature: onEachFeature
}).addTo(map);









// British Columbia Fire Perimeters //
var templateFileBC = require("./popups/_popupBC.html");
ich.addTemplate("popupBC", templateFileBC);
// var bc_data = require("./bc_fires_trial.geo.json");
var bc_data = require("./fire_data/bc_layer.geo.json");

bc_data.features.forEach(function(f) {
  f.properties.FIRE_OF_NOTE_NAME = f.properties.FIRE_OF_NOTE_NAME != null ? toTitleCase(f.properties.FIRE_OF_NOTE_NAME.trim()) : "No assigned name";
  f.properties.FIRE_SIZE_ACRES = commafy((f.properties.FIRE_SIZE_HECTARES * hectare_to_acre).toFixed(1));
  let discoveryDateArray2 = f.properties.TRACK_DATE.split("-");
  let ddYear2 = discoveryDateArray2[0];
  let ddMonth2 = parseInt(discoveryDateArray2[1]);
  ddMonth2 = ap_months[ddMonth2 - 1];
  let ddDay2 = discoveryDateArray2[2].replace(/^Z+|Z+$/g, '');
  ddDay2 = ddDay2.replace(/^0+|Z+$/g, '');
  f.properties.TRACK_DATE = ddMonth2 + " " + ddDay2 + ", " + ddYear2;
});

var onEachBCFeature = function(feature, layer) {
  layer.bindPopup(ich.popupBC(feature.properties));
  layer._leaflet_id = "index"+feature.id;
  layer.getPopup().on('remove', function() {
    var takeOffHighlight = layer.getElement();
    takeOffHighlight.classList.remove('selected');
  });
};

function geojsonBCMarkerOptions(feature) {
  // console.log(feature.properties);
  var featureName2 = feature.properties.FIRE_OF_NOTE_NAME;
  featureName2 = featureName2.replace(/\s/g, '');
  return {
    fillColor: "#f03b20",
    color: "#000000",
    weight: 1,
    opacity: 0.3,
    fillOpacity: 0.7,
    className: featureName2 + ` index${feature.id} myLayer`
  }
};

var myLayer = L.geoJSON(bc_data, {
  style: geojsonBCMarkerOptions,
  onEachFeature: onEachBCFeature
});

myLayer.addTo(map);




// British Columbia Fire Incidents //
var templateFileBCLil = require("./popups/_popupBCLil.html");
ich.addTemplate("popupBCLil", templateFileBCLil);
// var bc_data = require("./bc_fires_trial.geo.json");
var bc_little_data = require("./fire_data/bc_little_layer.geo.json");

var fireBehaivorBC = [];

bc_little_data.features.forEach(function(f) {
  f.properties.FIRE_OF_NOTE_NAME = f.properties.FIRE_OF_NOTE_NAME != null ? toTitleCase(f.properties.FIRE_OF_NOTE_NAME.trim()) : "No assigned name";
  f.properties.FIRE_SIZE_ACRES = commafy((f.properties.CURRENT_SIZE * hectare_to_acre).toFixed(1));
  //f.properties.FIRE_OF_NOTE_URL = (f.properties.FIRE_OF_NOTE_URL != null) ? f.properties.FIRE_OF_NOTE_URL : '';
  let discoveryDateArray = f.properties.IGNITION_DATE.split("-");
  let ddYear = discoveryDateArray[0];
  let ddMonth = parseInt(discoveryDateArray[1]);
  ddMonth = ap_months[ddMonth - 1];
  let ddDay = discoveryDateArray[2].replace(/^Z+|Z+$/g, '');
  ddDay = ddDay.replace(/^0+|Z+$/g, '');
  f.properties.DiscoveryDate = ddMonth + " " + ddDay + ", " + ddYear;


  fireBehaivorBC.push(f.properties.FIRE_STATUS);


});

var uniqueBC = fireBehaivorBC.filter(onlyUnique);
console.log(uniqueBC);

var onEachBC_Little_Feature = function(feature, layer) {
  layer.bindPopup(ich.popupBCLil(feature.properties));
  layer._leaflet_id = "index"+feature.id;
  layer.getPopup().on('remove', function() {
    var takeOffHighlight = layer.getElement();
    takeOffHighlight.classList.remove('selected');
  });
};

function geojsonBC_Little_MarkerOptions(feature) {
  // console.log(feature.properties);
  var featureName3 = feature.properties.FIRE_OF_NOTE_NAME;
  featureName3 = featureName3.replace(/\s/g, '');
  return {
    radius: desktop ? 5 : 8,
    fillColor: "orange",
    color: "#000000",
    weight: 1,
    opacity: 0.3,
    fillOpacity: 0.7,
    className: featureName3 + ` index${feature.id} myLittleLayer`
  }
};

var myLittleLayer = L.geoJSON(bc_little_data, {
  pointToLayer: function (feature, latlng) {
    if(feature.properties.FIRE_STATUS != "Out") { return L.circleMarker(latlng); }
  },
  className: "small_bc_fires",
  style: geojsonBC_Little_MarkerOptions,
  onEachFeature: onEachBC_Little_Feature
});

myLittleLayer.addTo(map);








// small fires //

var small_data = require("./fire_data/wa_little_fires.geo.json");
var smallTemplateFile = require("./popups/_smallPopup.html");
ich.addTemplate("popupSmall", smallTemplateFile);

var fireBehaivor = [];

small_data.features.forEach(function(f) {
  f.properties.IncidentName = f.properties.IncidentName != null ? toTitleCase(f.properties.IncidentName.trim()) : "No assigned name";
  // f.properties.IncidentName = (startsWithNumber(f.properties.IncidentName)) ? "I" +  f.properties.IncidentName : f.properties.IncidentName;
  f.properties.POOLandownerCategory = ((f.properties.POOLandownerCategory === "State") || (f.properties.POOLandownerCategory === "Private")) ? f.properties.POOLandownerCategory.toLowerCase() : f.properties.POOLandownerCategory;
  var lastModifiedDate = new Date(f.properties.ModifiedOnDateTime_dt);
  f.properties.ModifiedOnDateTime_dt = ap_months[lastModifiedDate.getMonth()] + " " + lastModifiedDate.getDate() + ", " + lastModifiedDate.getFullYear();
  f.properties.PercentContained = f.properties.PercentContained != null ? f.properties.PercentContained + "%" : "N/A";
  f.properties.POOCity = f.properties.POOCity != null ? toTitleCase(f.properties.POOCity) + ", " : f.properties.POOCity;

  fireBehaivor.push(f.properties.FireBehaviorGeneral);
});



var unique = fireBehaivor.filter(onlyUnique);

console.log(unique);


var onEachSmallFeature = function(feature, layer) {
  layer.bindPopup(ich.popupSmall(feature.properties));
  layer._leaflet_id = "index"+feature.id;
  layer.getPopup().on('remove', function() {
    var takeOffHighlight = layer.getElement();
    takeOffHighlight.classList.remove('selected');
  });
};




function geojsonMarkerSmallOptions(feature) {

  var featureName4 = feature.properties.IncidentName;
  featureName4 = featureName4.replace(/\s/g, '');
  featureName4 = (startsWithNumber(featureName4)) ? "I" +  featureName4 : featureName4;
  featureName4 = featureName4.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_');
  return {
    radius: desktop ? 5 : 8,
    fillColor: "orange",
    color: "#000000",
    weight: 1,
    opacity: 0.3,
    fillOpacity: 0.7,
    className: featureName4 + ` index${feature.id} geojson_small`
  }
};

var geojson_small = L.geoJson(small_data, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng);
    },
    style: geojsonMarkerSmallOptions,
    onEachFeature: onEachSmallFeature
}).addTo(map);

map.setView(new L.LatLng(47.60391069439731, -120.33859817869522), 5);


// page functionality

var allLayers = {
  "geojson" : geojson,
  "geojson_small" : geojson_small,
  "myLayer" : myLayer,
  "myLittleLayer" : myLittleLayer
};


document.querySelector("#smallFires").addEventListener('click', () => {
  document.querySelector("#smallFires").classList.contains('hide') ? map.addLayer(geojson_small) : map.removeLayer(geojson_small);
  document.querySelector("#smallFires").classList.contains('hide') ? map.addLayer(myLittleLayer) : map.removeLayer(myLittleLayer);
  document.querySelector("#smallFires").classList.toggle('hide');
  document.querySelectorAll("#smallFires span").forEach(el => el.classList.toggle('hide'));
});

function noSpaces(string) {
  return string.replace(/\s/g, '');
}

// console.log(noSpaces("hello my friend"));

function selectFire(innerText) {
  document.getElementById("myInput").value = innerText;
  document.getElementById("dropdown").classList.add('hide');
  innerText = innerText.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_');
  innerText = startsWithNumber(innerText) ? "I" + innerText : innerText;
  var thisOne = document.querySelectorAll(`.${noSpaces(innerText)}.leaflet-interactive`);
  var beOurGuide = thisOne[0];
  var allClasses = beOurGuide.classList;
  var layerID = allClasses[1];
  var collectionID = allClasses[2];
  beOurGuide.classList.add('selected');

  var getCollection = allLayers[collectionID];
  var layer = getCollection.getLayer(layerID);
  layer.fireEvent('click');

  if ((collectionID === "geojson_small") || (collectionID === "myLittleLayer")){
    map.setView(new L.LatLng(layer._latlng.lat, layer._latlng.lng), 8);
  } else if ((collectionID === "geojson") || (collectionID === "myLayer")) {
    map.setView(new L.LatLng(layer._bounds._southWest.lat, layer._bounds._southWest.lng), 8);
  } else {}
};

document.querySelectorAll(".dropdown-item").forEach(el => el.addEventListener('click', () => {
  var innerText = el.innerText;
  selectFire(innerText);
}));


// document.querySelector("#largeFires").addEventListener('click', () => {
//   document.querySelector("#largeFires").classList.contains('hide') ? map.addLayer(geojson) : map.removeLayer(geojson);
//   document.querySelector("#largeFires").classList.toggle('hide');
//   document.querySelectorAll("#largeFires span").forEach(el => el.classList.toggle('hide'));
// });


/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
// document.getElementById("myInput").addEventListener("keyup", () => filterFunction());

// document.getElementById("myInput").addEventListener("keyup", () => checkKey(e));

// document.getElementById("myInput").onkeydown = checkKey;

document.onkeyup = checkKey;

// function checkKey(e) {
//
//     e = e || window.event;
//
//      // = document.querySelectorAll(".dropdown-item").filter('.selected'),
//     let selected = document.querySelectorAll(".dropdown-item.selected");
//     let current;
//
//     if (e.keyCode == '38') {
//         // up arrow
//         console.log("up");
//     }
//     else if (e.keyCode == '40') {
//         // down arrow
//         console.log("down");
//         document.querySelectorAll(".dropdown-item")[0].focus();
//     } else {
//       filterFunction();
//     }
//
// }

var listItems = document.querySelectorAll('#dropdown .dropdown-item.display');
var div = document.getElementById("dropdown");
var input = document.getElementById("myInput");
listItems[0].classList.add('selected');

function checkKey(e) {
        var key = e.keyCode;
        let selected = document.querySelectorAll("#dropdown .dropdown-item.selected");
        listItems = document.querySelectorAll('#dropdown .dropdown-item.display');
        // console.log(selected[0]);
        let current;
        div.classList.remove('hide');

        document.querySelectorAll('#dropdown .dropdown-item').forEach(function(el) { el.classList.remove('selected'); });
        // listItems = listItems.filter(item => !(item.classList.contains("hide")));

        if ((key != 40) && (key != 38) && (key != 13)) {
          filterFunction();
          current = listItems[0];
        } else if (key == 40) { // Down key

          if (selected[0]) {
            selected[0].focus();
          } else {
            listItems[0].classList.add('selected');
            selected = listItems[0];
          }

            var next_node = selected[0].nextElementSibling;
            if (!selected.length || (next_node === null)) {
                current = listItems[0];
            } else {
                current = selected[0].nextElementSibling;
            }
        } else if (key == 38) { // Up key
            if (selected[0]) {
              selected[0].focus();
            } else {
              listItems[0].classList.add('selected');
              selected = listItems[0];
            }

            var prev_node = selected[0].previousElementSibling;
            if (!selected.length || (prev_node === null)) {
                current = listItems[listItems.length - 1];
            } else {
                current = selected[0].previousElementSibling;
            }
        } else if (key == 13) {
            if (selected.length){
            e.preventDefault();
           }
           if (input.value != selected[0].innerText) {
             var value = selected[0].innerText;
             value = value.split('(')[0].trim();
             input.value = value;
             div.classList.add('hide');
             current = selected[0];
           } else {
             selectFire(input.value);
             listItems[0].classList.add('selected');
             current = listItems[0];
           }
        }

        if (current) {
            current.classList.add('selected');
            current.focus();
        }
    };



document.getElementById("myInput").addEventListener("focus", () => {
  document.getElementById("dropdown").classList.remove('hide');
  document.getElementById("dropdown").setAttribute('aria-expanded', true);
  // document.querySelectorAll('#dropdown .dropdown-item').forEach(function(el) { el.classList.add('display'); });
});

document.getElementById("closeSearch").addEventListener("click", () => {
  document.getElementById("myInput").value = '';
  document.getElementById("dropdown").classList.add('hide');
  document.getElementById("dropdown").setAttribute('aria-expanded', false);
  document.getElementById("closeSearch").classList.remove('inUse');
  document.querySelectorAll('#dropdown .dropdown-item').forEach(function(el) { el.classList.remove('hide'); el.classList.add('display'); el.classList.remove('selected');});
  document.querySelectorAll('#dropdown .dropdown-item')[0].classList.add('selected');
});


function filterFunction() {
  document.getElementById("dropdown").classList.remove('hide');
  document.getElementById("closeSearch").classList.add('inUse');
  var input, filter, ul, li, a, i;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("myDropdown");
  a = div.querySelectorAll(".dropdown-item");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      // a[i].style.display = "";
      a[i].classList.add('display');
      a[i].classList.remove('hide');
    } else {
      // a[i].style.display = "none";
      a[i].classList.remove('display');
      a[i].classList.add('hide');
    }
  }
}
