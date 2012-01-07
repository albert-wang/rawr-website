
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
                    text: 'nyan nyan nyan', 
                },
                {
                    link: "/",
                    title: "Gallery", 
                    text: "lorem ipsum", 
                },
                {
                    link: "/",
                    title: "Projects", 
                    text: "projects proejcts", 

                },
                {
                    link: '/',
                    title: 'Downloads',
                    text: 'nyancats',
                }, 
                {
                    link: "/", 
                    title: "About", 
                    text: "about about about"
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
                    console.log(other);
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
                                    content: rssblock.render({ feeds: [{ url: "/", text: "Blog Posts" }]})
                                }
                            ]
                        }

                        res.render("main.html", data);
                    });
                });
            });
        });
    }

    module.exports = {
        home: home
    } 
})();


