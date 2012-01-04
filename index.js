var http      = require("http");
var nodeutil  = require("util");
var mu        = require("mu2");
var express   = require("express");
var render    = require("./utils/rendering.js")

http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain' });

	var greeting = mu.compileText("Hello {{name}}\n");
    render.to(res, greeting, { name : "World" }, null, function()
    {
        res.end();
    });
}).listen(23296);


