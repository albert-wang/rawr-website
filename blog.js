
(function()
{
    var api = require("./cms/blogapi.js")

    function navigation(active, cb)
    {
        api.getAllCategories(function(err, categories)
        {
            var navigation = [
                {
                    link: '/', 
                    title: 'Blog', 
                    text: 'Read the blog', 
                },
                {
                    link: "/",
                    title: "Gallery", 
                    text: "Browse the gallery", 
                },
                {
                    link: "/",
                    title: "Projects", 
                    text: "What I'm working on", 

                },
                {
                    link: '/',
                    title: 'Downloads',
                    text: 'most recent builds and tools',
                }, 
                {
                    link: "/", 
                    title: "About", 
                    text: "About Rawr Productions"
                }
            ];

            for (var i = 0; i < navigation.length; ++i)
            {
                if (navigation[i].title === active) 
                {
                    navigation[i].active = true;
                }
            }

            cb(undefined, navigation);
            return undefined;
        });
    }

    function home(req, res, env)
    {
        var twitterblock = env.swig.compileFile("tweet_block.html");
        var rssblock = env.swig.compileFile("rss_block.html");

        env.getTweets(function(tweets)
        {
            api.postsInCategory("feature", 1, function(err, featured)
            {
                api.postsInCategory(null, 4, function(err, other)
                {
                    navigation("Blog", function(err, navcontents)
                    {
                        var data = {
                            title: "Rawr Productions", 
                            navigation_blocks: navcontents,
                            feature: featured.rows[0],
                            feed: other.rows,
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

    function postapi(req, res, env)
    {
        if (req.body.key !== "{81D6B2F2-1983-4583-9CDE-DA9F6A3B66B7}")
        {
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
                    res.end("Failed to insert a post.");
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
        home    : home, 
        postapi : postapi
    } 
})();


