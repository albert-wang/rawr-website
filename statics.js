(function()
{
	var common = require("./common.js");

	function projects(req, res)
	{
		common.navigation("Projects", function(err, navigationblocks)
		{
			res.render("projects.html", {
				navigation_blocks: navigationblocks
			})
		});
	}

	function downloads(req, res)
	{
		common.navigation("Downloads", function(err, nav)
		{
			res.render("downloads.html", {
				navigation_blocks : nav
			})
		});
	}

	function about(req, res)
	{
		common.navigation("About", function(err, nav)
		{
			res.render("about.html", {
				navigation_blocks: nav
			})
		})
	}

	module.exports = {
		projects : projects,
		downloads: downloads,
		about	 : about
	}
})();