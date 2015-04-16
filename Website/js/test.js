var fs = require('fs');

var myData = {
  name:'test',
  version:'1.0'
}

var jsonFile = 'Website/Website.json';
var jsonContents;
fs.readFile(jsonFile, function(error, content) {
    if (error) throw error;
    jsonContents = JSON.parse(content);
});
jsonContents["NextField"]="dave";
fs.writeFile(jsonFile, JSON.stringify(myData, null, 4), function(error) {
    if(error) {
      console.log(error);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 