(function()
{
	var common = require("./common.js");

    function renderStaticPage(navigationName, file)
    {
        return function*(req, res, run)
        {
			var nav = yield common.navigation(navigationName, run());
			res.render(file, {
				navigation_blocks: nav
			});
        };
    }

	module.exports = {
		projects : renderStaticPage("Projects", "projects.html"),
		downloads: renderStaticPage("Downloads", "downloads.html"),
		about	 : renderStaticPage("About", "about.html")
	};
})();
