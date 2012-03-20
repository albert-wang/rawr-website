
(function()
{
    var api     = require("./cms/blogapi.js")
    var common  = require("./common.js");
    var flow    = require("flow");
	var config  = require("./config.js");

    var twitterblock = env.swig.compileFile("tweet_block.html");
    var rssblock = env.swig.compileFile("rss_block.html");

    function home(req, res, env)
    {
        env.getTweets(function(tweets)
        {
            api.postsInCategory("featured", 1, 0, function(err, featured)
            {
                api.postsInCategory(null, 4, 0, function(err, other)
                {
                    common.navigation("Home", function(err, navcontents)
                    {
                        var data = {
                            title: "Rawr Productions", 
                            navigation_blocks: navcontents,
                            feature: featured ? featured[0] : undefined,
                            feed: other,
                            blocks: [
                                {
                                    title: "Twitter", 
                                    content: twitterblock.render({ tweets : [tweets[0]]})
                                }, 
                                { 
                                    title: "RSS", 
                                    content: rssblock.render({ feeds: [
                                        { url: "/rss/blog.rss", text: "Blog Posts" }, 
                                        { url: "/rss/gallery.rss", text: "Gallery Updates" },
                                    ]})
                                }
                            ]
                        }

                        res.render("main.html", data);
                    });
                });
            });
        });
    }

    function category(req, res, category, page)
    {
        if (category === "all")
        {
            category = null;
        }

        api.getAllCategories(function(err, categories)
        {
            api.postsInCategory(category, 5, page, function(err, posts, nolimitCount)
            {
                api.postsInCategoryByMonth(category, function(err, archives)
                {
                    if (err || !posts)
                    {
                        console.log(err);
                        res.end();
                        return undefined;
                    }

                    flow.serialForEach(posts, function(post)
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
                        common.navigation("Blog", function(err, navcontents)
                        {
                            res.render("blog_category.html", {
                               navigation_blocks: navcontents, 
                               title: category || "Anything and Everything", 
                               actual_category: category,
                               feed: posts, 
                               categories : categories.rows, 
                               count: nolimitCount,
                               archives: archives,
                               pages: Math.floor(nolimitCount / 5)
                            });
                        });    
                    });
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

            api.getTagsOnPost(post.id, function(err, tags)
            {
                api.postsInCategoryByMonth(post.category, function(err, archives)
                {
                    common.navigation("Blog", function(err, navcontents)
                    {
                        res.render("blog_single.html", {
                            navigation_blocks: navcontents,
                            title: post.title, 
                            post : post, 
                            tags : tags, 
                            archives: archives
                        });
                    });
                });
            });
        });
    }

    function archives(req, res, cat, year, month)
    {
        api.getAllCategories(function(err, categories)
        {
            api.postsInCategoryByDate(cat, year, month, function(err, posts)
            {
                api.postsInCategoryByMonth(cat, function(err, archives)
                {
                    if (err || !posts)
                    {
                        console.log(err);
                        res.end();
                        return undefined;
                    }

                    flow.serialForEach(posts, function(post)
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
                        common.navigation("Blog", function(err, navcontents)
                        {
                            res.render("blog_category.html", {
                               navigation_blocks: navcontents, 
                               title: cat || "Anything and Everything", 
                               actual_category: cat,
                               archive_date: new Date(year, month - 1, 1),
                               feed: posts, 
                               categories : categories.rows, 
                               archives: archives,
                            });
                        });    
                    });
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


