var setup     = require("./utils/setup.js")
var blog      = require("./blog.js")
var admin     = require("./admin.js")
var gallery   = require("./gallery.js")

var app = setup.setup(function(app)
{
    //Routing

    //Basic website routes
    (function(){
	    app.get("/", function(req, res)
	    {
	        blog.home(req, res, setup);
	    });

	    app.get("/blog/?", function(req, res)
		{
			blog.category(req, res, "all");
		});

		app.get("/blog/:category/?", function(req, res)
		{
			blog.category(req, res, req.params.category);	
		});

		app.get("/blog/archive/:year/:month/:category?", function(req, res)
		{
			blog.archives(req, res, req.params.category, req.params.year, req.params.month);
		});

		app.get("/post/:id/:title/?", function(req, res)
		{
			blog.singlepost(req, res, req.params.id);
		});

	    app.get("/gallery/?", function(req, res)
	    {
	    	gallery.home(req, res, setup);
	    });

	    app.get("/gallery/:gallery/:index?", function(req, res)
	    {
	    	gallery.category(req, res, req.params.gallery, req.params.index ? req.params.index : 0);
	    });
	})();

    //The admin routes
    (function(){
	    app.get("/admin/?", function(req, res)
		{
			admin.panel(req, res);
		});

		app.post("/admin/authenticate/?", function(req, res)
		{
			admin.auth(req, res);
		});

		app.post("/admin/addgallery/?", function(req, res)
		{
			admin.addGallery(req, res);
		})

		app.post("/admin/gallery/?", function(req, res)
		{
			admin.gallery(req, res);
		})

		app.post("/admin/unauth/?", function(req, res)
		{
			admin.unauth(req, res);
		});
	})();

    //The API routes
    (function() {
	    app.post("/api/?", function(req, res)
		{
			blog.postapi(req, res, setup);
		})
	})();
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
