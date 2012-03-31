var setup     = require("./utils/setup.js")
var blog      = require("./blog.js")
var admin     = require("./admin.js")
var gallery   = require("./gallery.js")
var statics   = require("./statics.js")
var passport  = require("passport")

var app = setup.setup(function(app)
{
    //Routing

    //Basic website routes
    (function(){
    	//Blog routes
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

		//Static page routes
		app.get("/projects/?", statics.projects);
		app.get("/downloads/?", statics.downloads);
		app.get("/about/?", statics.about);

		//Gallery routes
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
	    app.get("/admin/?", setup.requiresAuth, function(req, res)
		{
			admin.panel(req, res);
		});

		app.get("/admin/login/", passport.authenticate('google', 
			{
				scope: [
					'https://www.googleapis.com/auth/userinfo.profile', 
					'https://www.googleapis.com/auth/userinfo.email'
				]
			}), function(req, res)
		{
			res.redirect("/admin");
		});

		app.get("/oauth2callback", passport.authenticate('google', { failureRedirect: '/' }), function(req, res)
		{
			res.redirect("/admin/");
		});

        app.post("/admin/preview/?", setup.requiresAuth, function(req, res)
        {
            admin.preview(req, res);
        });

		app.post("/admin/post/:index/?", setup.requiresAuth, function(req, res)
		{
			admin.getpost(req, res, req.params.index);
		});

        app.post("/admin/removepost", setup.requiresAuth, function(req, res)
        {
            admin.removepost(req, res);
        });

		app.post("/admin/authenticate/?", setup.requiresAuth, function(req, res)
		{
			admin.auth(req, res);
		});

        app.post("/admin/posttitles/?", setup.requiresAuth, function(req, res)
        {
            admin.getPostTitles(req, res);
        })

        //Ideas
        app.post("/admin/ideatitles/?", setup.requiresAuth, function(req, res)
        {
            admin.getIdeaTitles(req, res);
        });

        app.post("/admin/addidea/?", setup.requiresAuth, function(req, res)
        {
            admin.addIdea(req, res);
        });

        app.post("/admin/removeidea/?", setup.requiresAuth, function (req, res)
        {
            admin.removeIdea(req, res);
        });

        app.post("/admin/saveidea/?", setup.requiresAuth, function(req, res)
        {
            admin.saveIdea(req, res);
        });

        app.post("/admin/publishidea/?", setup.requiresAuth, function(req, res)
        {
            admin.publishIdea(req, res);
        });
        
		app.post("/admin/unauth/?", setup.requiresAuth, function(req, res)
		{
			req.logout();
			res.redirect("/");
		});

		app.post("/admin/edit/?", setup.requiresAuth, function(req, res)
		{
			admin.editpost(req, res);
		});

        //Galleries
        app.post("/admin/addgallery/?", setup.requiresAuth, function (req, res)
        {
            admin.addGallery(req, res);
        });

        app.post("/admin/gallery/?", setup.requiresAuth, function (req, res)
        {
            admin.gallery(req, res);
        });

        app.post("/admin/getgalleries/?", setup.requiresAuth, function(req, res)
        {
            admin.getGalleries(req, res);
        })

        app.post("/admin/getimages/?", setup.requiresAuth, function(req, res)
        {
            admin.getGalleryImages(req, res);
        });

        app.post("/admin/togglegallery/?", setup.requiresAuth, function(req, res)
        {
            admin.toggleGallery(req, res);
        });

        app.post("/admin/gallery/addimage/?", setup.requiresAuth, function(req, res)
        {
            admin.addImage(req, res);
        });

        app.post("/admin/gallery/removeimage/?", setup.requiresAuth, function(req, res)
        {
            admin.removeImage(req, res);
        });

        app.post("/admin/gallery/editimage/?", setup.requiresAuth, function(req, res)
        {
            admin.editImage(req, res);
        });

        app.post("/admin/removegallery/?", setup.requiresAuth, function (req, res)
        {
            admin.removeGallery(req, res);
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
