const axios = require("axios");
const fs = require("fs").promises;

let reportCache = {};

const endpoint = "https://api.ap.org/v2/reports";
const baseParams = {
  apiKey: process.env.AP_API_KEY,
  format: "json",
};

//https://api.ap.org/v2/reports?apikey=ErEXhcCcpuKoR1yRb44KY9AQOMbeYdUP&type=EstimatedVotePercentage//

/**
 * Get the Estimated Vote Percentage reports from AP
 *
 * @returns {Promise<{}>}
 */


const getVotes = async function() {
  const normalize = {
    EstimatedVotePercentage: processVoterPercentReport
  }

  return retrieveAndFormatResults(endpoint, { test: "false", type: "EstimatedVotePercentage"}, normalize)
};



/**
 * Retrieve the results from the API and format what we get
 *
 * @param {string} endpoint The URL for the API we want to access
 * @param {object} apUrlParams keys/values that we can later convert into URL parameters when querying the API
 *                             If you pass the property "test" with the value of "true", you will get report with
 *                             test data
 * @param {object} normalize The property names of this object match the element names in the API response. While
 *                           processing the results, when we come across an element with a certain name, we then call
 *                           the function name that is called as a value
 * @returns {Promise<{}>}
 */
const retrieveAndFormatResults = async function(endpoint, apUrlParams, normalize) {
  console.log(`Getting ${apUrlParams.type} report lookup files...`);

  // Retrieve the report lookup files. These contain the links we need to request more granual reports that contain the
  const links = await getAPIData(endpoint, apUrlParams);

  console.log(`Getting ${apUrlParams.type} reports...`);
  let latest = parseLinks(links);


  return getDataFromLinkedReports(latest, normalize);
}

/**
 * Get data from an Associated Press API at the given URL
 * We are using axios to make the requests for us: https://github.com/axios/axios
 *
 * @param {string} url
 * @param {object} params Axios will convert the property/values in this object into URL parameters for the URL it uses
 *                        for its GET request. The URL parameters you need will differ depending on which AP API you
 *                        are querying. Check out their documentation for what URL parameters you need to send
 * @returns {object} the data we retrieved from the API
 */
const getAPIData = async function(url, params = {}) {
  // Send a GET request to the URL: https://github.com/axios/axios#axiosconfig
  const response = await axios({
    url,
    params: Object.assign({}, baseParams, params)
  });
  return response.data;
};


/**
 * Extract the links and a timestamp for when they were last updated
 *
 * @param {object} linkData
 * @returns {object}
 */
const parseLinks = function(linkData) {
  let latest = {};
  linkData.reports.forEach(function(link) {
    const updated = Date.parse(link.updated);
    let [type, name] = link.title.split(/\s*\/\s*/g);
    name = name.replace("del", "");
    const url = link.id;

    if ((type === "EstimatedVotePercentage") && (link.electionDate != dayOfElection)) {
      // Don't pass EVPs that have an election date other than what we want
    } else {
      // Otherwise, Check to see if the updated stamp is the latest available, and pass URL to latest object
      if (latest[name]) {
        if (latest[name].updated > updated) return;
      }

      latest[name] = { updated, url };
    }






  });

  return latest;
}


/**
 * Get the data from the reports linked in a parent report
 *
 * We query a first report from AP that will give us a series of links to follow to get more data. This function process
 * the data in these secondary reports
 *
 * @param {object} latest    URLs and timestamps for when they were updated for each linked report we want to query
 * @param {object} normalize The property names of this object match the element names in the API response. While
 *                           processing the results, when we come across an element with a certain name, we then call
 *                           the function name that is called as a value *
 * @param {object} params keys/values that we will later convert into URL parameters when querying the API
 * @returns {Promise<{}>}
 */
const getDataFromLinkedReports = async function(latest, normalize, params = {}) {
  let output = {};
  const reports = Object.keys(latest).map(async function(name) {
    const link = latest[name];
    const { url } = link;
    let report;

    if (reportCache[url]) {
      console.log(`Getting report from cache (${url})`);
      report = reportCache[url];
    } else {
      console.log(`Loading report from AP (${url})`);
      report = reportCache[url] = await getAPIData(url, params)
    }
  });
  await Promise.all(reports);

  return output;
}




const processVoterPercentReport = function(report) {
  // var data = report.EstimatedVotePercentage;

  return report;
};





module.exports = { getVotes }
