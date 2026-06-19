const fs = require('fs');
const https = require('https');

const file = fs.createWriteStream("sheet.csv");
https.get("https://docs.google.com/spreadsheets/d/14K2vrJpbX-V54q96Xfc-nN3AA9IJ-3FV5EWMwInqdso/export?format=csv&gid=0", function(response) {
  if (response.statusCode === 307 || response.statusCode === 302) {
    https.get(response.headers.location, function(redirectResponse) {
      redirectResponse.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
      });
    });
  } else {
    response.pipe(file);
    file.on("finish", () => {
        file.close();
        console.log("Download Completed");
    });
  }
});
