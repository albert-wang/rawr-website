var http      = require("http");
var nodeutil  = require("util");
var express   = require("express");
var setup     = require("./utils/setup.js")

var app = setup.setup(function(app)
{
    //Routing
    app.get("/", function(req, res)
    {
        res.render("container.html", { Title : "Title" });
    });
});
//Listen
app.listen(23296);

