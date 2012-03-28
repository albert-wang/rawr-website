
(function()
{
	var setup = require('../utils/setup.js');
	var flow  = require("flow")
	var rss   = require("rss");
	var fs    = require("fs");
	var filter= require("../utils/swigfilters.js");
	var fe    = flow.exec;
	var img   = require("imagemagick");
	var mime  = require("mime");
	var crypto= require("crypto");
	var util  = require('util');
	
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
				text : "SELECT i.name, i.title, i.description, i.time, c.id as cid, c.name as cat FROM " + 
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
					type : mimetype of the image
				}
		*/

		var title = params.title || "Untitled";
		var desc  = params.desc  || "";
		var gid   = params.gallery || 1;
		var inputName = null;
		var name  = null;

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
					text : "SELECT id, name FROM gallery_categories WHERE id = $1", 
					values : [gid]
				}, this)
			}, function(err, results)
			{
				if (err)
				{
					cb(err, undefined);
					return undefined;
				}

				var shasum = crypto.createHash("sha1");
				var s = fs.ReadStream(params.image);
				var outer = this;

				s.on('data', function(d)
				{
					shasum.update(d);
				});

				s.on('end', function()
				{
					var d = shasum.digest("hex");
					outer(d);
				});
			}, function(digest)
			{
				inputName = digest + "." + mime.extension(params.type);
				if (params.type === "image/bmp")
				{
					//Convert BMPs to PNG
					name = digest + ".png";
				} else 
				{
					name = inputName;
				}

				var input = fs.ReadStream(params.image);
				var output = fs.WriteStream("./cache/" + name);

				util.pump(input, output, this);
			}, function(err)
			{
				if (err)
				{
					cb(err, undefined);
					return undefined;
				}

				var outer = this;

				//Apply image magic to rescale the image to thumbnail size.
				if (inputName !== name)
				{
					img.convert(["./cache/" + inputName, "./cache/" + name], function()
					{
						img.convert(["./cache/" + name, "-resize", "120x180^", "-gravity", "center", "-extent", "120x180", "./cache/thumb-" + name], function(err, meta)
						{
							img.convert(["./cache/" + name, "-resize", "400x300", "./cache/med-" + name], outer);
						});		
					});
				} else 
				{
					img.convert(["./cache/" + name, "-resize", "120x180^", "-gravity", "center", "-extent", "120x180", "./cache/thumb-" + name], function(err, meta)
					{
						img.convert(["./cache/" + name, "-resize", "400x300", "./cache/med-" + name], outer);
					});		
				}
			}, function(err, meta)
			{
				//S3 upload the image and the thumbnail to the appropriate folder
				var outer = this;

				setup.s3.putFile("./cache/" + name, "/gallery/" + name, function(err, res)
				{
					if (err)
					{
						cb(err, undefined);
						return undefined;
					}

					if (res.statusCode != 200)
					{
						cb("Status code: " + res.statusCode, undefined);
						return undefined;
					}

					setup.s3.putFile("./cache/thumb-" + name, "/gallery/thumb-" + name, function(err, res)
					{
						if (err)
						{
							cb(err, undefined);
							return undefined;
						}

						if (res.statusCode != 200)
						{
							cb("Status code: " + res.statusCode, undefined);
							return undefined;
						}

						setup.s3.putFile("./cache/med-" + name, "/gallery/med-" + name, outer);
					});
				});
			}, function(err, res)
			{
				fs.unlink("./cache/" + name, function(e1)
				{
					fs.unlink("./cache/thumb-" + name, function(e2)
					{
						fs.unlink("./cache/med-"+ name, function(e3)
						{
							if (e1 || e2 || e3)
							{
								console.log("Failed to unlink some of the cached files.");
							}	
						});
					});
				});

				//Insert these new values into the database.
				if (err)
				{
					cb(err, undefined);
					return undefined;
				}

				if (res.statusCode != 200)
				{
					cb("Status code: " + res.statusCode, undefined);
					return undefined;
				}

				client.query({
					name: "insert image into gallery", 
					text: "INSERT INTO gallery_images (name, title, description, category, time) VALUES($1, $2, $3, $4, NOW())", 
					values: [name, title, desc, gid]
				}, this);
			}, function(err, results)
			{
				cb(err);	
			});
		});
	}

	function gallery(params, cb)
	{
		if (!params.name)
		{
			cb("No name provided", undefined);
			return undefined;
		}

		setup.getConnection(function(err, client)
		{
			if (err)
			{
				cb(err, undefined);
			}

			client.query({
				name : "insert gallery", 
				text : "INSERT INTO gallery_categories (name, description) VALUES($1, $2)", 
				values: [params.name, params.desc]
			}, cb);
		});
	}

	function getGalleries(cb)
	{
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
					name : "select galleries", 
					text : "SELECT id, name, description FROM gallery_categories WHERE visible = 1"
				}, this);
			}, function(err, results)
			{
				if (err)
				{
					cb(err, undefined);
					return undefined;
				}

				cb(undefined, results.rows);
			});
		})
	}

	function getGalleriesWithHidden(cb)
	{
	    setup.getConnection(function (err, client)
	    {
	        if (err)
	        {
	            cb(err, undefined);
	            return undefined;
	        }

	        fe(function ()
	        {
	            client.query({
	                name: "select galleries hidden",
	                text: "SELECT id, name, description, visible FROM gallery_categories"
	            }, this);
	        }, function (err, results)
	        {
	            if (err)
	            {
	                cb(err, undefined);
	                return undefined;
	            }

	            cb(undefined, results.rows);
	        });
	    })
	}

	function getAllGalleriesWithOneImage(cb)
	{
		setup.getConnection(function(err, client)
		{
			client.query({
				name: "select all galleries with latest image", 
				text: "SELECT c.id, g.name as image, c.name, c.description FROM " +
						"(SELECT i.category, MAX(i.id) as id FROM gallery_images i GROUP BY i.category) as m " +
						"JOIN gallery_images g ON g.id = m.id " + 
						"JOIN gallery_categories c ON g.category = c.id " + 
						"WHERE c.visible = 1;"
			}, function(err, results)
			{
				if (err)
				{
					cb(err, undefined);
					return undefined;
				}
				cb(undefined, results.rows);
			});
		});
	}

	function getGalleryIDAndDescription(gallery, cb)
	{
		setup.getConnection(function(err, client)
		{
			fe(function()
			{
				client.query({
					name: "gallery by name", 
					text: "select id, description from gallery_categories WHERE name = $1", 
					values: [gallery]
				}, this)
			}, function(err, results)
			{
				if (err)
				{
					cb(err, undefined, undefined);
					return undefined;
				}

				if (results.rows.length == 0)
				{
					cb("None found", undefined, undefined);
					return undefined;
				}

				cb(undefined, results.rows[0].id, results.rows[0].description);
			});
		});
	}

	function getImagesInGallery(gallery, cb)
	{
		setup.getConnection(function(err, client)
		{
			getGalleryIDAndDescription(gallery, function(err, id, desc)
			{
				client.query(
				{
					name: "select images in category",
					text: "SELECT id, name, title, description, time FROM gallery_images WHERE category = $1", 
					values: [id]
				}, function(err, results)
				{
					cb(err, results.rows, desc);
				});
			});
		})
	}

	function toggleGallery(galleryID, cb)
    {
        setup.getConnection(function(err, client)
        {
            client.query(
            {
                name: "Get visibility status", 
                text: "SELECT visible FROM gallery_categories WHERE id = $1",
                values: [galleryID]
            }, function(err, results)
            {
                if (err)
                {
                    console.log(err);
                    cb(err);
                    return;
                }

                if (!results.rows || results.rows.length == 0)
                {
                    cb("Not enough rows returned");
                }
                var value = 0;
                if (results.rows[0].visible === 0)
                {
                    value = 1;
                }

                client.query(
                {
                    name: "Make gallery invisible",
                    text: "UPDATE gallery_categories SET visible = $2 WHERE id = $1", 
                    values: [galleryID, value]
                }, function(err, results)
                {
                    cb(err);
                });
            });
        });
    }

    function removeGallery(galleyID, cb)
    {
        setup.getConnection(function (err, client)
        {
            client.query(
            {
                name: "Remove images", 
                text: "DELETE FROM gallery_images WHERE category=$1", 
                values: [galleyID]
            }, function(err, results)
            {
                if (err)
                {
                    console.log(err);
                }

                client.query(
                {
                    name: "Remove Gallery",
                    text: "DELETE FROM gallery_categories WHERE id=$1",
                    values: [galleyID]
                }, function (err, results)
                {
                    cb(err);
                });
            });
        });
    }

	module.exports = {
		gallery:gallery,
		getAllGalleriesWithOneImage:getAllGalleriesWithOneImage,
		getGalleries : getGalleries,
        getGalleriesWithHidden : getGalleriesWithHidden,
		getImagesInGallery:getImagesInGallery,
        toggleGallery : toggleGallery,
        removeGallery : removeGallery,
		image: image,
		regenerateRSSFeedForImages: regenerateRSSFeedForImages
	};
})();
