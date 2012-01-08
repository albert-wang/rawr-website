
(function()
{
	var setup = require('../utils/setup.js');
	var flow  = require("flow")
	var rss   = require("rss");
	var fs    = require("fs");
	var filter= require("../utils/swigfilters.js");
	var fe    = flow.exec;
	
	function regenerateRSSFeedForImages(cb)
	{
		var feed = new rss({
			title		: "Rawr Productions Gallery Updates", 
			description : "Most recent gallery updates", 
			feed_url    : "http://www.rawrrawr.com/rss/gallery.rss", 
			site_url    : "http://www.rawrrawr.com/rss/blog.rss", 
			author      : "Rawr Productions"
		});

		fe(function()
		{
			setup.getConnection(this);
		}, function(err, client)
		{
			if (err)
			{
				cb(err, undefined);
				return undefined;
			}

			client.query({
				name : "get recent images with category", 
				text : "SELECT i.name, i.title, i.description, i.time, c.id as cid, c.name as cat, c.s3folder FROM " + 
					"gallery_images i JOIN gallery_categories c ON i.category = c.id " + 
					"ORDER BY i.time DESC LIMIT $1", 
				values: [30]
			}, this);
		}, function(err, results)
		{
			if (err)
			{
				cb(err, undefined);
				return undefined;
			}

			flow.serialForEach(results.rows, function(img)
			{
				feed.item({
					title 		: img.title,
					description : img.description, 
					url         : "http://www.rawrrawr.com/gallery/" + img.cid + "/" + filter.linkify(img.title), 
					date        : img.time
				});
				this();
			}, function()
			{
			}, function()
			{
				var xml = feed.xml();
				fs.writeFile("./static/rss/gallery.rss", xml, function(err)
				{
					cb(err, xml);
				});
			});
		});
	}

	function image(params, cb)
	{
		/*
			Params must be in the format: 
				{
					image: path to the image. Can be anywhere readable on disk.
					title: title
					desc : description of the image
					gallery: id of the gallery
				}
		*/

		var title = params.title || "Untitled";
		var desc  = params.desc  || "";
		var gid   = params.gallery || 1;


		setup.getConnection(function(err, client)
		{
			if (err)
			{
				cb(err, undefined);
				return undefined;
			}

			fe(function()
			{
				client.query({
					name : "select gallery by id", 
					text : "SELECT id, name, s3folder FROM gallery_categories WHERE id = $1", 
					values : [gid]
				}, this)
			}, function(err, results)
			{
				if (err)
				{
					cb(err, undefined);
					return undefined;
				}

				//Apply image magic to rescale the image to thumbnail size.

				//S3 upload the image and the thumbnail to the appropriate folder

				//Insert these new values into the database.
			}


			);
		});
	}

	module.exports = {
		regenerateRSSFeedForImages: regenerateRSSFeedForImages
	};
})();