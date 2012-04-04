
(function()
{
    var express = require("express");
    var swig    = require("swig");
    var fs      = require("fs");
    var pg      = require("pg");
    var tweet   = require("backuptweets");
    var knox    = require("knox");
    var img     = require("imagemagick")
	var log     = require("logging").from("webapp");
	var passport= require("passport");
	var ghstrat = require("passport-google-oauth").OAuth2Strategy;
	var config  = require("../config.js");

	console.log = log;
	
	//Network connection string
    var connectionString = config.PSqlConnectionString;
    var memoryTweets = null;

	//Amazon s3 connection tokens.
    var s3 = new knox.createClient(config.S3);

	//Passport authentication settings.
	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});
	
	passport.use(new ghstrat(config.OAuth2Google, function(access, refresh, profile, done)
	{
		for (id in profile.emails)
		{
			var email = profile.emails[id].value;
			if (config.AllowedEmails.indexOf(email) != -1)
			{
				return done(null, profile);
			}
		}
		return done(false, null);
	}));

	//Imagemagic paths.
    if (require("os").type() !== "Linux")
    {
        img.convert.path = "imgconvert";
        img.identify.path = "imgidentify";   
    }

	function requiresAuth(req, res, next)
	{
		if (req.isAuthenticated())
		{
			return next();
		}
		res.redirect("/admin/login/");
	}

    function downloadTweets(cb)
    {
        tweet({
            "user" : config.TwitterUser,
            "max"  : 3
        }, function(tweets)
        {
			if (tweets)
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
			} else 
			{
				cb(memoryTweets);
			}
        });
    }

    function setup(routes)
    {
		console.log("Started at " + (new Date()));

        var app = express.createServer();
        swig.init({ root: "./templates", allowErrors: true, filters : require("../utils/swigfilters.js") });

        app.register(".html", swig);
        app.set("view engine", "html");
        app.set("views", "./templates");
        app.set("view options", { layout : false });

        //Middleware
		var loggerFormat = 
			':req[x-forwarded-for] -- [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';



        app.use(express.logger({
			format : loggerFormat,
			stream : fs.createWriteStream("./logs/http.log", { flags : "a" })
		}));

		var hour = 60 * 1000 * 60;

        app.use(express.profiler());
        app.use(express.static("./static/"), { maxAge: hour * 24 });
        app.use(express.cookieParser())
        app.use(express.session({ secret: "rawr nyancats. Takagamahara is observing you...", cookie: { maxAge: hour }}));
		app.use(passport.initialize());
		app.use(passport.session());
        app.use(express.bodyParser());
        app.use(express.router(routes));

        setInterval(function() { downloadTweets(function(data){}) }, 1000 * 60 * 5);

        //Observe the templates directory, and then reset the swig cache every time something changes in it.
        fs.watchFile("./templates/adminauth.html", function(curr, prev)
        {
            if (curr.mtime !== prev.m_time)
            {
                console.log("A template changed. Resetting the swig caches...");
                swig.init({ root: "./templates", allowErrors: true, filters : require("../utils/swigfilters.js") });
            }
        });

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

				try
				{
                	memoryTweets = JSON.parse(input)[0];
					cb(memoryTweets);
				} catch(err)
				{
					cb(memoryTweets);
				}
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
        s3              : s3,
		requiresAuth    : requiresAuth
    };
})();

