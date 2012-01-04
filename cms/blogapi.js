
(function()
{
    var setup = require("../utils/setup.js");
    var flow  = require("flow");
    var fe    = flow.exec;

    var DEFAULT_ID = 1;
    var INVALID_ID = 0;
    var NOT_FOUND  = -1;

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
                return cb("No tag with the name: " + name + " was found.", NOT_FOUND);
            }

            cb(undefined, result.rows[0].id);
        });
    }

    function getOrCreateTagIDByName(name, cb)
    {
        fe(function()
        {
            getTagIDByName(name, this);
        }, function(err, id)
        {
            if (err && id == NOT_FOUND)
            {
                client.query({
                    name : "insert tag", 
                    text : "INSERT INTO blog_tags (name) VALUES ($1) RETURNING id", 
                    values : [ name ]
                }, this);
            } else if (err)
            {
                cb(err, INVALID_ID);
                return undefined;
            } else 
            {
                cb(err, id);
                return undefined;
            }
        }, function(err, results)
        {
            if (err)
            {
                cb(err, INVALID_ID);
                return undefined;
            }

            if (results.rows.length == 0)
            {
                cb("Insertion of a tag did not return an ID as it was supposed to", INVALID_ID);
                return undefined;
            }

            cb(undefined, results.rows[0].id);
        });
    }

    /*
        Params must be an object with the following fields:
            category : the category the post is to be placed in
            title    : title of the post
            content  : content of the post
            tags     : [ list of tags. ]
    */
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

             var tags = params.tags || [];

             associateTagsWithPost(result.rows[0].id, tags, cb);
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
                cb(err, INVALID_ID);
                return undefined;
            }
            
            flow.serialForEach(tags, function(tag)
            {
                getOrCreateTagIDByName(name, this);
            }, function(err, tid)
            {
                client.query({
                    name : "bridge tag", 
                    text : "INSERT INTO blog_tag_bridge (post, tag) VALUES ($1, $2)", 
                    values : [postID, tid]
                }, this);
            }, function(err, results)
            {
                if (err)
                {
                    cb(err, INVALID_ID);
                    return undefined;
                }
            }, function()
            {
                cb(undefined, postID);
            });
        });
    }

    module.exports = {
        post                    : post,
        getCategoryIDByName     : getCategoryIDByName,
        getTagIDByName          : getTagIDByName
    };
})();

