
(function()
{
	var gapi 	= require("./cms/galleryapi.js");
	var common 	= require("./common.js");
	var utils	= require("./utils/utils");
	var genrun	= require("gen-run");

	function home(req, res, setup)
	{
		genrun(function*(run) {
			navigation = yield common.navigation("Gallery", run());
			galleries = yield gapi.getAllGalleriesWithOneImage(run());

			return res.render("gallery_home.html", {
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
		genrun(function*(run) 
		{
			var index = i || 0;
			var navigation = yield common.navigation("Gallery", run());
			var images = yield gapi.getImagesInGallery(gallery, run());

			return res.render("gallery_category.html", {
				navigation_blocks: navigation, 
				category         : images[0], 
				images           : images[1], 
				start_index      : index
			});
		});
	}

	module.exports = {
		home : home,
		category : category
	}
})();
