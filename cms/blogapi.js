
(function()
{
    var setup = require("../utils/setup.js");
    var flow  = require("flow");
    var rss   = require("rss");
    var filter= require("../utils/swigfilters.js")
    var fe    = flow.exec;
    var fs    = require("fs");

    require("datejs");

    var DEFAULT_ID = 1;
    var INVALID_ID = 0;
    var NOT_FOUND  = -1;
    var POSTS_PER_PAGE = 10;

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

    function getAllCategories(cb)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err)
            {
                cb(err, undefined); 
                return undefined;
            }

            client.query({
                name: "get all categories", 
                text: "SELECT id, name FROM blog_categories", 
            }, cb);
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

    function futurepost(params, time, cb)
    {
        /*
            Params are identical to the one that post takes.
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

            var parsedTime = Date.parse(time);
            console.log("Adding post named '" + params.title + "' to be posted at: " + parsedTime);
            client.query({
                name: "insert future post", 
                text: "INSERT INTO blog_future_posts (json, post_time) VALUES($1, $2)",
                values : [ JSON.stringify(params), parsedTime ]
            }, this);
        }, function(err, results)
        {
            cb(err);
        });
    }

    function postscheduled(cb)
    {
        var now = new Date();
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, c)
        {
            //Used for lambda captures.
            var client = c;
            if (err)
            {
                cb(err);
                return undefined;
            }

            var outer = this;

            client.query({
                name: "get future posts", 
                text: "SELECT json FROM blog_future_posts WHERE post_time <= $1", 
                values: [now]
            }, function(err, results)
            {
                outer(err, results, client);
            });
        }, function(err, results, client)
        {
            if (err)
            {
                cb(err);
                return undefined;
            }

            flow.serialForEach(results.rows, function(row)
            {
                var params = JSON.parse(row.json);
                post(params, this)
            }, function(err, pid)
            {
                if (err)
                {
                    console.log("Failed to insert post.");
                    return undefined;
                }
            }, function()
            {
                client.query({
                    name: "remove future posts",
                    text: "DELETE FROM blog_future_posts WHERE post_time <= $1", 
                    values: [now]
                }, function(err, results)
                {
                    cb(err);
                });
            });
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
                    inner(tag);
                });
            }, function(tag)
            {

            }, function()
            {
                cb(undefined, postID);
            });
        });
    }

    function postsInCategory(optionalCategory, optionalMaximum, optionalPage, cb)
    {
        var page = optionalPage || 0;

        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err)
            {
                cb(err, undefined);
                return undefined; 
            }

            var limit = optionalMaximum || POSTS_PER_PAGE;
            if (!optionalCategory)
            {
                client.query({
                    name: "get posts", 
                    text: "SELECT id, title, category, content, time FROM blog_posts LIMIT $1 OFFSET $2", 
                    values: [limit, page * POSTS_PER_PAGE]
                }, this);
            } else 
            {
                var outer = this;
                getCategoryIDByName(optionalCategory, function(err, cid)
                {
                    if (err)
                    {
                        cb(err, undefined);
                        return undefined;
                    }
                    client.query({
                        name: "get posts by category name", 
                        text: "SELECT id, title, category, content, time " + 
                            "FROM blog_posts WHERE category = $1 LIMIT $2 OFFSET $3", 
                        values: [cid, limit, page * POSTS_PER_PAGE]
                    }, outer);
                });
            }
        }, function(err, posts)
        {
            cb(err, posts);
        });
    }

    function regenerateRSSFeedForPosts(cb)
    {
        var feed = new rss({
            title        : "Rawr Productions Blog Posts", 
            description  : "Most recent blog updates", 
            feed_url     : "http://www.rawrrawr.com/rss/blog.rss", 
            site_url     : "http://www.rawrrawr.com", 
            author       : "Rawr Productions"
        });

        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err)
            {
                cb(err, undefined);
                return undefined;
            }

            client.query({
                name: "get recent posts with category", 
                text: "SELECT p.id, p.title, p.content, p.time, c.name FROM " + 
                    " blog_posts p JOIN blog_categories c ON p.category = c.id" + 
                    " ORDER BY p.time DESC LIMIT $1", 
                values: [30]
            }, this);
        }, function(err, results)
        {
            if (err)
            {
                cb(err, undefined);
                return undefined;
            }

            flow.serialForEach(results.rows, function(post)
            {
                feed.item({
                    title       : post.title, 
                    description : filter.truncate(filter.markdown(post.content), 512), 
                    url         : "http://www.rawrrawr.com/post/" + post.id + "/" + filter.linkify(post.title), 
                    date        : post.time
                });
                this();
            }, function()
            {
                
            }, function()
            {
                var xml = feed.xml();
                fs.writeFile("./static/rss/blog.rss", xml, function(err)
                {
                    cb(err, xml);     
                });
            });
        });
    }


    function base64Decode(text)
    {
        return new Buffer(text, 'base64').toString('utf8');
    }

    module.exports = {
        post                    : post,
        futurepost              : futurepost,
        comment                 : comment,
        getCategoryIDByName     : getCategoryIDByName,
        getTagIDByName          : getTagIDByName,
        postsInCategory         : postsInCategory, 
        getAllCategories        : getAllCategories,
        base64Decode            : base64Decode,

        postscheduled           : postscheduled,
        regenerateRSSFeedForPosts: regenerateRSSFeedForPosts
    };
})();

