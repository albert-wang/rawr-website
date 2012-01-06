var http      = require("http");
var nodeutil  = require("util");
var express   = require("express");
var setup     = require("./utils/setup.js")
var fe        = require("flow").exec;
//temp
var api       = require("./cms/blogapi.js");
var swig      = require("swig");

var app = setup.setup(function(app)
{
    //Routing
    app.get("/", function(req, res)
    {
        setup.getTweets(function(tweets)
        {
            navigation = [
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

            feature = {
                category: "Feature",
                title : "This is some feature text. blah blah blah blah blah blah", 
                text  : "This is some subtext under the feature.",
                link  : "/"
            }

            var twt = setup.swig.compileFile("tweet_block.html");
            var rst = setup.swig.compileFile("rss_block.html");

            blocks = [
                {
                    title: "Twitter",
                    content : twt.render( { tweets : [tweets[0]] })
                }, 
                {
                    title: "RSS", 
                    content : rst.render( { feeds : [ { url: "/", text: "Blog Posts" }]})
                }
            ];

            res.render("main.html", { 
                title : "Title", 
                navigation_blocks: navigation, 
                feature: feature,
                blocks : blocks
            });
        });
    });
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
