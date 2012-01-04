
(function()
{
    var setup = require("../utils/setup.js");
    var fe    = require("flow").exec;

    function getCategoryIDByName(name, cb)
    {
        fe(function()
        {
            setup.getConnection(this);
        }, function(err, client)
        {
            if (err) { cb(err); return undefined; }

            var category = name || "uncategorized";

            client.query({
                name : "select tag by name", 
                text : "SELECT id FROM blog_categories WHERE name = $1", 
                values : [category]
            }, this);
        }, function(err, result)
        {
            if (err || result.rows.length == 0)
            {
                cb(err, 1);
                return undefined;
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
                text : "INSERT INTO blog_posts (title, category, content, time) VALUES ($1, $2, $3, NOW())", 
                values: [title, catID, content]
            }, this);
         }, function (err, result)
         {
             cb(err);
         });
    }

    module.exports = {
        post : post,
        getCategoryIDByName : getCategoryIDByName
    };
})();

