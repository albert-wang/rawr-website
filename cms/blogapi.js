
(function()
{
    var setup = require("../utils/setup.js");
    var fe    = require("flow").exec;

    var DEFAULT_ID = 1;
    var INVALID_ID = 0;

    //Two functions to get values by ID.
    function getCategoryIDByName(name, cb)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err) { cb(err, DEFAULT_ID); return undefined; }

            var category = name || "uncategorized";

            client.query({
                name : "select category by name", 
                text : "SELECT id FROM blog_categories WHERE name = $1", 
                values : [category]
            }, this);
        }, function(err, result)
        {
            if (err || result.rows.length == 0)
            {
                cb(err, DEFAULT_ID);
                return undefined;
            }
            cb(undefined, result.rows[0].id);
        });
    }

    function getTagIDByName(name, cb)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err) { cb(err, INVALID_ID); return undefined; }
            if (!name) { cb("No name provided", INVALID_ID); return undefined; }

            client.query({
                name : "select tag by name", 
                text : "SELECT id FROM blog_tags WHERE name = $1", 
                values : [name]
            }, this);
        }, function(err, result)
        {
            if (err)
            {
                return cb(err, INVALID_ID);
                return undefined;
            }

            if (result.rows.length == 0)
            {
                return cb("No tag with the name: " + name + " was found.", INVALID_ID);
            }

            cb(undefined, result.rows[0].id);
        });
    }

    function post(params, cb)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err)
            {
                cb(err);
                return undefined;
            }

            var category = params.category || "uncategorized";
            getCategoryIDByName(category, this);

         }, function(catID)
         {
            var title = params.title || "Blank Title";
            var content = params.content || "Empty!";

            client.query({
                name : "insert post", 
                text : 
                    "INSERT INTO blog_posts (title, category, content, time) VALUES ($1, $2, $3, NOW()) " + 
                    " RETURNING id ",
                values: [title, catID, content]
            }, this);
         }, function (err, result)
         {
             if (err)
             {
                 cb(err, INVALID_ID);
                 return undefined;
             }

             if (result.length == 0)
             {
                 //Weird.
                 cb("The insert query returned no ids.", INVALID_ID);
                 return undefined;
             }

             cb(undefined, result.rows[0].id);
         });
    }

    function tag(params, cb)
    {
        fe(function()
        {
            setup.getConnection(this)
        }, function(err, client)
        {
            if (err) { cb(err); return undefined; }
        });
    }

    function associateTagsWithPost(postID, tags, cb)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err)
            {
                cb(err);
                return undefined;
            }

            client.query({
                name : "associate tags with post", 

            }, this);
        });
    }

    module.exports = {
        post                    : post,
        getCategoryIDByName     : getCategoryIDByName,
        getTagIDByName          : getTagIDByName
    };
})();

