
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

	function category(req, res, gallery, i)
	{
		var index = i || 0;
		common.navigation("Gallery", function(err, nav)
		{
			gapi.getImagesInGallery(gallery, function(err, images, galleryDesc)
			{
				if (err)
				{
					console.log("Err getting: " + gallery);
					res.end();
					return;
				}

				res.render("gallery_category.html", {
					navigation_blocks: nav, 
					category         : galleryDesc,
					images           : images,
					start_index      : index
				});
			});
		});
	}

	module.exports = {
		home : home,
		category : category
	}
})();
