
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
                setup.getConnection(this);
            } else if (err)
            {
                cb(err, INVALID_ID);
                return undefined;
            } else 
            {
                cb(err, id);
                return undefined;
            }
        }, function(err, client)
        {
            if (err)
            {
                cb(err, INVALID_ID);
            }

            client.query({
                name : "insert tag", 
                text : "INSERT INTO blog_tags (name) VALUES ($1) RETURNING id", 
                values : [ name ]
            }, this);
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

    function post(params, cb)
    {
        /*
            Params must be an object with the following fields:
                category : the category the post is to be placed in
                title    : title of the post
                content  : content of the post
                tags     : [ list of tags. ]
        */
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
            var inner = this;
            getCategoryIDByName(category, function(err, catID) 
            { 
                if (err)
                {
                    console.log(err);
                    return undefined;
                }

                inner(client, catID); 
            });

         }, function(client, catID)
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

    function comment(params, cb)
    {
        /*
            Params must be an object with the following fields: 
               post     : post id to create the comment on
               author   : author's name
               email    : author's email
               content  : content of the comment
               parent   : optional comment parent
        */

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

            var parent = params.post || 1;
            var author = params.author || "anonymous";
            var email  = params.email || "none@none.com";
            var content = params.content || "?";
            
            client.query({
                name : "insert comment", 
                text : "INSERT INTO blog_comments (parent_post, author, author_email, parent_comment, content, time)" + 
                       " VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id", 
                values : [ parent, author, email, params.parent, content ]
            }, this);
        }, function(err, results)
        {
            if (err)
            {
                cb(err, INVALID_ID);
                return undefined;
            }

            if (results.rows.length == 0)
            {
                cb("Insert did not return id as requested.", INVALID_ID);
                return undefined;
            }

            cb(undefined, results.rows[0].id);
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
                var inner = this;
                fe(function()
                {
                    getOrCreateTagIDByName(tag, this);
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
                    inner();
                });
            }, function()
            {
                //nop
            }, function()
            {
                //Finish
                cb(undefined, postID);
            });
        });
    }

    module.exports = {
        post                    : post,
        comment                 : comment,
        getCategoryIDByName     : getCategoryIDByName,
        getTagIDByName          : getTagIDByName
    };
})();

