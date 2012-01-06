
(function()
{
    var express = require("express");
    var swig    = require("swig");
    var fs      = require("fs");
    var pg      = require("pg");

    var connectionString = "tcp://rraawwrr:password@localhost";

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
        app.use(express.static("./static/"), { maxAge: 1 });
        app.use(express.router(routes));

        return app;
    }

    function getConnection(cb)
    {
        pg.connect(connectionString, function(err, client)
        {
            if (err)
            {
                console.log(err);
            }

            cb(err, client);
        });
    }

    module.exports = {
        setup : setup, 
        getConnection : getConnection
    };
})();

