
(function()
{
    var api = require("./cms/blogapi.js")

    function navigation(active)
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

        return navigation;
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
                    featured = {
                        title: "This is some featured title", 
                        text: "this is some long text sasdfkl;asfua o;dfiuas;foyasd f;asidfja; sdifha s;dfja" + 
                            "longer longer dfas df;aofdyua; fasi;oy a;sdfiu as;iofajfo; asf8asiyf o;asdfuias;f as",
                    }

                    other = [
                        {
                            title: "This is a blog title",
                            content: "This is some content. Lorem ipsum dolor sit amet"
                        },
                        {
                            title: "This is a blog title",
                            content: "This is some content. Lorem ipsum dolor sit amet"
                        },
                        {
                            title: "This is a blog title",
                            content: "#This is some content#\n. Lorem ipsum dolor sit amet. This is some seriously longer" + 
                                " content, which can take up over nine thousand lines. sadfla;sdf asdiofaso;fias dfasf"
                        },
                        {
                            title: "This is a blog title",
                            content: "This is some content. Lorem ipsum dolor sit amet"
                        }
                    ]


                    var data = {
                        title: "Rawr Productions", 
                        navigation_blocks: navigation("Home"), 
                        feature: featured,
                        feed: other,
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
    }

    module.exports = {
        home: home
    } })();


