var setup     = require("./utils/setup.js")
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
	var api       = require("./cms/blogapi.js");
	var gapi      = require("./cms/galleryapi.js")

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

	gapi.regenerateRSSFeedForImages(function(err, xml)
	{
		if (err)
		{
			console.log(err);
		}	
		console.log("Finished generating Image RSS Feeds");
	});
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
