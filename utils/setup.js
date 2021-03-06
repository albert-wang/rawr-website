
(function()
{
    var express = require("express");
    var swig    = require("swig");
    var fs      = require("fs");
    var pg      = require("pg");
    var tweet   = require("backuptweets");
    var knox    = require("knox");
    var img     = require("imagemagick")
	var log     = require("nogg").logger("webapp")
	var passport= require("passport");
	var ghstrat = require("passport-google-oauth").OAuth2Strategy;
	var config  = require("config");
	var genrun  = require("gen-run");

	console.log = log.debug;
	console.info = log.info;
	console.error = log.error;
	console.warn = log.warn;

	var memoryTimers = {};
	console.time = function(label) {
		memoryTimers[label] = new Date();
	}

	console.timeEnd = function(label) {
		var val = memoryTimers[label];
		if (val) {
			var diff = (new Date()).valueOf() - val.valueOf();
			console.info(label + ": " + diff + "ms");
		}
	}
	
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
				cb(undefined, memoryTweets);
				fs.writeFile("./cache/tweets.json", tweets.json, function(err)
				{
					if (err)
					{
						console.log("Failed to save tweets to disk");
					}
				});
			} else 
			{
				cb(undefined, memoryTweets);
			}
        });
    }

    function setup(routes)
    {
		console.log("Started at " + (new Date()));
		console.time("setup");

        var app = express();
		var filters = require("../utils/swigfilters.js");

		for (var k in filters) 
		{
			swig.setFilter(k, filters[k])
		}

		app.engine("html", swig.renderFile);
		app.set("view engine", "html");
		app.set("views",  __dirname + "/../templates");

        //Middleware
		var loggerFormat = 
			':req[x-forwarded-for] -- [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

        app.use(express.logger({
			format : loggerFormat,
			stream : fs.createWriteStream("./logs/http.log", { flags : "a" })
		}));

		var hour = 60 * 1000 * 60;
		
        app.use(express.static("./static/"), { maxAge: hour * 24 });
        app.use(express.cookieParser())
        app.use(express.session({ secret: "rawr nyancats. Takagamahara is observing you...", cookie: { maxAge: hour }}));
		app.use(passport.initialize());
		app.use(passport.session());
        app.use(express.bodyParser());

		var captured = function(cb)
		{
			return function(req, res) 
			{
				return genrun(function*(run)
				{
					yield* cb(req, res, run);
				});
			}
		}


		app.harmony = {};
		app.harmony.get = function(path, auth, done) 
		{
			if (done == undefined)
			{
				done = auth;
				auth = undefined;
			}

			if (auth === undefined)
			{
				return app.get(path, captured(done));
			} 
			else
			{
				return app.get(path, auth, captured(done));
			}
		}

		app.harmony.post = function(path, auth, done)
		{
			if (done == undefined)
			{
				done = auth;
				auth = undefined;
			}

			if (auth === undefined)
			{
				return app.post(path, captured(done));
			} 
			else
			{
				return app.post(path, auth, captured(done));
			}
		}

		routes(app);

        setInterval(function() { downloadTweets(function(data){ console.log("Finished downloading tweets at " + (new Date()))}) }, 1000 * 60 * 5);

        console.timeEnd("setup");
        return app;
    }

    function schedule(cb)
    {
        cb();
        setInterval(cb, 1000 * 60 * 30);
    }


    function getConnection(cb)
    {
        return pg.connect(connectionString, function(err, client)
        {
            if (err)
            {
                console.log(err);
            }

            return cb(err, client);
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
                	console.log("Failed to read cached tweets, downloading them instead.");
                    downloadTweets(cb);
                    return undefined;
                }

				try
				{
                	memoryTweets = JSON.parse(input)[0];
					cb(undefined, memoryTweets);
				} catch(err)
				{
					cb(err, memoryTweets);
				}
            });
        } else 
        {
            cb(undefined, memoryTweets);
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

