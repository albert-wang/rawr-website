
(function()
{
	var common  = require("./common.js");
	var setup   = require("./utils/setup.js");
	var fe      = require("flow").exec;
	var util    = require("util");

	function panel(req, res)
	{
		common.navigation("Admin", function(err, navcontents)
		{
			fe(function()
			{
				setup.getConnection(this)
			}, function(err, client)
			{
				if (err)
				{
					console.log(err);
					return undefined;
				}

				client.query({
					name: "get gallery categories", 
					text: "SELECT id, name FROM gallery_categories"
				}, this)
			}, function(err, results)
			{
				if (err)
				{
					console.log(err);
					return undefined;
				}

				res.render("adminauth.html", {
					authed : req.session.authenticated,
					title: "Admin Auth", 
					navigation_blocks: navcontents, 
					categories: results.rows
				});
		});
		})
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

	function gallery(req, res)
	{
		if (!req.session.authenticated)
		{
			res.statusCode = 403;
			res.end();
			return;
		}

		console.log(req.body);
		console.log(util.inspect(req.files));

		res.writeHead(302, { 'Location' : '/admin' });
		res.end();
	}

	module.exports = {
		auth : auth,
		panel: panel, 
		gallery: gallery, 
		unauth: unauth
	}


})();

