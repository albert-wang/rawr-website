
(function()
{
    var api     = require("./cms/blogapi.js")
    var common  = require("./common.js");
    var flow    = require("flow");
	var config  = require("config");
	var utils   = require("./utils/utils");
	var genrun  = require("gen-run");

    function home(req, res, env)
    {
		genrun(function*(run) 
		{
			var twitterblock = env.swig.compileFile("./templates/tweet_block.html");
			var rssblock = env.swig.compileFile("./templates/rss_block.html");

			var tweets = yield env.getTweets(run());
			var featured = yield api.postsInCategory("featured", 1, 0, run());
			var other = yield api.postsInCategory(null, 4, 0, run());
			var navigation = yield common.navigation("home", run());

			var data = {
				title: "Rawr Productions", 
				navigation_blocks: navigation,
				feature: featured ? featured[0] : undefined, 
				feed: other, 
				blocks: [
					{
						title: "Twitter", 
						content: twitterblock({ tweets : [tweets]})
					}, 
					{ 
						title: "RSS", 
						content: rssblock({ feeds: [
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
		genrun(function*(run)
		{
			if (category === "all")
			{
				category = null;
			}

			var categories = yield api.getAllCategories(run());
			var posts = yield api.postsInCategory(category, 5, page, run(3));
			var archives = yield api.postsInCategoryByMonth(category, run());
			var navigation = yield common.navigation("Blog", run());

			for (var i in posts[0]) 
			{
				var post = posts[0][i];
				post.tags = yield api.getTagsOnPost(post.id, run());
			}

			var nolimitCount = posts[1];
			return res.render("blog_category.html", {
				navigation_blocks: navigation, 
				title: category || "Anything and Everything", 
				actual_category: category, 
				feed: posts[0], 

				categories: categories.rowws, 
				count: nolimitCount, 
				archives: archives, 
				pages: Math.floor(nolimitCount / 5)
			});
		});
    }

    function singlepost(req, res, pid)
    {
		genrun(function*(run)
		{
			var id = pid || 0;
			var post = yield api.getPostWithId(id, run());
			var tags = yield api.getTagsOnPost(post.id, run());
			var archives = yield api.postsInCategoryByMonth(post.category, run());
			var navigation = yield common.navigation("Blog", run());

			return res.render("blog_single.html", {
				navigation_blocks: navigation, 
				title: post.title, 
				post: post, 
				tags: tags, 
				archives: archives
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


