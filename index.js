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
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            this();
        });

        res.render("container.html", { Title : "Title" });
    });

    //API stuff
    app.post("/api/blog/post/?", function(req, res)
    {
        res.render("container.html", { Title : "Title" });
    });

    app.get("/api/blog/post/?", function(req, res)
    {
        res.render("container.html", { Title : "Title" });
    });

    app.get("/api/blog/categoryid/:name/?", function(req, res)
    {
        api.getCategoryIDByName(req.params.name, function(err, id)
        {
            if (err)
            {
                console.log(err);
            }
            res.render("container.html", { Title : id });
        });
    });
});

api.post({
   category : "programming", 
   title    : "Hello, World!", 
   content  : "Hey", 
   tags     : [
    "Hello", "World"
   ]

}, function(err, pid)
{
    api.comment({
        post : pid,
        author: "Me",
        email : "asdf@gmail.com",
        contents: "Hey, it worked!", 
    }, function(err, cid)
    {
        console.log("Got: " + pid + " and " + cid);
    });
});

//Listen
app.listen(23296);
console.log("Listening on port 23296");
