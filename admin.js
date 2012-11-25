
(function()
{
	var common  = require("./common.js");
	var setup   = require("./utils/setup.js");
	var gapi    = require("./cms/galleryapi.js");
	var api     = require("./cms/blogapi.js");
	var fe      = require("flow").exec;
	var util    = require("util");

    function getStatistics(cb)
    {
        var result = {};

        setup.getConnection(function(err, client)
        {
            fe(function(err)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined;
                }

                client.query("SELECT COUNT(*) AS count FROM blog_posts", this);
            }, function(err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined;
                }

                result.published = results.rows[0].count;

                client.query("SELECT COUNT(*) AS count FROM blog_comments", this);
            }, function(err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined;
                }
        
                result.comments = results.rows[0].count;
                client.query("SELECT COUNT(*) AS count FROM blog_ideas where is_visible=1", this);
            }, function (err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                }

                result.ideas = results.rows[0].count;
                client.query("SELECT COUNT(*) AS count FROM gallery_categories", this);
            }, function(err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined; 
                }

                result.galleries = results.rows[0].count;
                client.query("SELECT COUNT(*) AS count FROM gallery_images", this);
            }, function (err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined;
                }

                result.totalImages = results.rows[0].count;
                this();
            }, function()
            {
                cb(undefined, result);
            });
        });
    }

	function panel(req, res)
	{
		common.navigation("Admin", function(err, navcontents)
		{
			gapi.getGalleries(function(err, galleries)
			{
                api.getAllCategories(function(err, cats)
                {
                    getStatistics(function(err, statistics)
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
					        galllery_categories: galleries, 
                            post_categories: cats.rows,
                            stats: statistics
				        });
                    });
                });
			});
		});
	}

	
    //Idea stuff
	function getIdeaTitles(req, res)
	{
	    if (!req.isAuthenticated())
	    {
	        res.statusCode = 403;
	        res.end();
	        return;
	    }

	    setup.getConnection(function (err, client)
	    {
	        if (err)
	        {
	            res.statusCode = 404;
	            res.end();
	            console.log(err);
	            return;
	        }

	        fe(function ()
	        {
	            client.query("SELECT id, title, content FROM blog_ideas WHERE is_visible=1 ORDER BY id DESC", this)
	        }, function (err, results)
	        {
	            if (err)
	            {
	                res.statusCode = 403;
	                res.end();
	                return;
	            }

	            res.end(JSON.stringify(results.rows));
	        });
	    });
	}

    function publishIdea(req, res)
    {
        setup.getConnection(function (err, client)
        {
            if (err)
            {
                res.statusCode = 403;
                res.end();
                return;
            }

            fe(function ()
            {
                client.query({
                    name: "delete idea",
                    text: "UPDATE blog_ideas SET is_visible=0 WHERE id=$1",
                    values: [req.body.id]
                }, this);
                
            }, function (err, results)
            {
                client.query({
                    name: "Get idea",
                    text: "SELECT id, title, content FROM blog_ideas WHERE id=$1;",
                    values: [req.body.id]
                }, this);
            }, function(err, results)
            {
                api.post({
                    category: req.body.category, 
                    content: results.rows[0].content,
                    title: results.rows[0].title,
                    tags: req.body.tags.split(",")
                }, this);
            }, function(err)
            {
                if (err)
                {
                    res.statusCode = 502;
                    res.end();
                    return;
                }

                res.end();
                return;
            });
        });
    };

    function saveIdea(req, res)
    {
        if (!req.isAuthenticated())
        {
            res.statusCode = 403;
            res.end();
            return;
        }

        setup.getConnection(function (err, client)
        {
            if (err)
            {
                res.statusCode = 403;
                res.end();
                return;
            }

            fe(function ()
            {
                client.query({
                    name: "Insert idea",
                    text: "UPDATE blog_ideas SET title=$1, content=$2 WHERE id=$3",
                    values: [req.body.title, req.body.content, req.body.id]
                }, this);
            }, function (err, results)
            {
                if (err)
                {
                    res.statusCode = 502;
                    res.end();
                    return;
                }

                res.end();
                return;
            });
        });
    }

    function addIdea(req, res)
    {
        if (!req.isAuthenticated())
        {
            res.statusCode = 403;
            res.end();
            return;
        }

        setup.getConnection(function(err, client)
        {
            if (err)
            {
                res.statusCode = 403;
                res.end();
                return;
            }

            fe(function()
            {
                client.query({
                    name: "Insert idea", 
                    text: "INSERT INTO blog_ideas (title, category, content, is_visible) VALUES" + 
                        "($1, 1, '', 1) RETURNING id;",
                    values: [req.body.title]
                }, this);
            }, function(err, results)
            {
                if (err)
                {
                    res.statusCode = 502;
                    res.end();
                    return;
                }

                res.end(JSON.stringify({ id: results.rows[0].id }));
                return;
            });
        });
    }

    function removeIdea(req, res)
    {
        if (!req.isAuthenticated())
        {
            res.statusCode = 403;
            res.end();
            return;
        }

        setup.getConnection(function (err, client)
        {
            if (err)
            {
                res.statusCode = 403;
                res.end();
                return;
            }

            fe(function ()
            {
                client.query({
                    name: "delete idea",
                    text: "DELETE FROM blog_ideas WHERE id=$1",
                    values: [req.body.id]
                }, this);
            }, function (err, results)
            {
                res.end();
                return;
            });
        });
    }
    

    //Post stuff
    function getPostTitles(req, res)
    {
        if (!req.isAuthenticated())
        {
            res.statusCode = 403;
            res.end();
            return;
        }
        
        setup.getConnection(function(err, client)
        {
            if (err)
            {
                res.statusCode = 404;
                res.end();
                console.log(err);
                return;
            }

            fe(function()
            {
                client.query("SELECT id, title, content FROM blog_posts ORDER BY time ASC;", this)
            }, function(err, results)
            {
                if (err)
                {
                    res.statusCode = 403;
                    res.end();
                    return;
                }

                res.end(JSON.stringify(results.rows));
            });
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
			res.end();
		});
	}
    
    function removePost(req, res)
    {
        setup.getConnection(function(err, client)
        {
            client.query({
                name: "Delete referenced tags",
                text: "DELETE FROM blog_tag_bridge WHERE post=$1",
                values: [req.body.id]
            }, function(err, results)
            {
                client.query({
                    name: "Delete post",
                    text: "DELETE FROM blog_posts WHERE id=$1", 
                    values: [req.body.id]
                }, function(err, results)
                {
                    res.end();
                });
            });
        });
    }

    function getGalleries(req, res)
    {
        gapi.getGalleriesWithHidden(function(err, galleries)
        {
            if (err)
            {
                console.log(err);
                res.statusCode = 403;
                res.end();
                return undefined;
            }
            res.end(JSON.stringify(galleries));
        });
    }

    function getGalleryImages(req, res)
    {
        gapi.getImagesInGallery(req.body.id, function(err, images)
        {
            if (err)
            {
                console.log(err);
                res.statusCode = 403;
                res.end();
                return undefined;
            }

            res.end(JSON.stringify(images))
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
	    }, function (err)
	    {
	        if (err)
	        {
	            res.statusCode = 500;
	            return res.end();
	        }

	        res.statusCode = 200;
	        res.end();
	    });
	}

    function toggleGallery(req, res)
    {
        gapi.toggleGallery(req.body.id, function(err)
        {
            if (err)
            {
                console.log(err);
                res.statusCode = 500;
                return res.end();
            }

            res.statusCode = 200;
            res.end();
        });
    }

    function removeGallery(req, res)
    {
        gapi.removeGallery(req.body.id, function (err)
        {
            if (err)
            {
                res.statusCode = 500;
                return res.end();
            }

            res.statusCode = 200;
            res.end();
        });
    }

    function addImage(req, res)
    {
        gapi.image({
            title: req.body.title,
            desc: req.body.desc, 
            image: req.files.image.path, 
            gallery: req.body.gallery,
            type: req.files.image.type
        }, function(err)
        {
            if (err)
            {
                console.log(err);
                res.statusCode = 403;
                res.end();
				return;
            }

            res.writeHead(302, { 'Location': '/admin' });
            res.end();
        });
    }

    function removeImage(req, res)
    {
        gapi.removeImage(req.body.id, function(err)
        {
            if (err)
            {
                console.log(err);
                res.statusCode = 403;
                return res();
                return undefined;
            }

            res.end();
        });
    }
    
    function editImage(req, res)
    {
        gapi.editImage(req.body.id, req.body.title, req.body.desc, function(err)
        {
            if (err)
            {
                console.log(err);
                res.statusCode = 403;
                return res();
                return undefined;
            }

            res.end();
        });
    }

    function preview(req, res)
    {
        var postTemplate = setup.swig.compileFile("post.html");

        //Get the data!
        var context = {};
        context.post = {};
        context.post.time = new Date();
        context.post.content = req.body.content; 
        context.tags = [];

        var tags = req.body.tags.split(",");
        for(var i in tags)
        {
            context.tags.push({ name: tags[i] });
        }

        res.end(postTemplate.render(context));
    }


	module.exports = {
        preview: preview, 

		panel: panel, 
		editpost: editpost,
		getpost: getpost,
        removepost: removePost,
        getPostTitles: getPostTitles,
        getIdeaTitles: getIdeaTitles,

        addIdea: addIdea,
        removeIdea:removeIdea,
        saveIdea: saveIdea,
        publishIdea:publishIdea,

		addGallery: addGallery,
        getGalleries: getGalleries,
        toggleGallery: toggleGallery,
        removeGallery: removeGallery,
        getGalleryImages: getGalleryImages,
        addImage : addImage,
        removeImage : removeImage,
        editImage : editImage
	}

})();

