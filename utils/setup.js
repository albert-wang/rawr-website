
(function()
{
    var express = require("express");
    var swig    = require("swig");
    var fs      = require("fs");
    var pg      = require("pg");
    var tweet   = require("backuptweets");
    var knox    = require("knox");
    var img     = require("imagemagick")

    var connectionString = "tcp://rraawwrr:password@localhost";
    var memoryTweets = null;

    var s3 = new knox.createClient({
        key: "AKIAJTIODAJRLODKOZFA", 
        secret: "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", 
        bucket: "img.rawrrawr.com"
    });

    if (require("os").type() !== "Linux")
    {
        img.convert.path = "imgconvert";
        img.identify.path = "imgidentify";   
    }

    function downloadTweets(cb)
    {
        tweet({
            "user" : "rraawwrr", 
            "max"  : 3
        }, function(tweets)
        {
            memoryTweets = JSON.parse(tweets.json)[0];
            cb(memoryTweets);
            fs.writeFile("./cache/tweets.json", tweets.json, function(err)
            {
                if (err)
                {
                    console.log("Failed to save tweets to disk");
                }
            });
        });
    }

    function setup(routes)
    {
        var app = express.createServer();
        swig.init({ root: "./templates", allowErrors: true, filters : require("../utils/swigfilters.js") });

        app.register(".html", swig);
        app.set("view engine", "html");
        app.set("views", "./templates");
        app.set("view options", { layout : false });

        //Middleware
        app.use(express.logger({stream : fs.createWriteStream("./logs/http.log", { flags : "a" })}));
        app.use(express.profiler());
        app.use(express.static("./static/"), { maxAge: 1 });
        app.use(express.cookieParser())
        app.use(express.session({ secret: "rawr nyancats. Takagamahara is observing you...", cookie: { maxAge: 60 * 1000 * 60 }}));
        app.use(express.bodyParser());
        app.use(express.router(routes));

        setInterval(function() { downloadTweets(function(data){}) }, 1000 * 60 * 30);

        return app;
    }

    function schedule(cb)
    {
        cb();
        setInterval(cb, 1000 * 60 * 30);
    }


    function getConnection(cb)
    {
        pg.connect(connectionString, function(err, client)
        {
            if (err)
            {
                console.log(err);
            }

            cb(err, client);
        });
    }
    
    function getTweets(cb)
    {
        if (!memoryTweets)
        {
            fs.readFile("./cache/tweets.json", function(err, input)
            {
                if (err || input.length == 0)
                {
                    downloadTweets(cb);
                    return undefined;
                }
                memoryTweets = JSON.parse(input)[0];
                cb(memoryTweets);
            });
        } else 
        {
            cb(memoryTweets);
        }
    }

    module.exports = {
        setup           : setup, 
        schedule        : schedule,
        getConnection   : getConnection,
        getTweets       : getTweets, 
        swig            : swig,
        s3              : s3
    };
})();

