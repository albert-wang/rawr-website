
(function() 
{
	function combine(obj, result)
	{
		var keys = Object.keys(obj);
		var combined = {};

		var current = 0;
		function next()
		{
			if (current == keys.length) 
			{
				return result(undefined, combined);
			}

			var key = keys[current];
			var target = obj[key];

			return target(function() 
			{
				var e = arguments[0];
				if (e) 
				{
					console.log(key);
					console.log(e);
					return result(e); 
				}

				if (arguments.length === 2)
				{
					combined[key] = arguments[1];
				} else {
					combined[key] = Array.prototype.slice.call(arguments, 1);
				}

				current++;
				next();
			});
		}

		return next();
	};

	module.exports = {
		combine: combine
	};
}());
