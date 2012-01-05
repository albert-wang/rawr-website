var http      = require("http");
var nodeutil  = require("util");
var express   = require("express");
var setup     = require("./utils/setup.js")
var fe        = require("flow").exec;

//temp
var api       = require("./cms/blogapi.js");

var app = setup.setup(function(app)
{
    //Routing
    app.get("/", function(req, res)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            this();
        });

        res.render("container.html", { Title : "Title" });
    });
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
