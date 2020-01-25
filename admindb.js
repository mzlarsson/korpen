var express = require('express');
var app = express();
 
var nodeadmin = require('nodeadmin');
app.use(nodeadmin(app));

app.listen(1338);
console.log("Server running on port 1338");
console.log("Login available on http://192.168.0.202:1338/nodeadmin/#!/login");
