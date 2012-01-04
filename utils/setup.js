
(function()
{
    var express = require("express");
    var swig    = require("swig");
    var fs      = require("fs");

    function setup(routes)
    {
        var app = express.createServer();
        swig.init({ root: "./templates", allowErrors: true });

        app.register(".html", swig);
        app.set("view engine", "html");
        app.set("views", "./templates");
        app.set("view options", { layout : false });

        //Middleware
        app.use(express.logger({stream : fs.createWriteStream("./logs/nodelog.log", { flags : "w+" })}));
        app.use(express.static(__dirname + "/static/"));
        app.use(express.router(routes));
        

        return app;
    }

    module.exports = {
        setup : setup
    };
})();

