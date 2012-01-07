
(function(){
    var TRUNCATE_LENGTH = 140;
    var mkd = require('markdown')
    var USE_S3 = false;

    function prettyDate(time)
    {
        var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);

        if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
        return;

        return day_diff == 0 && (
            diff < 60 && "just now" ||
            diff < 120 && "1 minute ago" ||
            diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
            diff < 7200 && "1 hour ago" ||
            diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
            day_diff == 1 && "Yesterday" ||
            day_diff < 7 && day_diff + " days ago" ||
            day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
    }

    function truncate(text, length)
    {
        var len = length || TRUNCATE_LENGTH;
        if (text.length > len)
        {
            var indexofspace = text.indexOf(" ", len);
            return text.substr(0, indexofspace - 1) + "...";
        }
        return text;
    }

    function longtruncate(text)
    {
        return truncate(text, 256);
    }

    function linkify(text)
    {
        return text.replace(/\s/g, "-").toLowerCase();
    }

    function markdown(text)
    {
        return mkd.markdown.toHTML(text);
    }

    function imglink(text)
    {
        if (USE_S3)
        {
            return "//img.rawrrawr.com/web/" + text;
        } else 
        {
            return "/img/" + text;
        }
    }

    module.exports = {
        fuzzy_date: prettyDate,
        truncate: truncate,
        longtruncate: longtruncate, 
        linkify : linkify,
        markdown: markdown,
        imglink : imglink
    };
})();
