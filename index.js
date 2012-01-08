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


    //The API
    app.post("/api", function(req, res)
	{
		blog.postapi(req, res, setup);
	})

	app.post("/imageupload", function(req, res)
	{
		
	})
});

setup.schedule(function()
{
	api.postscheduled(function(err)
	{
		if (err)
		{
			console.log(err);
		}
		console.log("Finished posting scheduled posts");
	});

	api.regenerateRSSFeedForPosts(function(err, xml)
	{
		if (err)
		{
			console.log(err);
		}	
		console.log("Finished generating RSS feeds");
	});
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
