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
		if (req.body.key !== "{81D6B2F2-1983-4583-9CDE-DA9F6A3B66B7}")
		{
			return undefined;
		}

		var postContent = {
			title   : api.base64Decode(req.body.title).toLowerCase(), 
			content : api.base64Decode(req.body.post),
			category: api.base64Decode(req.body.category),
			tags    : api.base64Decode(req.body.tags).split(',')
		}

		var date = null;
		if (req.body.date)
		{
			date = api.base64Decode(req.body.date);
		}

		if (!date)
		{
			api.post(postContent, function(err, id)
			{
				if (err)
				{
					res.end("Failed to insert a post.");
				} else 
				{
					res.end("http://www.rawrrawr.com/post/" + id);
				}
			});
		} else 
		{
			api.futurepost(postContent, date, function(err)
			{
				if (err)
				{
					res.end("Failed to insert a future post.");
				} else 
				{
					res.end("http://www.rawrrawr.com");
				}
			});
		}
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
	});
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
