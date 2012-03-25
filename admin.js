
(function()
{
	var common  = require("./common.js");
	var setup   = require("./utils/setup.js");
	var gapi    = require("./cms/galleryapi.js");
	var api     = require("./cms/blogapi.js");
	var fe      = require("flow").exec;
	var util    = require("util");

	function panel(req, res)
	{
		common.navigation("Admin", function(err, navcontents)
		{
			gapi.getGalleries(function(err, galleries)
			{
				if (err)
				{
					console.log(err);
					res.end();
					return undefined;
				}

				res.render("adminauth.html", {
					authed : req.isAuthenticated(),
					title: "Admin Panel", 
					navigation_blocks: navcontents, 
					categories: galleries, 
                    stats: {
                        published: 4, 
                        ideas: 10,
                        galleries: 40,
                        totalImages: 45
                    }
				});
			});
		});
	}

	function addGallery(req, res)
	{
		if (!req.isAuthenticated())
		{
			res.statusCode = 403;
			res.end();
			return;
		}

		gapi.gallery({
			name: req.body.name,
			desc: req.body.desc
		}, function(err)
		{
			if (err)
			{
				res.statusCode = 500;
				res.end();
			}
			res.statusCode = 200;
			res.end();
		});
	}

	function getpost(req, res, id)
	{
		if (!req.isAuthenticated())
		{
			res.statusCode = 403;
			res.end();
			return;
		}

		api.getPostWithId(id, function(err, data)
		{
			res.end(JSON.stringify({
				content: data.content
			}));
		});
	}

	function editpost(req, res)
	{
		if (!req.isAuthenticated())
		{
			res.statusCode = 403;
			res.end();
			return; 
		}

		api.editpost({
			id: req.body.id, 
			content: req.body.content
		}, function(err)
		{
			if (err) { console.log(err); }
			res.statusCode = 302;
			res.end();
		});
	}

	function gallery(req, res)
	{
		if (!req.isAuthenticated())
		{
			res.statusCode = 403;
			res.end();
			return;
		}

		gapi.image({
			image: req.files.image.path, 
			title: req.body.title, 
			desc : req.body.desc, 
			gallery : req.body.gallery,
			type : req.files.image.type
		}, function(err)
		{
			if (err) { console.log(err); }
			res.writeHead(302, { 'Location' : '/admin' });
			res.end();
		});
	}

	module.exports = {
		panel: panel, 
		gallery: gallery, 
		addGallery: addGallery,
		editpost: editpost,
		getpost: getpost
	}


})();

