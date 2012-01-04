var http      = require("http");
var util      = require("util");
var mu        = require("mu2");


http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain' });

	var greeting = mu.compileText("Hello {{name}}\n");
	
	mu.renderText("Hello, {{name}}\n", { name : "World" }, null)
		.on('data', function(c) { res.write(c); })
		.on('end', function() { res.end(); });

}).listen(23296);


