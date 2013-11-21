var setup     = require("./utils/setup.js")
var blog      = require("./blog.js")
var admin     = require("./admin.js")
var gallery   = require("./gallery.js")
var statics   = require("./statics.js")
var passport  = require("passport")
var genrun    = require("gen-run")

var app = setup.setup(function(app)
{
    //Routing

    //Basic website routes
    (function(){
    	//Blog routes
		app.harmony.get("/", function*(req, res, run)
		{
			yield* blog.home(req, res, setup, run);
		});

		app.harmony.get("/blog/?", function*(req, res, run)
		{
			yield* blog.category(req, res, "all", undefined, run);
		});

	    app.harmony.get("/blog/?", function*(req, res, run)
		{
			yield* blog.category(req, res, "all", undefined, run);
		});

		app.harmony.get("/blog/:category/?", function*(req, res, run)
		{
			yield* blog.category(req, res, req.params.category, undefined, run);
		});

		app.harmony.get("/blog/archive/:year/:month/:category?", function*(req, res, run)
		{
			yield* blog.archives(req, res, req.params.category, req.params.year, req.params.month, run);
		});

		app.harmony.get("/post/:id/:title/?", function*(req, res, run)
		{
			yield* blog.singlepost(req, res, req.params.id, run);
		});

		//Static page routes
		app.harmony.get("/projects/?", statics.projects);
		app.harmony.get("/downloads/?", statics.downloads);
		app.harmony.get("/about/?", statics.about);

		//Gallery routes
	    app.harmony.get("/gallery/?", function*(req, res, run)
	    {
	    	yield* gallery.home(req, res, setup, run);
	    });

	    app.harmony.get("/gallery/:gallery/:index?", function*(req, res, run)
	    {
	    	yield* gallery.category(req, res, req.params.gallery, req.params.index ? req.params.index : 0, run);
	    });
	})();

    //The admin routes
    (function(){
	    app.harmony.get("/admin/?", setup.requiresAuth, admin.panel);

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

		app.harmony.post("/admin/post/:index/?", setup.requiresAuth, function*(req, res, run)
		{
			yield* admin.getpost(req, res, req.params.index, run);
		});


		app.post("/admin/authenticate/?", setup.requiresAuth, function(req, res)
		{
			admin.auth(req, res);
		});

        app.harmony.post("/admin/removepost", setup.requiresAuth, admin.removepost);
        app.harmony.post("/admin/posttitles/?", setup.requiresAuth, admin.getPostTitles) ;

        //Ideas
        app.harmony.post("/admin/ideatitles/?", setup.requiresAuth, admin.getIdeaTitles);
        app.harmony.post("/admin/addidea/?", setup.requiresAuth, admin.addIdea);
        app.harmony.post("/admin/removeidea/?", setup.requiresAuth, admin.removeIdea);
        app.harmony.post("/admin/saveidea/?", setup.requiresAuth, admin.saveIdea);
        app.harmony.post("/admin/publishidea/?", setup.requiresAuth, admin.publishIdea);

		app.post("/admin/unauth/?", setup.requiresAuth, function(req, res)
		{
			req.logout();
			res.redirect("/");
		});

		app.harmony.post("/admin/edit/?", setup.requiresAuth, admin.editpost); 

        //Galleries
        app.harmony.post("/admin/addgallery/?", setup.requiresAuth, admin.addGallery);

        app.post("/admin/gallery/?", setup.requiresAuth, function (req, res)
        {
            admin.gallery(req, res);
        });

        app.harmony.post("/admin/getgalleries/?", setup.requiresAuth, admin.getGalleries);
        app.harmony.post("/admin/getimages/?", setup.requiresAuth, admin.getGalleryImages);
        app.harmony.post("/admin/togglegallery/?", setup.requiresAuth, admin.toggleGallery);
        app.harmony.post("/admin/gallery/addimage/?", setup.requiresAuth, admin.addImage);
        app.harmony.post("/admin/gallery/removeimage/?", setup.requiresAuth, admin.removeImage);
        app.harmony.post("/admin/gallery/editimage/?", setup.requiresAuth, admin.editImage); 
        app.harmony.post("/admin/removegallery/?", setup.requiresAuth, admin.removeGallery);
	})();

    //The API routes
    (function() {
	    app.harmony.post("/api/?", function*(req, res, run)
		{
			yield* blog.postapi(req, res, setup, run);
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
