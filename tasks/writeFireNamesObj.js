module.exports = function(grunt) {
  var serialize = d => JSON.stringify(d, null, 2);
  
  grunt.registerTask("writeFireNamesObj", function() {

    var names = grunt.data.fireNames;

    const active_fire_names = serialize(names);
    grunt.file.write("src/js/fire_data/fireNames.txt", active_fire_names);

  });
};
