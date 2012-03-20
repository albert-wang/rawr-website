(function()
{
	var common = require("./common.js");

    function renderStaticPage(navigationName, file)
    {
        return function(req, res)
        {
            common.navigation(navigationName, function(err, navigationblocks)
            {
                res.render(file, {
                    navigation_blocks : navigationblocks
                });
            });
        };
    }

	module.exports = {
		projects : renderStaticPage("Projects", "projects.html"),
		downloads: renderStaticPage("Downloads", "downloads.html"),
		about	 : renderStaticPage("About", "about.html")
	};
})();