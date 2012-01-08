
(function()
{
	var common  = require("./common.js");
	var setup   = require("./utils/setup.js");
	var gapi    = require("./cms/galleryapi.js");
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
					authed : req.session.authenticated,
					title: "Admin Auth", 
					navigation_blocks: navcontents, 
					categories: galleries
				});
			});
		});
	}

	function auth(req, res)
	{
		if (req.session.authenticated)
		{
			res.statusCode = 200;
			res.end();
			return;
		}

		if (req.body.password === "{4DB39B9D-F800-409A-A75F-F365B8704D8B}")
		{
			req.session.authenticated = true;
			res.statusCode = 200;
			res.end();	
		} else 
		{
			res.statusCode = 403;
			res.end();
		}
	}

	function unauth(req, res)
	{
		req.session.authenticated = false;
		res.end();
	}

	function addGallery(req, res)
	{
		if (!req.session.authenticated)
		{
			res.statusCode = 403;
			res.end();
			return;
		}

		gapi.gallery({
			name: req.body.name
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

	function gallery(req, res)
	{
		if (!req.session.authenticated)
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
		auth : auth,
		panel: panel, 
		gallery: gallery, 
		addGallery: addGallery,
		unauth: unauth
	}


})();

