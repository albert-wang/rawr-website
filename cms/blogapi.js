
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
    var POSTS_PER_PAGE = 5;

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
                cb("Found no results", DEFAULT_ID);
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

	function editpost(params, cb)
	{
		setup.getConnection(function(err, client)
		{
			client.query({
				name: "edit existing post", 
				text: "UPDATE blog_posts SET content=$1 WHERE id=$2", 
				values: [params.content, params.id]
			}, function(err, results)
			{
				if (err)
				{
					cb(err);
					return;
				}
				cb(undefined);
			});
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
                    cb(err, undefined);
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

    //Takes in a post ID and a list of tags, and then
    //inserts them all into the tag bridge.
    function associateTagsWithPost(postID, tags, callback)
    {
    	console.time("tag association");
    	var cb = function(err, rows) {
    		console.timeEnd("tag association");
    		callback(err, rows);
    	}

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
                    //To be honest, I think this can be done through a single query, though i'm not sure what it would be.
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

    function getTagsOnPost(id, callback)
    {
    	console.time("tags on post");
    	var cb = function(err, rows) {
    		console.timeEnd("tags on post");
    		callback(err, rows);
    	}

        setup.getConnection(function(err, client)
        {
            fe(function()
            {
                client.query({
                    name: "get tags on post", 
                    text: "select t.name from blog_tag_bridge p JOIN blog_tags t ON t.id = p.tag WHERE p.post = $1 ", 
                    values: [id]
                }, this)
            }, function(err, results)
            {
                 if (err)
                 {
                     cb(err, undefined);
                     return undefined;
                 }
                 cb(undefined, results.rows);
            });
        });
    }

    function getPostWithId(pid, callback)
    {
    	console.time("post with id");
    	var cb = function(err, rows) {
    		console.timeEnd("post with id");
    		callback(err, rows);
    	}

        setup.getConnection(function(err, client)
        {
            if (err)
            {
                cb(err, undefined);
                return undefined;
            }

            client.query({
                name: "get single post by id", 
                text: "SELECT id, title, category, content, time FROM blog_posts WHERE id = $1", 
                values: [pid]
            }, function(err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined;
                }

				if (results.rowCount === 0)
				{
					cb("No values", undefined);
					return undefined;
				}

                cb(undefined, results.rows[0]);
            });
        });
    }

    function totalPostsInCategory(optionalCategory, callback)
    {
    	console.time("posts in category count");
    	var cb = function(err, rows) {
    		console.timeEnd("posts in category count");
    		callback(err, rows);
    	}

        setup.getConnection(function(err, client)
        {
            if (err)
            {
                cb(err, undefined);
                return undefined;
            }

            fe(function()
            {
                if (!optionalCategory)
                {
                    client.query({
                        name: "get number of posts", 
                        text: "SELECT count(*) AS c FROM blog_posts",
                    }, this);
                } else 
                {
                    client.query({
                        name: "get number of posts by category name", 
                        text: "SELECT count(*) AS c FROM blog_posts WHERE category = $1", 
                        values: [optionalCategory]
                    }, this);
                }
            }, function(err, results)
            {
                if (err)
                {
                    cb(err, undefined);
                    return undefined;
                }

                cb(undefined, results.rows[0].c)
            });
        });
    }

    function postsInCategoryByMonth(optionalCategory, callback)
    {
    	console.time("posts in category by month");
    	var cb = function(err, rows) {
    		console.timeEnd("posts in category by month");
    		callback(err, rows);
    	}

        setup.getConnection(function(err, client)
        {
            if (!optionalCategory)
            {
                client.query({
                    name: "group posts by date", 
                    text: "SELECT COUNT(*) AS count, DATE_PART('YEAR', time) AS year, " + 
                        "DATE_PART('MONTH', time) AS month FROM blog_posts GROUP BY month,year " + 
						"ORDER BY year DESC, month DESC"
                }, function(err, results)
                {
                    if (err)
                    {
                        cb(err, undefined);
                        return undefined;
                    }
                    cb(undefined, results.rows);
                });
            } else 
            {
                if (typeof optionalCategory === "number")
                {
                     client.query({
                        name: "group posts by category name and by date with id", 
                        text: "SELECT COUNT(*) as count, DATE_PART('YEAR', time) AS year, " + 
                            "DATE_PART('MONTH', time) AS month FROM blog_posts WHERE category = $1 GROUP BY month, year " + 
                            "ORDER BY year DESC, month DESC",
                        values: [optionalCategory]
                    }, function(err, posts)
                    {
                        if (err)
                        {
                            cb(err, undefined);
                            return undefined;
                        }
                        cb(err, posts.rows, optionalCategory);
                    });
                } else 
                {
                    getCategoryIDByName(optionalCategory, function(err, cid)
                    {
                        if (err)
                        {
                            cb(err, undefined);
                            return undefined;
                        }

                        client.query({
                            name: "group posts by category name and by date", 
                            text: "SELECT COUNT(*) as count, DATE_PART('YEAR', time) AS year, " + 
                                "DATE_PART('MONTH', time) AS month FROM blog_posts WHERE category = $1 GROUP BY month, year " + 
                                "ORDER BY year DESC, month DESC", 
                            values: [cid]
                        }, function(err, posts)
                        {
                            if (err)
                            {
                                cb(err, undefined);
                                return undefined;
                            }
                            cb(err, posts.rows, cid);
                        });
                    });
                }
            }
        });
    }

    function postsInCategory(optionalCategory, optionalMaximum, optionalPage, callback)
    {
        var page = optionalPage || 0;

        console.time("posts in category");
    	var cb = function(err, rows, count) {
    		console.timeEnd("posts in category");
    		callback(err, rows, count);
    	};

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
                    text: "SELECT id, title, category, content, time FROM blog_posts ORDER BY time DESC LIMIT $1 OFFSET $2", 
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
                            "FROM blog_posts WHERE category = $1 ORDER BY time DESC LIMIT $2 OFFSET $3", 
                        values: [cid, limit, page * POSTS_PER_PAGE]
                    }, function(err, posts)
                    {
                        outer(err, posts, cid);
                    });
                });
            }
        }, function(err, posts, cid)
        {
            totalPostsInCategory(cid, function(err, count)
            {
                cb(err, posts.rows, count);        
            });
        });
    }

    function postsInCategoryByDate(optionalCategory, year, month, callback)
    {
    	console.time("posts in category by date");
    	var cb = function(err, rows) {
    		console.timeEnd("posts in category by date");
    		callback(err, rows);
    	}

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

            if (!optionalCategory)
            {
                client.query({
                    name: "get posts date", 
                    text: "SELECT id, title, category, content, time FROM blog_posts " +
                        "WHERE DATE_PART('YEAR', time) = $1 AND DATE_PART('MONTH', time) = $2 ORDER BY time DESC", 
                    values: [year, month]
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
                        name: "get posts by category name date", 
                        text: "SELECT id, title, category, content, time " + 
                            "FROM blog_posts WHERE category = $1 AND DATE_PART('YEAR', time) = $2 AND DATE_PART('MONTH', time) = $3 " + 
                            "ORDER BY time DESC",
                        values: [cid, year, month]
                    }, function(err, posts)
                    {
                        outer(err, posts, cid);
                    });
                });
            }
        }, function(err, posts, cid)
        {
        	console.log("Querying for posts in " + optionalCategory + " at " + year + "/" + month + " returned " + posts.rows.length + " entries.");
            cb(err, posts.rows);
        });
    }

    function regenerateRSSFeedForPosts(cb)
    {
    	console.time("RSS Generation");
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
                	console.log("Finished regenerating RSS feeds.")
                	console.timeEnd("RSS Generation");
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
        base64Decode            : base64Decode,
        comment                 : comment,
        futurepost              : futurepost,
        getAllCategories        : getAllCategories,
        getCategoryIDByName     : getCategoryIDByName,
        getPostWithId           : getPostWithId,
        getTagIDByName          : getTagIDByName,
        getTagsOnPost           : getTagsOnPost,
        post                    : post,
        postscheduled           : postscheduled,
        postsInCategory         : postsInCategory, 
		editpost				: editpost,
        regenerateRSSFeedForPosts: regenerateRSSFeedForPosts,
        totalPostsInCategory    : totalPostsInCategory,
        postsInCategoryByMonth  : postsInCategoryByMonth,
        postsInCategoryByDate   : postsInCategoryByDate
    };
})();

