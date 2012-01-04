
global.__pq_connection_string = "tcp://rraawwrr:password@localhost";

(function()
{
    var express = require("express");
    var swig    = require("swig");
    var fs      = require("fs");
    var pq      = require("pq").native;

    function setup(routes)
    {
        var app = express.createServer();
        swig.init({ root: "./templates", allowErrors: true });

        app.register(".html", swig);
        app.set("view engine", "html");
        app.set("views", "./templates");
        app.set("view options", { layout : false });

        //Middleware
        app.use(express.logger({stream : fs.createWriteStream("./logs/http.log", { flags : "a" })}));
        app.use(express.profiler());
        app.use(express.static("./static/"));
        app.use(express.router(routes));

        pg.connect(__pq_connection_string, function(err, client)
        {
            if (err)
            {
                console.log(err);
            } else 
            {
                console.log("Got a connection");
            }
        });

        return app;
    }

    module.exports = {
        setup : setup
    };
})();

