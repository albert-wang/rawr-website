var http      = require("http");
var nodeutil  = require("util");
var express   = require("express");
var setup     = require("./utils/setup.js")
var fe        = require("flow").exec;

//temp
var api       = require("./cms/blogapi.js");

var app = setup.setup(function(app)
{
    //Routing
    app.get("/", function(req, res)
    {
        navigation = [
            {
                link: '/', 
                title: 'Blog', 
                text: 'nyan nyan nyan', 
                active: true
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

        res.render("container.html", { title : "Title", navigation_blocks: navigation, feature: feature });
    });
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
