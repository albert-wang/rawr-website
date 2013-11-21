
(function()
{
	var common  = require("./common.js");
	var setup   = require("./utils/setup.js");
	var gapi    = require("./cms/galleryapi.js");
	var api     = require("./cms/blogapi.js");
	var fe      = require("flow").exec;
	var util    = require("util");
	var genrun  = require("gen-run");

    function* getStatistics(run)
    {
        var result = {};
		var client = yield setup.getConnection(run());
		result.published = (yield client.query("SELECT COUNT(*) AS count FROM blog_posts", run())).rows[0].count;
		result.comments = (yield client.query("SELECT COUNT(*) AS count FROM blog_comments", run())).rows[0].count;
		result.ideas = (yield client.query("SELECT COUNT(*) AS count FROM blog_ideas where is_visible=1", run())).rows[0].count;
		result.galleries = (yield client.query("SELECT COUNT(*) AS count FROM gallery_categories", run())).rows[0].count;
		result.totalImages = (yield client.query("SELECT COUNT(*) AS count FROM gallery_images", run())).rows[0].count;
		return result;
    }

	function* panel(req, res, run)
	{
		var nav = yield common.navigation("Admin", run());
		var galleries = yield gapi.getGalleries(run());
		var cats = yield api.getAllCategories(run());
		var stats = yield* getStatistics(run);

		res.render("adminauth.html", {
			authed : req.isAuthenticated(),
			title: "Admin Panel", 
			navigation_blocks: nav, 
			galllery_categories: galleries, 
			post_categories: cats.rows,
			stats: stats
		});
	}
	
    //Idea stuff
	function* getIdeaTitles(req, res, run)
	{
		var client = yield setup.getConnection(run());
		var result = yield client.query("SELECT id, title, content FROM blog_ideas WHERE is_visible=1 ORDER BY id DESC", run());

		return res.end(JSON.stringify(result.rows));
	}

    function* publishIdea(req, res, run)
    {
		var client = yield setup.getConnection(run());
		yield client.query({
			name: "delete idea",
			text: "UPDATE blog_ideas SET is_visible=0 WHERE id=$1",
			values: [req.body.id]
		}, run());

		var idea = yield client.query({
			name: "Get idea",
			text: "SELECT id, title, content FROM blog_ideas WHERE id=$1;",
			values: [req.body.id]
		}, run());

		idea = idea.rows[0];
		yield api.post({
			category: req.body.category,
			content: idea.content,
			title: idea.title, 
			tags: req.body.tags.split(",")
		}, run());

		return res.end();
    };

    function* saveIdea(req, res, run)
    {
		var client = yield setup.getConnection(run());
		yield client.query({
			name: "Insert idea",
			text: "UPDATE blog_ideas SET title=$1, content=$2 WHERE id=$3",
			values: [req.body.title, req.body.content, req.body.id]
		}, run());

		return res.end();
    }

    function* addIdea(req, res, run)
    {
		var client = yield setup.getConnection(run());
		var result = yield client.query({
			name: "Insert idea", 
			text: "INSERT INTO blog_ideas (title, category, content, is_visible) VALUES" + 
				"($1, 1, '', 1) RETURNING id;",
			values: [req.body.title]
		}, run());

		return res.end(JSON.stringify({ id: result.rows[0].id }));
    }

    function* removeIdea(req, res, run)
    {
		var client = yield setup.getConnection(run());
		yield client.query({
			name: "delete idea",
			text: "DELETE FROM blog_ideas WHERE id=$1",
			values: [req.body.id]
		}, run());

		return res.end();
    }

    //Post stuff
    function* getPostTitles(req, res, run)
    {
		var client = yield setup.getConnection(run());
		var results = yield client.query("SELECT id, title, content FROM blog_posts ORDER BY time ASC;", run())
		return res.end(JSON.stringify(results.rows));
    }

	function* getpost(req, res, id, run)
	{
		var data = yield api.getPostWithId(id, run());
		return res.end(JSON.stringify({
			content: data.content
		}));
	}

	function* editpost(req, res, run)
	{
		yield api.editpost({
			id: req.body.id, 
			content: req.body.content
		}, run());

		return res.end();
	}
    
    function* removePost(req, res, run)
    {
		var client = yield setup.getConnection(run());
		yield client.query({
			name: "Delete referenced tags",
			text: "DELETE FROM blog_tag_bridge WHERE post=$1",
			values: [req.body.id]
		}, run());

		yield client.query({
			name: "Delete post",
			text: "DELETE FROM blog_posts WHERE id=$1", 
			values: [req.body.id]
		}, run());

		return res.end();
    }

    function* getGalleries(req, res, run)
    {
		var galleries = yield gapi.getGalleriesWithHidden(run());
		return res.end(JSON.stringify(galleries));
    }

    function* getGalleryImages(req, res, run)
    {
		var images = yield gapi.getImagesInGallery(req.body.id, run());
		return res.end(JSON.stringify(images));
    }

	function* addGallery(req, res, run)
	{
		yield gapi.gallery({
			name: req.body.name, 
			desc: req.body.desc
		}, run());

		return res.end();
	}

    function* toggleGallery(req, res, run)
    {
		yield gapi.toggleGallery(req.body.id, run());
		return res.end();
    }

    function* removeGallery(req, res, run)
    {
		yield gapi.removeGallery(req.body.id, run());
		return res.end();
    }

    function* addImage(req, res, run)
    {
        yield gapi.image({
            title: req.body.title,
            desc: req.body.desc, 
            image: req.files.image.path, 
            gallery: req.body.gallery,
            type: req.files.image.type
        }, run());

		res.writeHead(302, { 'Location': '/admin' });
		return res.end();
    }

    function* removeImage(req, res, run)
    {
        yield gapi.removeImage(req.body.id, run());
		return res.end();
    }
    
    function* editImage(req, res, run)
    {
		yield gapi.editImage(req.body.id, req.body.title, req.body.desc, run())
		res.end();
    }

    function preview(req, res)
    {
        var postTemplate = setup.swig.compileFile("./templates/post.html");

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

        res.end(postTemplate(context));
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

