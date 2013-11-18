
(function()
{
	var gapi 	= require("./cms/galleryapi.js");
	var common 	= require("./common.js");
	var utils   = require("./utils/utils");
	var envrun  = require("env-run");

	function home(req, res, setup)
	{
		envrun(function*(run) {
			navigation = yield common.navigation("Gallery", run());
			galleries = yield gapi.getAllGalleriesWithOneImage(run());

			res.render("gallery_home.html", {
				navigation_blocks: navigation, 
				galleries: galleries, 
				feature: {
					title   : "Araboth Gallery", 
					content : "The most recent screenshots from my project, Araboth", 
					link    : "/gallery/araboth"
				}
			});
		});
	}

	function category(req, res, gallery, i)
	{
		var index = i || 0;
		utils.combine({
			"navigation" : common.navigation.bind(common, "Gallery"), 
			"images"     : gapi.getImagesInGallery.bind(gapi, gallery)
		}, 
		function(err, d) 
		{
			if (err)
			{
				console.log(err);
				return res.end();
			}

			res.render("gallery_category.html", {
				navigation_blocks: d.navigation, 
				category         : d.images[1], 
				images           : d.images[0], 
				start_index      : index
			});
		});
	}

	module.exports = {
		home : home,
		category : category
	}
})();
