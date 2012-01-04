var http      = require("http");
var nodeutil  = require("util");
var express   = require("express");
var setup     = require("./utils/setup.js")
var flo       = require("flow").exec;

var app = setup.setup(function(app)
{
    //Routing
    app.get("/", function(req, res)
    {
        flo(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {

        }

        res.render("container.html", { Title : "Title" });
    });
});
//Listen
app.listen(23296);

