var http      = require("http");
var nodeutil  = require("util");
var express   = require("express");
var setup     = require("./utils/setup.js")
var fe        = require("flow").exec;
//temp
var api       = require("./cms/blogapi.js");
var swig      = require("swig");
var blog      = require("./blog.js")

var app = setup.setup(function(app)
{
    //Routing
    app.get("/", function(req, res)
    {
        blog.home(req, res, setup);
    });
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
