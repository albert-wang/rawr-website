
(function()
{
	function navigation(active, cb)
	{
        var navigation = [
			{
				link: '/',
				title: 'Home',
				text: 'The Frontpage'
			},
            {
                link: '/blog/all', 
                title: 'Blog', 
                text: 'Read the blog', 
            },
            {
                link: "/gallery",
                title: "Gallery", 
                text: "Browse the gallery", 
            },
            {
                link: "/projects",
                title: "Projects", 
                text: "What I'm working on", 

            },
            {
                link: '/downloads',
                title: 'Downloads',
                text: 'most recent builds and tools',
            }, 
            {
                link: "/about", 
                title: "About", 
                text: "About Rawr Productions"
            }
        ];

        for (var i = 0; i < navigation.length; ++i)
        {
            if (navigation[i].title === active) 
            {
                navigation[i].active = true;
            }
        }

        cb(undefined, navigation);
        return undefined;
	}

	module.exports = {
		navigation : navigation
	}
})();
