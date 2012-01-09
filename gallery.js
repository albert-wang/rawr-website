
(function()
{
	var gapi 	= require("./cms/galleryapi.js");
	var common 	= require("./common.js");

	function home(req, res, setup)
	{
		common.navigation("Gallery", function(err, nav)
		{
			gapi.getAllGalleriesWithOneImage(function(err, galleries)
			{
				res.render("gallery_home.html", {
					navigation_blocks: nav,
					galleries: galleries,
					feature: {
						title 	: "Araboth Gallery",
						content : "The most recent screenshots from my project, Araboth",
						link    : "/gallery/araboth"
					}
				});
			});
		});
	}

	module.exports = {
		home : home
	}
})();
