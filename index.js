var model = require('./model');

var express = require('express'), http = require('http'), https = require('https');
var app = express();
var server = createServer(9457, true);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var flash = require('express-flash'), cookieParser = require('cookie-parser'), session = require('express-session');
app.use(cookieParser('keyboard cat'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());

const path = require('path');
const hbs = require('express-handlebars');
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'default',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: require('./hbs-helpers')
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.static('public'));

const mainController = require("./controllers/main")(model);
const loginController = require("./controllers/login")(model);

app.use("/", mainController);
app.use("/login", loginController);


function createServer(webPort, useHttps=false) {

        let server = null;
        if (!useHttps) {
                const http = require("http");
                server = http.createServer(app);
        }
        else {
                const fs = require("fs");
                var options = {
                        key: fs.readFileSync("certs/privkey.pem", "utf8"),
                        cert: fs.readFileSync("certs/fullchain.pem", "utf8")
                };

                const https = require("https");
                server = https.createServer(options, app);
        }

        server.listen(webPort, function(){
                console.log(`Server started with${!useHttps ? "out" : ""} HTTPS. Port ${webPort}`);
        });

        return server;
}
