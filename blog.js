
(function()
{
    var api     = require("./cms/blogapi.js")
    var common  = require("./common.js");
    var flow    = require("flow");
	var config  = require("config");
	var utils   = require("./utils/utils");

    function home(req, res, env)
    {
        var twitterblock = env.swig.compileFile("tweet_block.html");
        var rssblock = env.swig.compileFile("rss_block.html");

		utils.combine({
			"tweets"    : env.getTweets.bind(env),
			"featured"  : api.postsInCategory.bind(api, "featured", 1, 0), 
			"other"     : api.postsInCategory.bind(api, null, 4, 0),
			"navigation": common.navigation.bind(common, "home")
		}, function(err, result)
		{
			if (err) {
				console.log(err); 
			}
			var data = {
				title: "Rawr Productions", 
				navigation_blocks: result.navigation,
				feature: result.featured[0] ? result.featured[0][0] : undefined, 
				feed: result.other[0], 
				blocks: [
					{
						title: "Twitter", 
						content: twitterblock.render({ tweets : [result.tweets[0]]})
					}, 
					{ 
						title: "RSS", 
						content: rssblock.render({ feeds: [
							{ url: "/rss/blog.rss", text: "Blog Posts" }, 
							{ url: "/rss/gallery.rss", text: "Gallery Updates" },
						]})
					}
				]
			};

			res.render("main.html", data);
		});
    }

    function category(req, res, category, page)
    {
        if (category === "all")
        {
            category = null;
        }

		utils.combine({
			"categories" : api.getAllCategories.bind(api),
			"posts"      : api.postsInCategory.bind(api, category, 5, page),
			"archives"   : api.postsInCategoryByMonth.bind(api, category),
			"navigation" : common.navigation.bind(common, "Blog")
		}, function(err, result)
		{
			if (err || !result.posts)
			{
				console.log(err);
				return res.end();
			}

			flow.serialForEach(result.posts[0], function(post) 
			{
				var self = this;
				api.getTagsOnPost(post.id, function(err, tags) 
				{
					post.tags = tags;
					self();
				});
			}, 
			function()
			{},
			function() 
			{
				var nolimitCount = result.posts[1];
				res.render("blog_category.html", {
					navigation_blocks: result.navigation, 
					title: category || "Anything and Everything", 
					actual_category: category, 
					feed: result.posts[0], 
					categories : result.categories.rows, 
					count: nolimitCount,
					archives: result.archives, 
					pages: Math.floor(nolimitCount / 5)
				});
			});
		});
    }

    function singlepost(req, res, pid)
    {
        api.getPostWithId(pid, function(err, post)
        {
			if (err)
			{
				console.log("Post with id: " + pid + " does not exist");
				res.statusCode = 404;
				res.end();
				return;
			}

			utils.combine({
				"tags"       : api.getTagsOnPost.bind(api, post.id), 
				"archives"   : api.postsInCategoryByMonth.bind(api, post.category),
				"navigation" : common.navigation.bind(common, "Blog")
			}, function(err, d)
			{
				return res.render("blog_single.html", {
					navigation_blocks: d.navigation, 
					title: post.title, 
					post: post, 
					tags: d.tags, 
					archives: d.archives
				});
			});
        });
    }

    function archives(req, res, cat, year, month)
    {
		utils.combine({
			"categories" : api.getAllCategories.bind(api), 
			"posts"      : api.postsInCategoryByDate.bind(api, cat, year, month), 
			"archives"   : api.postsInCategoryByMonth.bind(api, cat), 
			"navigation" : common.navigation.bind(common, "Blog")
		}, function(err, d) 
		{
			if (err || !d.posts)
			{
				console.log(err);
				return res.end();
			}

			flow.serialForEach(d.posts, function(post)
			{
				var outer = this;
				api.getTagsOnPost(post.id, function(err, tags)
				{
					post.tags = tags;
					outer();
				});
			}, function()
			{
			}, function()
			{
				res.render("blog_category.html", {
				   navigation_blocks: d.navigation, 
				   title: cat || "Anything and Everything", 
				   actual_category: cat,
				   archive_date: new Date(year, month - 1, 1),
				   feed: d.posts, 
				   categories : d.categories.rows, 
				   archives: d.archives,
				});
			});
		});
    }

    function postapi(req, res, env)
    {
        if (req.body.key !== config.API_KEY)
        {
            res.statusCode = 403;
            res.end();
            return undefined;
        }

        var postContent = {
            title   : api.base64Decode(req.body.title).toLowerCase(), 
            content : api.base64Decode(req.body.post),
            category: api.base64Decode(req.body.category),
            tags    : api.base64Decode(req.body.tags).split(',')
        }

        var date = null;
        if (req.body.date)
        {
            date = api.base64Decode(req.body.date);
        }

        if (!date)
        {
            api.post(postContent, function(err, id)
            {
                if (err)
                {
                    res.end("Failed to insert a post:" + err);
                } else 
                {
                    res.end("http://www.rawrrawr.com/post/" + id);
                }
            });
        } else 
        {
            api.futurepost(postContent, date, function(err)
            {
                if (err)
                {
                    res.end("Failed to insert a future post.");
                } else 
                {
                    res.end("http://www.rawrrawr.com");
                }
            });
        }
    }

    module.exports = {
        home        : home, 
        postapi     : postapi,
        category    : category,
        singlepost  : singlepost,
        archives    : archives
    } 
})();


